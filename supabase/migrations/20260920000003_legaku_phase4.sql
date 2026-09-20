-- ==============================================================================
-- LEGAKU DATABASE SCHEMA MIGRATION: PHASE 4
-- Growth, Monetization & Product Polish
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PLANS TABLE
-- Configurable subscription tiers: Free, Plus, Family, Founder Lifetime
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price_monthly BIGINT NOT NULL DEFAULT 0,
    price_yearly BIGINT NOT NULL DEFAULT 0,
    monthly_ai_limit INT NOT NULL DEFAULT 15,
    monthly_receipt_limit INT NOT NULL DEFAULT 5,
    monthly_voice_limit INT NOT NULL DEFAULT 10,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed initial plans
INSERT INTO public.plans (slug, name, description, price_monthly, price_yearly, monthly_ai_limit, monthly_receipt_limit, monthly_voice_limit, features)
VALUES 
(
    'free',
    'LEGAKU Free',
    'Teman esensial untuk pencatatan dan pengelolaan keuangan keluarga dasar.',
    0,
    0,
    15,
    5,
    10,
    '["Pencatatan manual tanpa batas", "Daftar rekening keluarga", "Batas anggaran & target impian dasar", "Review keuangan bulanan standar", "15x tanya LEGAKU AI per bulan", "5x scan foto struk per bulan"]'::jsonb
),
(
    'plus',
    'LEGAKU Plus',
    'Kecerdasan finansial lanjutan untuk kenyamanan dan automasi keluarga.',
    39000,
    390000,
    999999,
    60,
    999999,
    '["Semua fitur Free", "Tanya LEGAKU AI tanpa batas", "60x scan foto struk AI per bulan", "Pencatatan suara tanpa batas", "Asesmen Financial Health Check", "Simulator Skenario Impian", "Ekspor Laporan PDF & CSV lengkap"]'::jsonb
),
(
    'family',
    'LEGAKU Family',
    'Kolaborasi tanpa batas untuk seluruh anggota keluarga besar.',
    69000,
    690000,
    999999,
    150,
    999999,
    '["Semua fitur Plus", "Hingga 5 anggota keluarga bersama", "150x scan foto struk per bulan", "Insight keuangan kolaboratif", "Wawasan pola belanja cerdas keluarga", "Prioritas pemrosesan server"]'::jsonb
),
(
    'founder_lifetime',
    'Founder Lifetime',
    'Akses eksklusif selamanya untuk pendukung awal LEGAKU.',
    0,
    0,
    999999,
    999999,
    999999,
    '["Akses VIP seumur hidup tanpa batas", "Lencana Founder eksklusif", "Akses lebih awal ke semua fitur masa depan", "Dukungan langsung tim pengembang"]'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. SUBSCRIPTIONS TABLE
-- Tracks active user/family subscription state
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
    plan_slug VARCHAR(50) NOT NULL REFERENCES public.plans(slug) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trial', 'expired', 'cancelled')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ, -- null for lifetime/unlimited
    provider VARCHAR(50) DEFAULT 'internal',
    external_subscription_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_subscription UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_family ON public.subscriptions(family_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- ------------------------------------------------------------------------------
-- 3. AI USAGE TRACKING TABLE
-- Tracks monthly quotas to protect backend without aggressive limits
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
    feature VARCHAR(30) NOT NULL CHECK (feature IN ('companion', 'receipt', 'voice', 'insight', 'health_check')),
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    request_count INT NOT NULL DEFAULT 1,
    token_usage INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_family ON public.ai_usage(family_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_date ON public.ai_usage(usage_date);
CREATE INDEX IF NOT EXISTS idx_ai_usage_feature ON public.ai_usage(feature);

-- ------------------------------------------------------------------------------
-- 4. FINANCIAL PROFILES & SMART PATTERNS
-- Stores derived deterministic statistical baselines for families
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.financial_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID UNIQUE NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    average_monthly_income BIGINT NOT NULL DEFAULT 0,
    average_monthly_expense BIGINT NOT NULL DEFAULT 0,
    average_savings_rate INT NOT NULL DEFAULT 0,
    essential_expense_estimate BIGINT NOT NULL DEFAULT 0,
    emergency_fund_months NUMERIC(4, 1) NOT NULL DEFAULT 0.0,
    common_spending_categories JSONB DEFAULT '[]'::jsonb,
    recurring_commitments JSONB DEFAULT '[]'::jsonb,
    detected_patterns JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_financial_profiles_family ON public.financial_profiles(family_id);

-- ------------------------------------------------------------------------------
-- 5. PRIVACY-CONSCIOUS PRODUCT EVENTS TABLE
-- Tracks high-level product actions without recording sensitive financial amounts
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    family_id UUID REFERENCES public.families(id) ON DELETE SET NULL,
    event_name VARCHAR(60) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_events_name ON public.product_events(event_name);
CREATE INDEX IF NOT EXISTS idx_product_events_family ON public.product_events(family_id);
CREATE INDEX IF NOT EXISTS idx_product_events_created ON public.product_events(created_at DESC);

-- ------------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_events ENABLE ROW LEVEL SECURITY;

-- Plans (Readable by all authenticated users)
CREATE POLICY "Plans readable by authenticated users"
    ON public.plans FOR SELECT
    USING (auth.role() = 'authenticated');

-- Subscriptions
CREATE POLICY "Users can view their own subscription"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id OR (family_id IS NOT NULL AND public.is_family_member(family_id)));

CREATE POLICY "Users can update their subscription"
    ON public.subscriptions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their subscription"
    ON public.subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- AI Usage
CREATE POLICY "Users can view their AI usage"
    ON public.ai_usage FOR SELECT
    USING (auth.uid() = user_id OR (family_id IS NOT NULL AND public.is_family_member(family_id)));

CREATE POLICY "Users can insert AI usage"
    ON public.ai_usage FOR INSERT
    WITH CHECK (auth.uid() = user_id OR (family_id IS NOT NULL AND public.is_family_member(family_id)));

-- Financial Profiles
CREATE POLICY "Family members can view their financial profile"
    ON public.financial_profiles FOR SELECT
    USING (public.is_family_member(family_id));

CREATE POLICY "Family members can update their financial profile"
    ON public.financial_profiles FOR ALL
    USING (public.is_family_member(family_id))
    WITH CHECK (public.is_family_member(family_id));

-- Product Events
CREATE POLICY "Users can record product events"
    ON public.product_events FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view their product events"
    ON public.product_events FOR SELECT
    USING (auth.uid() = user_id OR (family_id IS NOT NULL AND public.is_family_member(family_id)));
