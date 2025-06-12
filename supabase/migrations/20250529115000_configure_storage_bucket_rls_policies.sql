-- Migration: Configure storage bucket RLS policies for user isolation and N8N integration
-- This ensures secure, multi-tenant access to invoice reconciler storage buckets

-- Ensure RLS is enabled on storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- =================================================================
-- RLS POLICIES FOR INVOICE-RECONCILER BUCKET (User Upload Files)
-- =================================================================

-- Policy: Users can view their own files
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Allow authenticated select from own invoice-reconciler folder'
    ) THEN
        CREATE POLICY "Allow authenticated select from own invoice-reconciler folder"
        ON storage.objects
        FOR SELECT
        TO authenticated
        USING (
            bucket_id = 'invoice-reconciler' 
            AND (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
END $$;

-- Policy: Users can upload files to their own folder
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Allow authenticated insert to own invoice-reconciler folder'
    ) THEN
        CREATE POLICY "Allow authenticated insert to own invoice-reconciler folder"
        ON storage.objects
        FOR INSERT
        TO authenticated
        WITH CHECK (
            bucket_id = 'invoice-reconciler' 
            AND (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
END $$;

-- Policy: Users can update their own files
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Allow authenticated update in own invoice-reconciler folder'
    ) THEN
        CREATE POLICY "Allow authenticated update in own invoice-reconciler folder"
        ON storage.objects
        FOR UPDATE
        TO authenticated
        USING (
            bucket_id = 'invoice-reconciler' 
            AND (storage.foldername(name))[1] = auth.uid()::text
        )
        WITH CHECK (
            bucket_id = 'invoice-reconciler' 
            AND (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
END $$;

-- Policy: Users can delete their own files
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Allow authenticated delete from own invoice-reconciler folder'
    ) THEN
        CREATE POLICY "Allow authenticated delete from own invoice-reconciler folder"
        ON storage.objects
        FOR DELETE
        TO authenticated
        USING (
            bucket_id = 'invoice-reconciler' 
            AND (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
END $$;

-- =================================================================
-- RLS POLICIES FOR RECONCILER-REPORTS BUCKET (Temporary Reports)
-- =================================================================

-- Policy: Users can view/download their own reconciliation reports
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can access their own reconciliation reports'
    ) THEN
        CREATE POLICY "Users can access their own reconciliation reports"
        ON storage.objects
        FOR SELECT
        TO authenticated
        USING (
            bucket_id = 'reconciler-reports' 
            AND (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
END $$;

-- Policy: Service role can manage all reports (for N8N and cleanup)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Service role can manage reconciler reports'
    ) THEN
        CREATE POLICY "Service role can manage reconciler reports"
        ON storage.objects
        FOR ALL
        TO service_role
        USING (bucket_id = 'reconciler-reports')
        WITH CHECK (bucket_id = 'reconciler-reports');
    END IF;
END $$;

-- Policy: Allow N8N workflows to insert processed reports
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Service role can insert reconciler reports'
    ) THEN
        CREATE POLICY "Service role can insert reconciler reports"
        ON storage.objects
        FOR INSERT
        TO service_role
        WITH CHECK (bucket_id = 'reconciler-reports');
    END IF;
END $$;

-- =================================================================
-- SECURITY VERIFICATION
-- =================================================================

-- Create a function to verify storage bucket security
CREATE OR REPLACE FUNCTION verify_storage_bucket_security()
RETURNS TABLE (
    bucket_id text,
    policy_count bigint,
    has_user_isolation boolean,
    has_service_access boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id::text,
        COUNT(p.policyname)::bigint as policy_count,
        bool_or(p.qual LIKE '%auth.uid()%' OR p.with_check LIKE '%auth.uid()%') as has_user_isolation,
        bool_or(p.roles::text LIKE '%service_role%') as has_service_access
    FROM storage.buckets b
    LEFT JOIN pg_policies p ON (
        p.schemaname = 'storage' 
        AND p.tablename = 'objects' 
        AND (p.qual LIKE '%' || b.id || '%' OR p.with_check LIKE '%' || b.id || '%')
    )
    WHERE b.id IN ('invoice-reconciler', 'reconciler-reports')
    GROUP BY b.id;
END;
$$;

-- Test storage bucket security configuration
SELECT 'Storage bucket security verification:' as status;
SELECT * FROM verify_storage_bucket_security(); 