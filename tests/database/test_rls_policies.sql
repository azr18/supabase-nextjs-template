-- Test Script for RLS Policies on Tools and User Tool Subscriptions Tables
-- This script verifies that the Row Level Security policies work correctly

-- ==================================================
-- TEST 1: Tools Table RLS Policies
-- ==================================================

-- Test public access to active tools (should work)
SELECT '=== Test 1: Public can view active tools ===' as test_name;
SELECT id, name, slug, status 
FROM tools 
WHERE status = 'active';

-- Test viewing all tools without authentication (should only show active)
SELECT '=== Test 2: Public cannot view inactive tools ===' as test_name;
SELECT count(*) as total_tools,
       sum(case when status = 'active' then 1 else 0 end) as active_tools,
       sum(case when status != 'active' then 1 else 0 end) as non_active_tools_visible
FROM tools;

-- ==================================================
-- TEST 2: Security Functions
-- ==================================================

-- Test the security functions exist and have correct permissions
SELECT '=== Test 3: Security functions exist ===' as test_name;
SELECT 
    routine_name,
    routine_type,
    security_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN (
    'user_has_active_tool_subscription',
    'get_user_active_tools', 
    'user_has_any_active_subscription'
)
ORDER BY routine_name;

-- ==================================================
-- TEST 3: RLS Policies Summary
-- ==================================================

-- Show all RLS policies for our tables
SELECT '=== Test 4: RLS Policies Summary ===' as test_name;
SELECT 
    tablename,
    policyname,
    cmd as command,
    roles,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE tablename IN ('tools', 'user_tool_subscriptions')
ORDER BY tablename, policyname;

-- ==================================================
-- TEST 4: Table Permissions
-- ==================================================

-- Check table permissions
SELECT '=== Test 5: Table Permissions ===' as test_name;
SELECT 
    table_name,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name IN ('tools', 'user_tool_subscriptions')
AND table_schema = 'public'
ORDER BY table_name, grantee, privilege_type;

-- ==================================================
-- TEST 5: Function Permissions  
-- ==================================================

-- Check function permissions
SELECT '=== Test 6: Function Permissions ===' as test_name;
SELECT 
    routine_name,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.routine_privileges 
WHERE routine_name IN (
    'user_has_active_tool_subscription',
    'get_user_active_tools',
    'user_has_any_active_subscription'
)
AND routine_schema = 'public'
ORDER BY routine_name, grantee;

-- ==================================================
-- TEST 6: Row Level Security Status
-- ==================================================

-- Verify RLS is enabled on our tables
SELECT '=== Test 7: RLS Status on Tables ===' as test_name;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    forcerowsecurity as force_rls
FROM pg_tables 
WHERE tablename IN ('tools', 'user_tool_subscriptions')
AND schemaname = 'public';

-- ==================================================
-- TEST RESULTS SUMMARY
-- ==================================================

SELECT '=== Test Summary ===' as test_name;
SELECT 
    'Tools table has ' || count(*) || ' policies' as policy_count
FROM pg_policies 
WHERE tablename = 'tools';

SELECT 
    'User subscriptions table has ' || count(*) || ' policies' as policy_count  
FROM pg_policies 
WHERE tablename = 'user_tool_subscriptions';

SELECT 
    'Security functions created: ' || count(*) as function_count
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN (
    'user_has_active_tool_subscription',
    'get_user_active_tools',
    'user_has_any_active_subscription'
); 