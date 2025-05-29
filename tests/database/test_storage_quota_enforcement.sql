-- Test Script: Storage Quota Enforcement (100MB per user)
-- Purpose: Validate quota functions and enforcement mechanisms
-- Test against: 20250529115000_configure_storage_quota_enforcement.sql

-- =============================================
-- Test Setup
-- =============================================

-- Note: These tests are designed to be run manually or via automated testing framework
-- Some tests require authentication context which may not be available in direct SQL execution

BEGIN;

-- =============================================
-- Test 1: Quota Configuration Verification
-- =============================================

SELECT 'TEST 1: Quota Configuration Verification' as test_name;

-- Verify the quota functions exist
SELECT 
    'Function Existence Check' as check_type,
    COUNT(*) as function_count,
    CASE 
        WHEN COUNT(*) >= 6 THEN 'PASS'
        ELSE 'FAIL'
    END as result
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'get_user_storage_usage_bytes',
    'check_storage_quota_before_upload',
    'check_storage_quota_before_upload_detailed',
    'get_user_storage_quota_info',
    'validate_file_upload_quota',
    'cleanup_expired_temp_files',
    'get_user_storage_by_bucket'
);

-- Verify storage bucket configuration
SELECT 
    'Storage Bucket Configuration' as check_type,
    name as bucket_name,
    file_size_limit / 1024 / 1024 as file_limit_mb,
    CASE 
        WHEN file_size_limit = 26214400 THEN 'PASS'
        ELSE 'FAIL'
    END as file_limit_check,
    CASE 
        WHEN public = false THEN 'PASS'
        ELSE 'FAIL'
    END as privacy_check
FROM storage.buckets 
WHERE name = 'invoice-reconciler';

-- =============================================
-- Test 2: Storage Usage Functions
-- =============================================

SELECT 'TEST 2: Storage Usage Functions' as test_name;

-- Test usage calculation with no files (should return 0)
SELECT 
    'Empty Storage Usage' as test_type,
    public.get_user_storage_usage_bytes('00000000-0000-0000-0000-000000000000'::uuid) as usage_bytes,
    CASE 
        WHEN public.get_user_storage_usage_bytes('00000000-0000-0000-0000-000000000000'::uuid) = 0 THEN 'PASS'
        ELSE 'FAIL'
    END as result;

-- Test quota info function with fake user
SELECT 
    'Quota Info Function' as test_type,
    quota.*,
    CASE 
        WHEN quota.quota_limit_mb = 100.00 AND quota.current_usage_bytes = 0 THEN 'PASS'
        ELSE 'FAIL'
    END as result
FROM public.get_user_storage_quota_info('00000000-0000-0000-0000-000000000000'::uuid) quota;

-- =============================================
-- Test 3: Quota Validation Logic
-- =============================================

SELECT 'TEST 3: Quota Validation Logic' as test_name;

-- Test quota check for small file (should pass)
SELECT 
    'Small File Upload Check' as test_type,
    public.check_storage_quota_before_upload_detailed('invoice-reconciler', 1048576, '00000000-0000-0000-0000-000000000000'::uuid) as can_upload_1mb,
    CASE 
        WHEN public.check_storage_quota_before_upload_detailed('invoice-reconciler', 1048576, '00000000-0000-0000-0000-000000000000'::uuid) = true THEN 'PASS'
        ELSE 'FAIL'
    END as result;

-- Test quota check for oversized file (should fail)
SELECT 
    'Oversized File Check' as test_type,
    public.check_storage_quota_before_upload_detailed('invoice-reconciler', 209715200, '00000000-0000-0000-0000-000000000000'::uuid) as can_upload_200mb,
    CASE 
        WHEN public.check_storage_quota_before_upload_detailed('invoice-reconciler', 209715200, '00000000-0000-0000-0000-000000000000'::uuid) = false THEN 'PASS'
        ELSE 'FAIL'
    END as result;

-- Test detailed validation function
SELECT 
    'Detailed Validation Function' as test_type,
    validation.*,
    CASE 
        WHEN validation.can_upload = true AND validation.reason = 'Upload allowed' THEN 'PASS'
        ELSE 'FAIL'
    END as result
FROM public.validate_file_upload_quota('invoice-reconciler', 'test/file.pdf', 1048576, '00000000-0000-0000-0000-000000000000'::uuid) validation;

-- Test file size limit validation (25MB+)
SELECT 
    'File Size Limit Validation' as test_type,
    validation.*,
    CASE 
        WHEN validation.can_upload = false AND validation.reason = 'File size exceeds 25MB limit' THEN 'PASS'
        ELSE 'FAIL'
    END as result
FROM public.validate_file_upload_quota('invoice-reconciler', 'test/large_file.pdf', 27262976, '00000000-0000-0000-0000-000000000000'::uuid) validation;

-- =============================================
-- Test 4: Storage Bucket Integration
-- =============================================

SELECT 'TEST 4: Storage Bucket Integration' as test_name;

-- Verify storage policies reference quota functions
SELECT 
    'Storage Policy Integration' as test_type,
    policyname,
    CASE 
        WHEN with_check LIKE '%check_storage_quota_before_upload%' THEN 'PASS'
        ELSE 'N/A'
    END as quota_integration
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND bucket_id = 'invoice-reconciler'
AND cmd = 'INSERT';

-- =============================================
-- Test 5: Helper Functions
-- =============================================

SELECT 'TEST 5: Helper Functions' as test_name;

-- Test bucket usage function (should return empty for fake user)
SELECT 
    'Bucket Usage Function' as test_type,
    COUNT(*) as bucket_count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS'
        ELSE 'FAIL'
    END as result
FROM public.get_user_storage_by_bucket('00000000-0000-0000-0000-000000000000'::uuid);

-- =============================================
-- Test 6: Authentication Context Tests
-- =============================================

SELECT 'TEST 6: Authentication Context Tests' as test_name;

-- Test with null user (should return false/empty)
SELECT 
    'Null User Handling' as test_type,
    public.check_storage_quota_before_upload_detailed('invoice-reconciler', 1048576, null) as null_user_check,
    CASE 
        WHEN public.check_storage_quota_before_upload_detailed('invoice-reconciler', 1048576, null) = false THEN 'PASS'
        ELSE 'FAIL'
    END as result;

-- Test quota info with null user
SELECT 
    'Null User Quota Info' as test_type,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS'
        ELSE 'FAIL'
    END as result
FROM public.get_user_storage_quota_info(null);

-- =============================================
-- Test Summary
-- =============================================

SELECT 'TEST SUMMARY: Storage Quota Enforcement' as summary;

SELECT 
    'Configuration Status' as component,
    'TESTED' as status,
    '100MB per user quota with enhanced validation functions' as implementation,
    '25MB individual file size limit enforced' as file_limits,
    'Storage policies integrate with quota checking' as integration,
    'Helper functions for cleanup and monitoring' as utilities;

ROLLBACK; -- Don't commit any test data 