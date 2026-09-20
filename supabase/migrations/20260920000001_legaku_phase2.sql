-- ==============================================================================
-- LEGAKU — Family Finance & AI Companion
-- Phase 2 Migration: AI Receipts, Conversations, Messages & Financial Insights
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Receipts Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    storage_path TEXT NOT NULL,
    original_filename TEXT,
    processing_status TEXT NOT NULL CHECK (processing_status IN ('uploaded', 'processing', 'ready', 'confirmed', 'failed')),
    merchant_name TEXT,
    extracted_amount NUMERIC(15,2),
    extracted_date DATE,
    extracted_time TEXT,
    extracted_items JSONB DEFAULT '[]'::jsonb,
    suggested_category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    confidence JSONB DEFAULT '{}'::jsonb,
    raw_extraction JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 2. AI Conversations Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL DEFAULT 'Percakapan Keuangan',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 3. AI Messages Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 4. Financial Insights Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.financial_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
    period_year INTEGER NOT NULL CHECK (period_year >= 2020),
    insight_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- Indexes for Fast Family Querying
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_receipts_family ON public.receipts(family_id);
CREATE INDEX IF NOT EXISTS idx_receipts_transaction ON public.receipts(transaction_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_family ON public.ai_conversations(family_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON public.ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_financial_insights_family ON public.financial_insights(family_id, period_year, period_month);

-- ------------------------------------------------------------------------------
-- Enable Row Level Security (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_insights ENABLE ROW LEVEL SECURITY;

-- Receipts Policies
CREATE POLICY "Family members can view receipts"
    ON public.receipts FOR SELECT
    USING (public.is_family_member(family_id));

CREATE POLICY "Family members can manage receipts"
    ON public.receipts FOR ALL
    USING (public.is_family_member(family_id))
    WITH CHECK (public.is_family_member(family_id));

-- AI Conversations Policies
CREATE POLICY "Family members can view AI conversations"
    ON public.ai_conversations FOR SELECT
    USING (public.is_family_member(family_id));

CREATE POLICY "Family members can manage AI conversations"
    ON public.ai_conversations FOR ALL
    USING (public.is_family_member(family_id))
    WITH CHECK (public.is_family_member(family_id));

-- AI Messages Policies
CREATE POLICY "Family members can view AI messages"
    ON public.ai_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.ai_conversations c
            WHERE c.id = ai_messages.conversation_id AND public.is_family_member(c.family_id)
        )
    );

CREATE POLICY "Family members can insert AI messages"
    ON public.ai_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ai_conversations c
            WHERE c.id = ai_messages.conversation_id AND public.is_family_member(c.family_id)
        )
    );

-- Financial Insights Policies
CREATE POLICY "Family members can view financial insights"
    ON public.financial_insights FOR SELECT
    USING (public.is_family_member(family_id));

CREATE POLICY "Family members can manage financial insights"
    ON public.financial_insights FOR ALL
    USING (public.is_family_member(family_id))
    WITH CHECK (public.is_family_member(family_id));

-- ------------------------------------------------------------------------------
-- Storage Bucket & Policies for Receipts
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Restrict to authenticated family members
CREATE POLICY "Family members can upload receipts"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'receipts'
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Family members can view own family receipts"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'receipts'
        AND auth.role() = 'authenticated'
    );
