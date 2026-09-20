-- ==============================================================================
-- LEGAKU DATABASE SCHEMA MIGRATION: PHASE 3
-- Daily Intelligence & Family Finance Automation
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TRANSFERS TABLE (Transfer Antar Rekening)
-- Distinct first-class financial entity: Not income, not expense.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    from_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
    to_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
    amount BIGINT NOT NULL CHECK (amount > 0),
    transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_transfers_different_accounts CHECK (from_account_id != to_account_id)
);

CREATE INDEX IF NOT EXISTS idx_transfers_family_id ON public.transfers(family_id);
CREATE INDEX IF NOT EXISTS idx_transfers_date ON public.transfers(transfer_date);
CREATE INDEX IF NOT EXISTS idx_transfers_from_account ON public.transfers(from_account_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to_account ON public.transfers(to_account_id);

-- Trigger to synchronize account balances on transfers
CREATE OR REPLACE FUNCTION public.sync_transfer_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.accounts
        SET current_balance = current_balance - NEW.amount, updated_at = now()
        WHERE id = NEW.from_account_id;

        UPDATE public.accounts
        SET current_balance = current_balance + NEW.amount, updated_at = now()
        WHERE id = NEW.to_account_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.accounts
        SET current_balance = current_balance + OLD.amount, updated_at = now()
        WHERE id = OLD.from_account_id;

        UPDATE public.accounts
        SET current_balance = current_balance - OLD.amount, updated_at = now()
        WHERE id = OLD.to_account_id;
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Revert old impact
        UPDATE public.accounts
        SET current_balance = current_balance + OLD.amount, updated_at = now()
        WHERE id = OLD.from_account_id;

        UPDATE public.accounts
        SET current_balance = current_balance - OLD.amount, updated_at = now()
        WHERE id = OLD.to_account_id;

        -- Apply new impact
        UPDATE public.accounts
        SET current_balance = current_balance - NEW.amount, updated_at = now()
        WHERE id = NEW.from_account_id;

        UPDATE public.accounts
        SET current_balance = current_balance + NEW.amount, updated_at = now()
        WHERE id = NEW.to_account_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_transfer_balance ON public.transfers;
CREATE TRIGGER trg_sync_transfer_balance
AFTER INSERT OR UPDATE OR DELETE ON public.transfers
FOR EACH ROW EXECUTE FUNCTION public.sync_transfer_balance();

-- ------------------------------------------------------------------------------
-- 2. RECURRING TRANSACTIONS (Transaksi Berulang)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recurring_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    amount BIGINT NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    frequency VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('weekly', 'monthly', 'yearly', 'custom')),
    interval_value INT NOT NULL DEFAULT 1 CHECK (interval_value > 0),
    next_occurrence DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    auto_create BOOLEAN NOT NULL DEFAULT false, -- Strict default: no silent auto transactions
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recurring_family_id ON public.recurring_transactions(family_id);
CREATE INDEX IF NOT EXISTS idx_recurring_next_occurrence ON public.recurring_transactions(next_occurrence);
CREATE INDEX IF NOT EXISTS idx_recurring_active ON public.recurring_transactions(is_active);

-- ------------------------------------------------------------------------------
-- 3. TRANSACTION TEMPLATES (Template Catat Cepat)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transaction_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'expense' CHECK (type IN ('income', 'expense')),
    default_amount BIGINT CHECK (default_amount IS NULL OR default_amount > 0),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    description TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_templates_family_id ON public.transaction_templates(family_id);

