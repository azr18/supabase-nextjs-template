-- Manual Storage Policy Testing Script
-- Description: Test storage policies for invoice-reconciler bucket with different user scenarios
-- Created: 2025-05-29

-- IMPORTANT: This script provides SQL queries to test the policies manually
-- You need to run these queries while logged in as different users to test isolation

BEGIN;

-- Create test users for testing
INSERT INTO auth.users (
    id,
    email,
    email_confirmed_at,
    created_at,
    updated_at,
    role
) VALUES 
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'testuser1@example.com',
    NOW(),
    NOW(),
    NOW(),
    'authenticated'
),
(
    '22222222-2222-2222-2222-222222222222'::uuid,
    'testuser2@example.com',
    NOW(),
    NOW(),
    NOW(),
    'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Give test user 1 access to invoice-reconciler tool
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

-- Do NOT give test user 2 access (to test subscription validation)

-- Insert test objects into storage.objects to simulate files
INSERT INTO storage.objects (
    id,
    bucket_id,
    name,
    owner,
    created_at,
    updated_at,
    metadata
) VALUES 
-- User 1's files (should be accessible by user 1 only)
(
    gen_random_uuid(),
    'invoice-reconciler',
    '11111111-1111-1111-1111-111111111111/saved_invoices/fly-dubai/invoice1.pdf',
    '11111111-1111-1111-1111-111111111111'::uuid,
    NOW(),
    NOW(),
    '{"size": 1048576}'::jsonb
),
(
    gen_random_uuid(),
    'invoice-reconciler',
    '11111111-1111-1111-1111-111111111111/jobs/job-123/report.xlsx',
    '11111111-1111-1111-1111-111111111111'::uuid,
    NOW(),
    NOW(),
    '{"size": 2097152}'::jsonb
),
-- User 2's files (should not be accessible by user 1)
(
    gen_random_uuid(),
    'invoice-reconciler',
    '22222222-2222-2222-2222-222222222222/saved_invoices/tap/invoice2.pdf',
    '22222222-2222-2222-2222-222222222222'::uuid,
    NOW(),
    NOW(),
    '{"size": 1048576}'::jsonb
) ON CONFLICT DO NOTHING;

COMMIT;

-- =============================================================================
-- TESTING INSTRUCTIONS:
-- =============================================================================
-- 
-- To properly test the storage policies, you need to test from the application
-- level or using Supabase client with authentication. Here are the test scenarios:
--

-- TEST SCENARIO 1: User Isolation
-- ==============================
-- Goal: Verify users can only see their own files

-- When authenticated as user 11111111-1111-1111-1111-111111111111:
-- This query should return only user 1's files:
/*
SELECT name, owner 
FROM storage.objects 
WHERE bucket_id = 'invoice-reconciler';
*/

-- Expected result: Only files starting with '11111111-1111-1111-1111-111111111111/'

-- TEST SCENARIO 2: Subscription Validation  
-- =======================================
-- Goal: Verify users without active subscriptions cannot access storage

-- When authenticated as user 22222222-2222-2222-2222-222222222222 (no subscription):
-- This query should return no results due to subscription check:
/*
SELECT name, owner 
FROM storage.objects 
WHERE bucket_id = 'invoice-reconciler';
*/

-- Expected result: Empty result set

-- TEST SCENARIO 3: Path Validation
-- ===============================
-- Goal: Verify invalid paths are rejected during INSERT

-- When authenticated as user 11111111-1111-1111-1111-111111111111:
-- This should SUCCEED (valid path):
/*
INSERT INTO storage.objects (
    id, bucket_id, name, owner, created_at, updated_at, metadata
) VALUES (
    gen_random_uuid(),
    'invoice-reconciler',
    '11111111-1111-1111-1111-111111111111/saved_invoices/tap/new-invoice.pdf',
    '11111111-1111-1111-1111-111111111111'::uuid,
    NOW(),
    NOW(),
    '{"size": 1000000}'::jsonb
);
*/

-- This should FAIL (invalid path):
/*
INSERT INTO storage.objects (
    id, bucket_id, name, owner, created_at, updated_at, metadata
) VALUES (
    gen_random_uuid(),
    'invoice-reconciler',
    '11111111-1111-1111-1111-111111111111/invalid-folder/file.pdf',
    '11111111-1111-1111-1111-111111111111'::uuid,
    NOW(),
    NOW(),
    '{"size": 1000000}'::jsonb
);
*/

-- TEST SCENARIO 4: Quota Enforcement
-- =================================
-- Goal: Verify files exceeding quota are rejected

-- This should FAIL (file too large - 110MB):
/*
INSERT INTO storage.objects (
    id, bucket_id, name, owner, created_at, updated_at, metadata
) VALUES (
    gen_random_uuid(),
    'invoice-reconciler',
    '11111111-1111-1111-1111-111111111111/reports/large-file.xlsx',
    '11111111-1111-1111-1111-111111111111'::uuid,
    NOW(),
    NOW(),
    '{"size": 115343360}'::jsonb
);
*/

-- TEST SCENARIO 5: Cross-User Access Prevention
-- ============================================
-- Goal: Verify users cannot access other users' files

-- When authenticated as user 11111111-1111-1111-1111-111111111111:
-- This should FAIL (trying to access user 2's file):
/*
SELECT name, owner 
FROM storage.objects 
WHERE bucket_id = 'invoice-reconciler' 
AND name = '22222222-2222-2222-2222-222222222222/saved_invoices/tap/invoice2.pdf';
*/

-- Expected result: Empty result set (policy blocks access)

-- =============================================================================
-- CLEANUP (Run this after testing):
-- =============================================================================

-- Clean up test data
/*
DELETE FROM storage.objects 
WHERE bucket_id = 'invoice-reconciler' 
AND (name LIKE '11111111-1111-1111-1111-111111111111/%' 
     OR name LIKE '22222222-2222-2222-2222-222222222222/%');

DELETE FROM user_tool_subscriptions 
WHERE user_id IN (
    '11111111-1111-1111-1111-111111111111'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid
);

DELETE FROM auth.users 
WHERE id IN (
    '11111111-1111-1111-1111-111111111111'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid
);
*/

-- =============================================================================
-- NOTES FOR BROWSER TESTING:
-- =============================================================================
--
-- For real-world testing, you should:
-- 1. Create actual user accounts via the app registration
-- 2. Use the Supabase JavaScript client to test file operations
-- 3. Try uploading files through your app's file upload interface
-- 4. Verify the policies work in the browser console or app logs
--
-- Example JavaScript test (run in browser console when logged in):
-- 
-- // Test file upload
-- const { data, error } = await supabase.storage
--   .from('invoice-reconciler')
--   .upload('user-id/saved_invoices/fly-dubai/test.pdf', file);
--
-- // Should succeed for valid paths, fail for invalid paths
-- console.log('Upload result:', { data, error });
--
-- // Test file listing  
-- const { data: files, error: listError } = await supabase.storage
--   .from('invoice-reconciler')
--   .list('user-id/saved_invoices');
--
-- // Should only show user's own files
-- console.log('Files:', { files, listError }); 