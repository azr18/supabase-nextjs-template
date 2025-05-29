-- Test script for storage access control functions
-- Description: Verify that storage access control functions work correctly
-- Created: 2025-05-29

-- Test the storage access control functions we created

BEGIN;

-- Create a test user for testing purposes
INSERT INTO auth.users (
    id,
    email,
    email_confirmed_at,
    created_at,
    updated_at,
    role
) VALUES (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'test@example.com',
    NOW(),
    NOW(),
    NOW(),
    'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Test 1: Check user owns storage object function
SELECT 'Test 1: User owns storage object validation' as test_name;

-- This should return true for a path that starts with user ID
SELECT public.check_user_owns_storage_object('11111111-1111-1111-1111-111111111111/test-file.pdf') as should_be_true_for_own_path;

-- This should return false for a path that doesn't start with user ID
SELECT public.check_user_owns_storage_object('22222222-2222-2222-2222-222222222222/test-file.pdf') as should_be_false_for_other_path;

-- Test 2: Check file path validation
SELECT 'Test 2: File path validation' as test_name;

-- Valid paths
SELECT public.validate_invoice_reconciler_file_path('11111111-1111-1111-1111-111111111111/saved_invoices/fly-dubai/invoice.pdf') as valid_saved_invoice_path;
SELECT public.validate_invoice_reconciler_file_path('11111111-1111-1111-1111-111111111111/jobs/job-123/report.xlsx') as valid_job_path;
SELECT public.validate_invoice_reconciler_file_path('11111111-1111-1111-1111-111111111111/reports/result.xlsx') as valid_report_path;

-- Invalid paths
SELECT public.validate_invoice_reconciler_file_path('22222222-2222-2222-2222-222222222222/file.pdf') as invalid_wrong_user;
SELECT public.validate_invoice_reconciler_file_path('11111111-1111-1111-1111-111111111111/invalid_folder/file.pdf') as invalid_folder;
SELECT public.validate_invoice_reconciler_file_path('file.pdf') as invalid_too_short;

-- Test 3: Check storage quota function
SELECT 'Test 3: Storage quota validation' as test_name;

-- Test with small file size (should be true)
SELECT public.check_storage_quota_before_upload('invoice-reconciler', 1000000) as small_file_should_pass; -- 1MB

-- Test with large file size (should be false if it exceeds 100MB)
SELECT public.check_storage_quota_before_upload('invoice-reconciler', 110000000) as large_file_should_fail; -- 110MB

-- Test 4: Check tool access function (requires active subscription)
SELECT 'Test 4: Tool access validation' as test_name;

-- First create the test subscription
INSERT INTO user_tool_subscriptions (
    user_id,
    tool_id,
    status,
    subscribed_at
) VALUES (
    '11111111-1111-1111-1111-111111111111'::uuid,
    (SELECT id FROM tools WHERE name = 'invoice-reconciler'),
    'active',
    NOW()
) ON CONFLICT (user_id, tool_id) DO UPDATE SET status = 'active';

-- This should return true for user with active subscription
-- Note: This test would need to run with auth.uid() set to the test user
-- SELECT public.check_user_has_tool_access_for_storage('invoice-reconciler') as user_has_access;

ROLLBACK;

-- Manual Steps Required:
-- 
-- Since we cannot create storage policies directly via SQL migration due to Supabase's security model,
-- the following policies need to be configured manually in the Supabase Dashboard:
--
-- 1. Navigate to Storage > Policies in Supabase Dashboard
-- 2. Create the following policies for the 'invoice-reconciler' bucket:
--
-- Policy Name: "Users can view own objects"
-- Operation: SELECT
-- Policy Definition:
-- (bucket_id = 'invoice-reconciler' AND auth.uid() IS NOT NULL AND public.check_user_owns_storage_object(name) AND public.check_user_has_tool_access_for_storage(bucket_id))
--
-- Policy Name: "Users can upload objects"  
-- Operation: INSERT
-- Policy Definition:
-- (bucket_id = 'invoice-reconciler' AND auth.uid() IS NOT NULL AND owner = auth.uid() AND public.check_user_owns_storage_object(name) AND public.check_user_has_tool_access_for_storage(bucket_id) AND public.validate_invoice_reconciler_file_path(name) AND public.check_storage_quota_before_upload(bucket_id, COALESCE((metadata->>'size')::bigint, 0)))
--
-- Policy Name: "Users can update own objects"
-- Operation: UPDATE  
-- Policy Definition:
-- (bucket_id = 'invoice-reconciler' AND auth.uid() IS NOT NULL AND owner = auth.uid() AND public.check_user_owns_storage_object(name) AND public.check_user_has_tool_access_for_storage(bucket_id))
--
-- Policy Name: "Users can delete own objects"
-- Operation: DELETE
-- Policy Definition:  
-- (bucket_id = 'invoice-reconciler' AND auth.uid() IS NOT NULL AND owner = auth.uid() AND public.check_user_owns_storage_object(name) AND public.check_user_has_tool_access_for_storage(bucket_id))
--
-- Expected File Organization Structure:
-- - user_id/saved_invoices/airline_type/filename.pdf (for persistent invoices)
-- - user_id/jobs/job_id/filename.xlsx (for job-specific report files)
-- - user_id/reports/filename.xlsx (for generated reconciliation reports)
--
-- Features Implemented:
-- ✅ User isolation - users can only access their own files
-- ✅ Subscription validation - only users with active tool subscriptions can access storage
-- ✅ Path validation - enforces proper file organization structure
-- ✅ Quota enforcement - prevents uploads that would exceed 100MB per user
-- ✅ File type validation - controlled through bucket MIME type restrictions 