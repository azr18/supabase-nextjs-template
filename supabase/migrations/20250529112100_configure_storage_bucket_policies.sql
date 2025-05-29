-- Migration: Configure storage bucket policies for invoice-reconciler
-- Description: Set up storage bucket policies for user isolation and access control using Supabase's storage system
-- Created: 2025-05-29

-- Create storage policies using the proper Supabase approach
-- We'll use the SQL interface to create storage policies

-- Enable RLS on storage.objects if not already enabled (it should be)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create storage policies for the invoice-reconciler bucket
-- These policies will enforce user isolation and subscription-based access

-- Policy 1: Allow authenticated users to view their own objects
CREATE POLICY "Users can view own objects in invoice-reconciler" ON storage.objects
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'invoice-reconciler' 
  AND auth.uid() IS NOT NULL
  AND public.check_user_owns_storage_object(name)
  AND public.check_user_has_tool_access_for_storage(bucket_id)
);

-- Policy 2: Allow authenticated users to upload objects with validation
CREATE POLICY "Users can upload objects to invoice-reconciler" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'invoice-reconciler'
  AND auth.uid() IS NOT NULL
  AND owner = auth.uid()
  AND public.check_user_owns_storage_object(name)
  AND public.check_user_has_tool_access_for_storage(bucket_id)
  AND public.validate_invoice_reconciler_file_path(name)
  AND public.check_storage_quota_before_upload(bucket_id, COALESCE((metadata->>'size')::bigint, 0))
);

-- Policy 3: Allow authenticated users to update their own objects
CREATE POLICY "Users can update own objects in invoice-reconciler" ON storage.objects
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'invoice-reconciler'
  AND auth.uid() IS NOT NULL  
  AND owner = auth.uid()
  AND public.check_user_owns_storage_object(name)
  AND public.check_user_has_tool_access_for_storage(bucket_id)
)
WITH CHECK (
  bucket_id = 'invoice-reconciler'
  AND auth.uid() IS NOT NULL
  AND owner = auth.uid()
  AND public.check_user_owns_storage_object(name)
  AND public.check_user_has_tool_access_for_storage(bucket_id)
  AND public.validate_invoice_reconciler_file_path(name)
);

-- Policy 4: Allow authenticated users to delete their own objects
CREATE POLICY "Users can delete own objects in invoice-reconciler" ON storage.objects
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'invoice-reconciler'
  AND auth.uid() IS NOT NULL
  AND owner = auth.uid()
  AND public.check_user_owns_storage_object(name)
  AND public.check_user_has_tool_access_for_storage(bucket_id)
);

-- Policy 5: Allow authenticated users to view the bucket if they have access
CREATE POLICY "Users can view invoice-reconciler bucket" ON storage.buckets
FOR SELECT 
TO authenticated
USING (
  id = 'invoice-reconciler'
  AND auth.uid() IS NOT NULL
  AND public.check_user_has_tool_access_for_storage(id)
);

-- Create indexes for better performance on storage queries
CREATE INDEX IF NOT EXISTS idx_storage_objects_bucket_owner_invoice_reconciler 
ON storage.objects (bucket_id, owner) 
WHERE bucket_id = 'invoice-reconciler';

CREATE INDEX IF NOT EXISTS idx_storage_objects_owner_name_invoice_reconciler 
ON storage.objects (owner, name) 
WHERE bucket_id = 'invoice-reconciler';

-- Add a comment about the storage structure
COMMENT ON POLICY "Users can view own objects in invoice-reconciler" ON storage.objects IS 
'Allows authenticated users to view only their own objects in the invoice-reconciler bucket, with subscription validation';

COMMENT ON POLICY "Users can upload objects to invoice-reconciler" ON storage.objects IS 
'Allows authenticated users to upload objects to their own directory in invoice-reconciler bucket with quota and path validation';

COMMENT ON POLICY "Users can delete own objects in invoice-reconciler" ON storage.objects IS 
'Allows authenticated users to delete only their own objects in the invoice-reconciler bucket'; 