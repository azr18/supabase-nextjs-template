-- Migration: Create reconciler-reports storage bucket for temporary report storage
-- This bucket stores processed reconciliation reports temporarily (48-hour expiry)

-- Create storage bucket for temporary reconciliation reports
-- Note: This bucket may already exist from previous setup
DO $$
BEGIN
    -- Create bucket if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'reconciler-reports') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'reconciler-reports',
            'reconciler-reports',
            false, -- Private bucket for security
            52428800, -- 50MB file size limit for generated reports
            ARRAY[
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'text/csv',
                'application/pdf'
            ]
        );
    END IF;
END $$;

-- Storage bucket organization structure:
-- user_id/jobs/job_id/reconciliation_report.xlsx
-- user_id/jobs/job_id/reconciliation_summary.pdf
-- This structure ensures:
-- - User isolation at the top level
-- - Job-specific organization for easy cleanup
-- - Temporary storage with automatic cleanup after 48 hours

-- RLS Policies for reconciler-reports bucket
-- These policies may already exist from previous migrations

-- Policy 1: Users can select/download their own reports
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
        USING (
            bucket_id = 'reconciler-reports' 
            AND (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
END $$;

-- Policy 2: Service role can manage all reports for automated operations
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
        USING (bucket_id = 'reconciler-reports')
        WITH CHECK (bucket_id = 'reconciler-reports');
    END IF;
END $$;

-- Policy 3: N8N workflows can insert reports (via service role authentication)
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
        WITH CHECK (bucket_id = 'reconciler-reports');
    END IF;
END $$;

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Add comment documenting the temporary nature of reports
COMMENT ON COLUMN storage.buckets.id IS 'Storage bucket IDs: invoice-reconciler for temporary job files, reconciler-reports for 48-hour temporary reports'; 