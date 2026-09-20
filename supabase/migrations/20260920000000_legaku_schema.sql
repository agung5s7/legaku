-- ==============================================================================
-- LEGAKU — Family Finance & AI Companion
-- Phase 1 Foundation Migration: Schema, RLS, Realtime & Triggers
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. Profiles Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 2. Families Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 3. Family Members Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'partner')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(family_id, user_id)
);

-- ------------------------------------------------------------------------------
-- 4. Accounts Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'ewallet', 'credit_card', 'other')),
    initial_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
    current_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 5. Categories Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    icon TEXT NOT NULL DEFAULT 'Tag',
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 6. Transactions Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount NUMERIC(15,2) NOT NULL CHECK (amount >= 0),
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT NOT NULL,
    notes TEXT,
    source TEXT NOT NULL CHECK (source IN ('manual', 'receipt_ai', 'voice_ai', 'whatsapp', 'import')) DEFAULT 'manual',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 7. Goals Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount NUMERIC(15,2) NOT NULL CHECK (target_amount > 0),
    current_amount NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
    target_date DATE,
    description TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 8. Budgets Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    amount NUMERIC(15,2) NOT NULL CHECK (amount >= 0),
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK (year >= 2020),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(family_id, category_id, month, year)
);

-- ------------------------------------------------------------------------------
-- Indexes for High-Performance Queries
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_family_members_user ON public.family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_family ON public.family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_accounts_family ON public.accounts(family_id);
CREATE INDEX IF NOT EXISTS idx_transactions_family_date ON public.transactions(family_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_family_month_year ON public.budgets(family_id, month, year);
CREATE INDEX IF NOT EXISTS idx_goals_family ON public.goals(family_id);

-- ------------------------------------------------------------------------------
-- Automatic Account Balance Recalculation Triggers
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF (NEW.type = 'income') THEN
            UPDATE public.accounts
            SET current_balance = current_balance + NEW.amount, updated_at = now()
            WHERE id = NEW.account_id;
        ELSE
            UPDATE public.accounts
            SET current_balance = current_balance - NEW.amount, updated_at = now()
            WHERE id = NEW.account_id;
        END IF;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        IF (OLD.type = 'income') THEN
            UPDATE public.accounts
            SET current_balance = current_balance - OLD.amount, updated_at = now()
            WHERE id = OLD.account_id;
        ELSE
            UPDATE public.accounts
            SET current_balance = current_balance + OLD.amount, updated_at = now()
            WHERE id = OLD.account_id;
        END IF;
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Revert old transaction impact
        IF (OLD.type = 'income') THEN
            UPDATE public.accounts
            SET current_balance = current_balance - OLD.amount, updated_at = now()
            WHERE id = OLD.account_id;
        ELSE
            UPDATE public.accounts
            SET current_balance = current_balance + OLD.amount, updated_at = now()
            WHERE id = OLD.account_id;
        END IF;
        -- Apply new transaction impact
        IF (NEW.type = 'income') THEN
            UPDATE public.accounts
            SET current_balance = current_balance + NEW.amount, updated_at = now()
            WHERE id = NEW.account_id;
        ELSE
            UPDATE public.accounts
            SET current_balance = current_balance - NEW.amount, updated_at = now()
            WHERE id = NEW.account_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_account_balance ON public.transactions;
CREATE TRIGGER trg_sync_account_balance
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.sync_account_balance();

-- ------------------------------------------------------------------------------
-- Helper Function: Check Family Membership (Avoid RLS Recursion)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_family_member(_family_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.family_members
        WHERE family_id = _family_id
          AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ------------------------------------------------------------------------------
-- Row Level Security (RLS) Configuration
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (id = auth.uid());

-- 2. Families Policies
CREATE POLICY "Family members can view their families"
    ON public.families FOR SELECT
    USING (public.is_family_member(id) OR created_by = auth.uid());

CREATE POLICY "Users can create a family"
    ON public.families FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Owners can update their family"
    ON public.families FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.family_members
            WHERE family_id = families.id AND user_id = auth.uid() AND role = 'owner'
        )
    );

-- 3. Family Members Policies
CREATE POLICY "Members can view membership in their family"
    ON public.family_members FOR SELECT
    USING (public.is_family_member(family_id) OR user_id = auth.uid());

CREATE POLICY "Users can join a family"
    ON public.family_members FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owners can manage members"
    ON public.family_members FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.family_members m
            WHERE m.family_id = family_members.family_id AND m.user_id = auth.uid() AND m.role = 'owner'
        )
    );

-- 4. Accounts Policies
CREATE POLICY "Family members can view accounts"
    ON public.accounts FOR SELECT
    USING (public.is_family_member(family_id));

CREATE POLICY "Family members can manage accounts"
    ON public.accounts FOR ALL
    USING (public.is_family_member(family_id))
    WITH CHECK (public.is_family_member(family_id));

-- 5. Categories Policies
CREATE POLICY "Users can view default or family categories"
    ON public.categories FOR SELECT
    USING (is_default = true OR (family_id IS NOT NULL AND public.is_family_member(family_id)));

CREATE POLICY "Family members can manage family categories"
    ON public.categories FOR ALL
    USING (family_id IS NOT NULL AND public.is_family_member(family_id))
    WITH CHECK (family_id IS NOT NULL AND public.is_family_member(family_id));

-- 6. Transactions Policies
CREATE POLICY "Family members can view transactions"
    ON public.transactions FOR SELECT
    USING (public.is_family_member(family_id));

CREATE POLICY "Family members can manage transactions"
    ON public.transactions FOR ALL
    USING (public.is_family_member(family_id))
    WITH CHECK (public.is_family_member(family_id));

-- 7. Goals Policies
CREATE POLICY "Family members can view goals"
    ON public.goals FOR SELECT
    USING (public.is_family_member(family_id));

CREATE POLICY "Family members can manage goals"
    ON public.goals FOR ALL
    USING (public.is_family_member(family_id))
    WITH CHECK (public.is_family_member(family_id));

-- 8. Budgets Policies
CREATE POLICY "Family members can view budgets"
    ON public.budgets FOR SELECT
    USING (public.is_family_member(family_id));

CREATE POLICY "Family members can manage budgets"
    ON public.budgets FOR ALL
    USING (public.is_family_member(family_id))
    WITH CHECK (public.is_family_member(family_id));

-- ------------------------------------------------------------------------------
-- Realtime Replication Configuration
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'transactions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'accounts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.accounts;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'goals'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.goals;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'budgets'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.budgets;
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- Automatic Profile Creation Trigger on Signup
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Anggota Keluarga'),
        new.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