-- ------------------------------------------------------------------------------
-- 4. NOTIFICATIONS & PREFERENCES (Pusat Notifikasi & Preferensi)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL CHECK (type IN (
        'budget_warning',
        'budget_exceeded',
        'recurring_due',
        'goal_milestone',
        'unusual_transaction',
        'monthly_review',
        'family_activity',
        'system'
    )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN NOT NULL DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_family_id ON public.notifications(family_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    budget_alerts BOOLEAN NOT NULL DEFAULT true,
    goal_milestones BOOLEAN NOT NULL DEFAULT true,
    recurring_reminders BOOLEAN NOT NULL DEFAULT true,
    unusual_alerts BOOLEAN NOT NULL DEFAULT true,
    family_activity BOOLEAN NOT NULL DEFAULT false, -- Conservative default to avoid spam
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_family_pref UNIQUE (user_id, family_id)
);

-- ------------------------------------------------------------------------------
-- 5. FAMILY ACTIVITY TIMELINE (Aktivitas Keluarga Damai)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.family_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_name TEXT NOT NULL,
    action_type VARCHAR(30) NOT NULL, -- 'transaction_created', 'transfer_created', 'goal_created', 'budget_updated', etc.
    entity_type VARCHAR(30) NOT NULL,
    entity_id UUID,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_family_activity_family_id ON public.family_activity(family_id);
CREATE INDEX IF NOT EXISTS idx_family_activity_created_at ON public.family_activity(created_at DESC);

-- ------------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_activity ENABLE ROW LEVEL SECURITY;

-- Transfers
CREATE POLICY "Family members can view transfers"
    ON public.transfers FOR SELECT
    USING (public.is_family_member(family_id));

CREATE POLICY "Family members can insert transfers"
    ON public.transfers FOR INSERT
    WITH CHECK (public.is_family_member(family_id));

CREATE POLICY "Family members can update transfers"
    ON public.transfers FOR UPDATE
    USING (public.is_family_member(family_id));

CREATE POLICY "Family members can delete transfers"
    ON public.transfers FOR DELETE
    USING (public.is_family_member(family_id));

-- Recurring Transactions
CREATE POLICY "Family members can view recurring transactions"
    ON public.recurring_transactions FOR SELECT
    USING (public.is_family_member(family_id));

CREATE POLICY "Family members can insert recurring transactions"
    ON public.recurring_transactions FOR INSERT
    WITH CHECK (public.is_family_member(family_id));

CREATE POLICY "Family members can update recurring transactions"
    ON public.recurring_transactions FOR UPDATE
    USING (public.is_family_member(family_id));

CREATE POLICY "Family members can delete recurring transactions"
    ON public.recurring_transactions FOR DELETE
    USING (public.is_family_member(family_id));

-- Templates
CREATE POLICY "Family members can view templates"
    ON public.transaction_templates FOR SELECT
    USING (public.is_family_member(family_id));

CREATE POLICY "Family members can insert templates"
    ON public.transaction_templates FOR INSERT
    WITH CHECK (public.is_family_member(family_id));

CREATE POLICY "Family members can update templates"
    ON public.transaction_templates FOR UPDATE
    USING (public.is_family_member(family_id));

CREATE POLICY "Family members can delete templates"
    ON public.transaction_templates FOR DELETE
    USING (public.is_family_member(family_id));

-- Notifications
CREATE POLICY "Family members can view their notifications"
    ON public.notifications FOR SELECT
    USING (public.is_family_member(family_id));

CREATE POLICY "Family members can update notifications (mark as read)"
    ON public.notifications FOR UPDATE
    USING (public.is_family_member(family_id));

CREATE POLICY "System or family members can insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (public.is_family_member(family_id));

CREATE POLICY "Family members can delete notifications"
    ON public.notifications FOR DELETE
    USING (public.is_family_member(family_id));

-- Notification Preferences
CREATE POLICY "Users can manage their notification preferences"
    ON public.notification_preferences FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Family Activity
CREATE POLICY "Family members can view family activity"
    ON public.family_activity FOR SELECT
    USING (public.is_family_member(family_id));

CREATE POLICY "Family members can insert family activity"
    ON public.family_activity FOR INSERT
    WITH CHECK (public.is_family_member(family_id));

-- ------------------------------------------------------------------------------
-- 7. REALTIME REGISTRATION
-- ------------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE 
    public.transfers, 
    public.recurring_transactions, 
    public.notifications, 
    public.family_activity;
