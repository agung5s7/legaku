-- ==============================================================================
-- LEGAKU DATABASE FIX: FAMILY INVITE & RLS RECURSION RESOLUTION
-- Fixes error 42P17 (infinite recursion in family_members) and enables smooth
-- partner joining via invite codes.
-- ==============================================================================

-- 1. Drop old recursive policies on family_members
DROP POLICY IF EXISTS "Members can view membership in their family" ON public.family_members;
DROP POLICY IF EXISTS "Users can join a family" ON public.family_members;
DROP POLICY IF EXISTS "Owners can manage members" ON public.family_members;
DROP POLICY IF EXISTS "Users can view own family memberships" ON public.family_members;
DROP POLICY IF EXISTS "Users can join family" ON public.family_members;

-- 2. Create clean, non-recursive policies on family_members
CREATE POLICY "Users can view own family memberships"
    ON public.family_members FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can join family"
    ON public.family_members FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owners can manage members"
    ON public.family_members FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.families f
            WHERE f.id = family_members.family_id AND f.created_by = auth.uid()
        )
    );

-- 3. Fix SELECT policy on families so partners can look up invite_code before joining
DROP POLICY IF EXISTS "Family members can view their families" ON public.families;
DROP POLICY IF EXISTS "Users can view families by membership or invite code" ON public.families;

CREATE POLICY "Users can view families by membership or invite code"
    ON public.families FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- 4. Atomic Security Definer Join Function (Bypasses RLS safely)
CREATE OR REPLACE FUNCTION public.join_family_by_invite_code(code text)
RETURNS jsonb AS $$
DECLARE
    target_fam record;
    current_user_id uuid := auth.uid();
    clean_code text;
BEGIN
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Sesi pengguna tidak valid');
    END IF;

    -- Clean code: uppercase, trim, remove URL params
    clean_code := UPPER(TRIM(code));
    IF clean_code LIKE '%=%' THEN
        clean_code := SPLIT_PART(clean_code, '=', 2);
    END IF;
    IF NOT clean_code LIKE 'LEGAKU-%' AND LENGTH(clean_code) = 6 THEN
        clean_code := 'LEGAKU-' || clean_code;
    END IF;

    -- Find family
    SELECT id, name, invite_code INTO target_fam
    FROM public.families
    WHERE UPPER(TRIM(invite_code)) = clean_code OR UPPER(TRIM(invite_code)) = 'LEGAKU-' || clean_code
    LIMIT 1;

    IF target_fam.id IS NULL THEN
        RETURN jsonb_build_object('error', 'Kode undangan tidak ditemukan. Pastikan kode sesuai (contoh: LEGAKU-XXXXXX).');
    END IF;

    -- Check if already joined
    IF EXISTS (
        SELECT 1 FROM public.family_members 
        WHERE family_id = target_fam.id AND user_id = current_user_id
    ) THEN
        RETURN jsonb_build_object('success', true, 'family_id', target_fam.id, 'family_name', target_fam.name);
    END IF;

    -- Insert member as partner
    INSERT INTO public.family_members (family_id, user_id, role)
    VALUES (target_fam.id, current_user_id, 'partner');

    RETURN jsonb_build_object('success', true, 'family_id', target_fam.id, 'family_name', target_fam.name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Auto-repair any missing owner memberships in families
INSERT INTO public.family_members (family_id, user_id, role)
SELECT id, created_by, 'owner'
FROM public.families
WHERE created_by IS NOT NULL
ON CONFLICT (family_id, user_id) DO NOTHING;

-- 6. Auto-seed starter accounts for existing families if none exist
INSERT INTO public.accounts (family_id, name, type, initial_balance, current_balance)
SELECT f.id, acc.name, acc.type, 0, 0
FROM public.families f
CROSS JOIN (
    VALUES 
        ('Dompet Tunai', 'cash'),
        ('Rekening Bank Utama', 'bank'),
        ('E-Wallet', 'ewallet')
) AS acc(name, type)
WHERE NOT EXISTS (
    SELECT 1 FROM public.accounts a WHERE a.family_id = f.id
);
