-- =============================================
-- Create Supabase Storage Bucket for Invoice Reconciler Tool
-- Migration: 20250529114000_create_invoice_reconciler_storage_bucket.sql
-- =============================================

-- Create the invoice-reconciler storage bucket
-- Note: This bucket may already be created via direct SQL execution
INSERT INTO storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
) VALUES (
    'invoice-reconciler',
    'invoice-reconciler',
    false, -- Private bucket (not publicly accessible)
    26214400, -- 25MB file size limit (25 * 1024 * 1024 bytes)
    ARRAY[
        'application/pdf', -- For invoice PDFs
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', -- For Excel files (.xlsx)
        'application/vnd.ms-excel', -- For legacy Excel files (.xls)
        'text/csv', -- For CSV reports
        'application/json' -- For metadata files
    ]
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types,
    updated_at = now();

-- =============================================
-- File Organization Structure Documentation
-- =============================================

/*
Invoice Reconciler Storage Bucket Structure:
=============================================

invoice-reconciler/
├── {user_id}/
│   ├── saved-invoices/
│   │   ├── fly-dubai/
│   │   │   ├── invoice_001.pdf
│   │   │   ├── invoice_001_metadata.json
│   │   │   └── ...
│   │   ├── tap/
│   │   │   ├── invoice_tap_001.pdf
│   │   │   └── ...
│   │   ├── philippines/
│   │   │   └── ...
│   │   ├── air-india/
│   │   │   └── ...
│   │   └── el-al/
│   │       └── ...
│   ├── jobs/
│   │   ├── {job_id}/
│   │   │   ├── input/
│   │   │   │   ├── invoice.pdf (reference or copy)
│   │   │   │   └── report.xlsx
│   │   │   ├── output/
│   │   │   │   └── reconciliation_result.xlsx
│   │   │   └── metadata/
│   │   │       ├── job_config.json
│   │   │       └── processing_log.json
│   │   └── ...
│   └── temp/
│       └── {temporary_upload_files}
└── ...

File Path Patterns:
==================

1. Saved Invoices (Persistent):
   - Pattern: {user_id}/saved-invoices/{airline_type}/{filename}
   - Example: "12345678-1234-1234-1234-123456789012/saved-invoices/fly-dubai/invoice_001.pdf"
   - Metadata: "12345678-1234-1234-1234-123456789012/saved-invoices/fly-dubai/invoice_001_metadata.json"

2. Job Inputs:
   - Pattern: {user_id}/jobs/{job_id}/input/{filename}
   - Example: "12345678-1234-1234-1234-123456789012/jobs/87654321-4321-4321-4321-210987654321/input/report.xlsx"

3. Job Outputs:
   - Pattern: {user_id}/jobs/{job_id}/output/{filename}
   - Example: "12345678-1234-1234-1234-123456789012/jobs/87654321-4321-4321-4321-210987654321/output/reconciliation_result.xlsx"

4. Job Metadata:
   - Pattern: {user_id}/jobs/{job_id}/metadata/{filename}
   - Example: "12345678-1234-1234-1234-123456789012/jobs/87654321-4321-4321-4321-210987654321/metadata/job_config.json"

5. Temporary Files:
   - Pattern: {user_id}/temp/{filename}
   - Example: "12345678-1234-1234-1234-123456789012/temp/upload_in_progress.pdf"

Supported Airlines:
==================
- fly-dubai
- tap
- philippines
- air-india
- el-al

Security Configuration:
=======================
- Bucket Type: Private (public = false)
- File Size Limit: 25MB per file
- User Storage Quota: 100MB total per user (enforced by application logic)
- Allowed MIME Types:
  * application/pdf (Invoice PDFs)
  * application/vnd.openxmlformats-officedocument.spreadsheetml.sheet (Excel .xlsx)
  * application/vnd.ms-excel (Legacy Excel .xls)
  * text/csv (CSV reports)
  * application/json (Metadata files)

Access Control:
===============
- User isolation through RLS policies (to be implemented)
- Users can only access files within their user_id directory
- Tool subscription validation required for file operations
- Duplicate detection prevents storage waste
- Automatic cleanup of temporary files after processing

File Management Features:
========================
- Persistent invoice storage for reuse across jobs
- Duplicate detection using SHA-256 hashing
- Metadata tracking for all uploaded files
- Job-specific file organization for reconciliation workflows
- Automatic file cleanup and retention policies
*/

-- Verify the bucket configuration
SELECT 
    'Invoice Reconciler Bucket Status' as component,
    id as bucket_id,
    name as bucket_name,
    CASE 
        WHEN public THEN 'Public'
        ELSE 'Private'
    END as access_type,
    file_size_limit as max_file_size_bytes,
    ROUND(file_size_limit / 1024.0 / 1024.0, 1) as max_file_size_mb,
    array_length(allowed_mime_types, 1) as allowed_mime_count,
    created_at,
    'CONFIGURED' as status
FROM storage.buckets 
WHERE name = 'invoice-reconciler';

-- Summary information
SELECT 
    'Storage Bucket Summary' as summary_type,
    'invoice-reconciler bucket created with 25MB file limit and restricted MIME types' as configuration,
    'Supports user isolation, persistent invoice storage, and job-specific file organization' as features,
    'Ready for RLS policy implementation and production use' as readiness_status;

-- Migration: Create invoice-reconciler storage bucket for temporary job files
-- This bucket stores uploaded PDF invoices and Excel reports temporarily during processing

-- Create storage bucket for invoice reconciler temporary job files
-- Note: This bucket may already exist from previous setup
DO $$
BEGIN
    -- Create bucket if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'invoice-reconciler') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'invoice-reconciler',
            'invoice-reconciler',
            false, -- Private bucket for security
            26214400, -- 25MB file size limit per file
            ARRAY[
                'application/pdf',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'text/csv',
                'application/json'
            ]
        );
    END IF;
END $$;

-- Storage bucket organization structure:
-- user_id/jobs/job_id/invoice.pdf
-- user_id/jobs/job_id/report.xlsx
-- This structure ensures:
-- - User isolation at the top level
-- - Job-specific organization for easy cleanup
-- - Clear file identification for N8N processing

-- RLS Policies for invoice-reconciler bucket
-- These policies may already exist from previous migrations

-- Policy 1: Users can select their own files
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
        USING (
            bucket_id = 'invoice-reconciler' 
            AND (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
END $$;

-- Policy 2: Users can insert files to their own folder
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
        WITH CHECK (
            bucket_id = 'invoice-reconciler' 
            AND (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
END $$;

-- Policy 3: Users can update their own files
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

-- Policy 4: Users can delete their own files
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
        USING (
            bucket_id = 'invoice-reconciler' 
            AND (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
END $$;

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; 