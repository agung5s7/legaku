-- ==============================================================================
-- Phase 2.1: Secure Receipts RLS
-- ==============================================================================

-- Drop old permissive policies
DROP POLICY IF EXISTS "Family members can upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Family members can view own family receipts" ON storage.objects;

-- Create stricter policies enforcing family directory path
CREATE POLICY "Family members can upload receipts"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'receipts'
        AND auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM public.family_members
            WHERE family_id = (storage.foldername(name))[1]::uuid
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Family members can view own family receipts"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'receipts'
        AND auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM public.family_members
            WHERE family_id = (storage.foldername(name))[1]::uuid
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Family members can delete own family receipts"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'receipts'
        AND auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM public.family_members
            WHERE family_id = (storage.foldername(name))[1]::uuid
            AND user_id = auth.uid()
        )
    );
