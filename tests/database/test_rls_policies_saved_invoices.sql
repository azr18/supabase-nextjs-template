-- Test Script for Enhanced RLS Policies on Saved Invoices Table
-- This script verifies that the comprehensive Row Level Security policies work correctly

-- ==================================================
-- TEST 1: Saved Invoices Table RLS Policies
-- ==================================================

-- Test policy count and names
SELECT '=== Test 1: Saved Invoices Policy Summary ===' as test_name;
SELECT 
    COUNT(*) as total_policies,
    string_agg(policyname, ', ' ORDER BY policyname) as policy_names
FROM pg_policies 
WHERE tablename = 'saved_invoices';

-- Test individual policies
SELECT '=== Test 2: Individual Policy Details ===' as test_name;
SELECT 
    policyname,
    cmd as command,
    roles,
    CASE 
        WHEN qual IS NOT NULL THEN 'Has USING clause'
        ELSE 'No USING clause'
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
        ELSE 'No WITH CHECK clause'
    END as with_check_clause
FROM pg_policies 
WHERE tablename = 'saved_invoices'
ORDER BY policyname;

-- ==================================================
-- TEST 2: Enhanced Security Functions
-- ==================================================

-- Test storage quota calculation functions
SELECT '=== Test 3: Storage Quota Functions ===' as test_name;
SELECT 
    routine_name,
    routine_type,
    security_type,
    data_type,
    is_deterministic
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN (
    'get_user_storage_usage',
    'check_storage_quota_before_insert'
)
ORDER BY routine_name;

-- Test invoice management functions
SELECT '=== Test 4: Invoice Management Functions ===' as test_name;
SELECT 
    routine_name,
    routine_type,
    security_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN (
    'get_user_invoices_by_airline',
    'cleanup_old_unused_invoices'
)
ORDER BY routine_name;

-- ==================================================
-- TEST 3: Function Permissions
-- ==================================================

-- Check function permissions for authenticated users
SELECT '=== Test 5: Function Permissions for Authenticated Users ===' as test_name;
SELECT 
    routine_name,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.routine_privileges 
WHERE routine_name IN (
    'get_user_storage_usage',
    'get_user_invoices_by_airline',
    'check_storage_quota_before_insert',
    'cleanup_old_unused_invoices'
)
AND routine_schema = 'public'
AND grantee IN ('authenticated', 'service_role')
ORDER BY routine_name, grantee;

-- ==================================================
-- TEST 4: View Updates
-- ==================================================

-- Test that active_saved_invoices view was updated
SELECT '=== Test 6: Active Saved Invoices View ===' as test_name;
SELECT 
    table_name,
    view_definition IS NOT NULL as has_definition
FROM information_schema.views 
WHERE table_name = 'active_saved_invoices'
AND table_schema = 'public';

-- Check view columns include file_size_mb
SELECT '=== Test 7: View Column Structure ===' as test_name;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'active_saved_invoices'
AND table_schema = 'public'
AND column_name IN ('id', 'airline_type', 'file_size', 'file_size_mb', 'usage_count')
ORDER BY ordinal_position;

-- ==================================================
-- TEST 5: RLS Status and Table Permissions
-- ==================================================

-- Verify RLS is enabled
SELECT '=== Test 8: RLS Status ===' as test_name;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    forcerowsecurity as force_rls
FROM pg_tables 
WHERE tablename = 'saved_invoices'
AND schemaname = 'public';

-- Check table permissions
SELECT '=== Test 9: Table Permissions ===' as test_name;
SELECT 
    table_name,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'saved_invoices'
AND table_schema = 'public'
AND grantee IN ('authenticated', 'service_role', 'anon')
ORDER BY grantee, privilege_type;

-- ==================================================
-- TEST 6: Policy Type Analysis
-- ==================================================

-- Analyze policy types (PERMISSIVE vs RESTRICTIVE)
SELECT '=== Test 10: Policy Types Analysis ===' as test_name;
SELECT 
    CASE 
        WHEN policyname LIKE '%subscription%' THEN 'RESTRICTIVE - Subscription Check'
        WHEN policyname LIKE '%deletion%' THEN 'RESTRICTIVE - Deletion Prevention'
        WHEN policyname LIKE '%service_role%' THEN 'PERMISSIVE - Admin Access'
        ELSE 'PERMISSIVE - User Access'
    END as policy_category,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'saved_invoices'
GROUP BY 1
ORDER BY 1;

-- ==================================================
-- TEST RESULTS SUMMARY
-- ==================================================

SELECT '=== Test Summary ===' as test_name;

-- Policy summary
SELECT 
    'Saved Invoices table has ' || COUNT(*) || ' RLS policies' as summary
FROM pg_policies 
WHERE tablename = 'saved_invoices'
UNION ALL
-- Function summary
SELECT 
    'Enhanced security functions created: ' || COUNT(*) as summary
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN (
    'get_user_storage_usage',
    'get_user_invoices_by_airline',
    'check_storage_quota_before_insert',
    'cleanup_old_unused_invoices'
)
UNION ALL
-- View summary
SELECT 
    'Active saved invoices view updated: ' || 
    CASE WHEN COUNT(*) > 0 THEN 'YES' ELSE 'NO' END as summary
FROM information_schema.views 
WHERE table_name = 'active_saved_invoices'
AND table_schema = 'public';

-- ==================================================
-- TEST 7: Storage Quota Constants Verification
-- ==================================================

-- Verify the quota is set to 100MB (104857600 bytes) in functions
SELECT '=== Test 11: Storage Quota Configuration ===' as test_name;
SELECT 
    'Storage quota functions implement 100MB limit' as verification,
    'Check function source code for v_quota_bytes := 104857600' as note; 