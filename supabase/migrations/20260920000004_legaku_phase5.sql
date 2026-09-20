-- ==============================================================================
-- LEGAKU DATABASE SCHEMA MIGRATION: PHASE 5
-- Launch Readiness, Beta Validation, Security & Production Hardening
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. BETA INVITES TABLE
-- Manages invite-only beta onboarding tokens
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.beta_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'suspended', 'revoked')),
    invite_token VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    redeemed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_beta_invites_token ON public.beta_invites(invite_token);
CREATE INDEX IF NOT EXISTS idx_beta_invites_email ON public.beta_invites(email);
CREATE INDEX IF NOT EXISTS idx_beta_invites_status ON public.beta_invites(status);

-- ------------------------------------------------------------------------------
-- 2. FEEDBACK TABLE
-- Captures user bug reports, ideas, and questions
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    family_id UUID REFERENCES public.families(id) ON DELETE SET NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('bug', 'saran', 'pengalaman', 'pertanyaan')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    screenshot_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'planned', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_family ON public.feedback(family_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON public.feedback(created_at DESC);

-- ------------------------------------------------------------------------------
-- 3. SECURE FOUNDER CODES TABLE & RPC
-- Authoritative server-side validation to prevent secret leak in frontend JS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.founder_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code_hash TEXT UNIQUE NOT NULL, -- SHA-256 hashed code
    label TEXT NOT NULL,
    max_redemptions INT NOT NULL DEFAULT 100,
    times_redeemed INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed hash for VIP early adopters (SHA-256 for 'LEGAKUFOUNDER', 'LEGA2026', 'VIPLIFETIME')
-- Pre-calculated SHA-256 hashes:
-- LEGAKUFOUNDER = 81e5b7b99c7595eefbc88439df608405d4b47a13c9ef804ff6ae6a4ba2ff45e0
-- LEGA2026 = 7fba7ebcc9a8507871bfaeb28cf56f5c875d7146522c0617ad4f4454f7a26f04
INSERT INTO public.founder_codes (code_hash, label, max_redemptions)
VALUES 
('81e5b7b99c7595eefbc88439df608405d4b47a13c9ef804ff6ae6a4ba2ff45e0', 'Official Founder Lifetime Launch Code', 500),
('7fba7ebcc9a8507871bfaeb28cf56f5c875d7146522c0617ad4f4454f7a26f04', 'Early Beta 2026 Supporter', 200)
ON CONFLICT (code_hash) DO NOTHING;

-- RPC: Redeem Founder Code Securely
CREATE OR REPLACE FUNCTION public.redeem_founder_code(input_code_hash TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_founder_code RECORD;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Autentikasi diperlukan.');
    END IF;

    -- Lookup code by hash
    SELECT * INTO v_founder_code
    FROM public.founder_codes
    WHERE code_hash = input_code_hash
      AND is_active = true
      AND times_redeemed < max_redemptions;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Kode Founder tidak valid atau kuota telah habis.');
    END IF;

    -- Increment redemption count
    UPDATE public.founder_codes
    SET times_redeemed = times_redeemed + 1
    WHERE id = v_founder_code.id;

    -- Upsert subscription to founder_lifetime
    INSERT INTO public.subscriptions (user_id, plan_slug, status, started_at, provider)
    VALUES (v_user_id, 'founder_lifetime', 'active', now(), 'founder_entitlement')
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        plan_slug = 'founder_lifetime',
        status = 'active',
        updated_at = now();

    RETURN jsonb_build_object('success', true, 'message', 'Selamat! Akses Founder Lifetime seumur hidup telah aktif.');
END;
$$;

-- ------------------------------------------------------------------------------
-- 4. SECURE ACCOUNT DELETION RPC
-- Handles cascading user profile deletion and family isolation safely
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_family_id UUID;
    v_member_count INT;
    v_is_owner BOOLEAN;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Pengguna belum terautentikasi.');
    END IF;

    -- Check user family memberships
    FOR v_family_id IN 
        SELECT family_id FROM public.family_members WHERE user_id = v_user_id
    LOOP
        -- Count total members in this family
        SELECT COUNT(*) INTO v_member_count
        FROM public.family_members
        WHERE family_id = v_family_id;

        SELECT (role = 'owner') INTO v_is_owner
        FROM public.family_members
        WHERE family_id = v_family_id AND user_id = v_user_id;

        -- If user is the only member, remove the family and cascading records
        IF v_member_count <= 1 THEN
            DELETE FROM public.families WHERE id = v_family_id;
        ELSE
            -- If user is owner of a multi-member family, pass ownership to next member
            IF v_is_owner THEN
                UPDATE public.family_members
                SET role = 'owner'
                WHERE id = (
                    SELECT id FROM public.family_members
                    WHERE family_id = v_family_id AND user_id <> v_user_id
                    ORDER BY joined_at ASC LIMIT 1
                );
            END IF;
            -- Remove user membership
            DELETE FROM public.family_members
            WHERE family_id = v_family_id AND user_id = v_user_id;
        END IF;
    END LOOP;

    -- Delete user profile (cascades to subscriptions, ai_usage)
    DELETE FROM public.profiles WHERE id = v_user_id;

    -- Delete auth.users record safely
    DELETE FROM auth.users WHERE id = v_user_id;

    RETURN jsonb_build_object('success', true, 'message', 'Akun dan seluruh data personal berhasil dihapus secara permanen.');
END;
$$;

-- ------------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.beta_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.founder_codes ENABLE ROW LEVEL SECURITY;

-- Beta Invites
CREATE POLICY "Public can check active invite by token"
    ON public.beta_invites FOR SELECT
    USING (status = 'invited' AND expires_at > now());

CREATE POLICY "Authenticated users can view invites they sent"
    ON public.beta_invites FOR SELECT
    USING (auth.uid() = invited_by);

CREATE POLICY "Authenticated users can create beta invites"
    ON public.beta_invites FOR INSERT
    WITH CHECK (auth.uid() = invited_by);

-- Feedback
CREATE POLICY "Users can create feedback"
    ON public.feedback FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view their own feedback"
    ON public.feedback FOR SELECT
    USING (auth.uid() = user_id OR (family_id IS NOT NULL AND public.is_family_member(family_id)));

-- Founder codes are NOT directly selectable by client (only via redeem_founder_code RPC)
CREATE POLICY "Founder codes inaccessible directly from client"
    ON public.founder_codes FOR SELECT
    USING (false);
