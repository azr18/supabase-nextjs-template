-- Comprehensive Database Setup Test for Invoice Reconciler SaaS Platform
-- Tests all migrations from tasks 1.1-1.13
-- Run this test to verify complete database schema and security setup

-- =============================================================================
-- TEST SETUP AND CLEANUP
-- =============================================================================

-- Create test users for isolation
INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, confirmed_at)
VALUES 
  ('test-user-1', 'test1@example.com', crypt('password123', gen_salt('bf')), now(), now(), now()),
  ('test-user-2', 'test2@example.com', crypt('password123', gen_salt('bf')), now(), now(), now())
ON CONFLICT (id) DO NOTHING;

-- Clean up any existing test data
DO $$
BEGIN
  -- Delete test data in correct order (respect foreign keys)
  DELETE FROM reconciliation_jobs WHERE user_id IN ('test-user-1', 'test-user-2');
  DELETE FROM saved_invoices WHERE user_id IN ('test-user-1', 'test-user-2');
  DELETE FROM user_tool_subscriptions WHERE user_id IN ('test-user-1', 'test-user-2');
END $$;

-- =============================================================================
-- 1. TEST TABLE CREATION AND STRUCTURE
-- =============================================================================

-- Test that all required tables exist with correct structure
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  -- Check tools table
  SELECT COUNT(*) INTO table_count FROM information_schema.tables 
  WHERE table_name = 'tools' AND table_schema = 'public';
  IF table_count = 0 THEN
    RAISE EXCEPTION 'FAIL: tools table does not exist';
  END IF;

  -- Check user_tool_subscriptions table
  SELECT COUNT(*) INTO table_count FROM information_schema.tables 
  WHERE table_name = 'user_tool_subscriptions' AND table_schema = 'public';
  IF table_count = 0 THEN
    RAISE EXCEPTION 'FAIL: user_tool_subscriptions table does not exist';
  END IF;

  -- Check saved_invoices table
  SELECT COUNT(*) INTO table_count FROM information_schema.tables 
  WHERE table_name = 'saved_invoices' AND table_schema = 'public';
  IF table_count = 0 THEN
    RAISE EXCEPTION 'FAIL: saved_invoices table does not exist';
  END IF;

  -- Check reconciliation_jobs table
  SELECT COUNT(*) INTO table_count FROM information_schema.tables 
  WHERE table_name = 'reconciliation_jobs' AND table_schema = 'public';
  IF table_count = 0 THEN
    RAISE EXCEPTION 'FAIL: reconciliation_jobs table does not exist';
  END IF;

  -- Check airline_types table
  SELECT COUNT(*) INTO table_count FROM information_schema.tables 
  WHERE table_name = 'airline_types' AND table_schema = 'public';
  IF table_count = 0 THEN
    RAISE EXCEPTION 'FAIL: airline_types table does not exist';
  END IF;

  RAISE NOTICE 'PASS: All required tables exist';
END $$;

-- =============================================================================
-- 2. TEST INITIAL DATA SETUP
-- =============================================================================

-- Test that initial data was properly inserted
DO $$
DECLARE
  tool_count INTEGER;
  airline_count INTEGER;
BEGIN
  -- Check tools data
  SELECT COUNT(*) INTO tool_count FROM tools WHERE tool_key = 'invoice-reconciler';
  IF tool_count = 0 THEN
    RAISE EXCEPTION 'FAIL: Invoice reconciler tool not found in tools table';
  END IF;

  -- Check airline types data
  SELECT COUNT(*) INTO airline_count FROM airline_types 
  WHERE airline_code IN ('FDB', 'TAP', 'PAL', 'AI', 'LY');
  IF airline_count < 5 THEN
    RAISE EXCEPTION 'FAIL: Not all required airlines found in airline_types table';
  END IF;

  RAISE NOTICE 'PASS: Initial data properly inserted';
END $$;

-- =============================================================================
-- 3. TEST ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Test RLS is enabled on all tables
DO $$
DECLARE
  rls_enabled BOOLEAN;
BEGIN
  -- Check tools table RLS
  SELECT relrowsecurity INTO rls_enabled FROM pg_class WHERE relname = 'tools';
  IF NOT rls_enabled THEN
    RAISE EXCEPTION 'FAIL: RLS not enabled on tools table';
  END IF;

  -- Check user_tool_subscriptions table RLS
  SELECT relrowsecurity INTO rls_enabled FROM pg_class WHERE relname = 'user_tool_subscriptions';
  IF NOT rls_enabled THEN
    RAISE EXCEPTION 'FAIL: RLS not enabled on user_tool_subscriptions table';
  END IF;

  -- Check saved_invoices table RLS
  SELECT relrowsecurity INTO rls_enabled FROM pg_class WHERE relname = 'saved_invoices';
  IF NOT rls_enabled THEN
    RAISE EXCEPTION 'FAIL: RLS not enabled on saved_invoices table';
  END IF;

  -- Check reconciliation_jobs table RLS
  SELECT relrowsecurity INTO rls_enabled FROM pg_class WHERE relname = 'reconciliation_jobs';
  IF NOT rls_enabled THEN
    RAISE EXCEPTION 'FAIL: RLS not enabled on reconciliation_jobs table';
  END IF;

  RAISE NOTICE 'PASS: RLS enabled on all tables';
END $$;

-- =============================================================================
-- 4. TEST SUBSCRIPTION MANAGEMENT
-- =============================================================================

-- Test user subscription management
DO $$
DECLARE
  subscription_id UUID;
  tool_id UUID;
BEGIN
  -- Get tool ID
  SELECT id INTO tool_id FROM tools WHERE tool_key = 'invoice-reconciler';

  -- Create subscription for test user 1
  INSERT INTO user_tool_subscriptions (user_id, tool_id, subscription_status)
  VALUES ('test-user-1', tool_id, 'active')
  RETURNING id INTO subscription_id;

  IF subscription_id IS NULL THEN
    RAISE EXCEPTION 'FAIL: Could not create user subscription';
  END IF;

  -- Test subscription query
  PERFORM 1 FROM user_tool_subscriptions 
  WHERE user_id = 'test-user-1' AND tool_id = tool_id AND subscription_status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'FAIL: Could not retrieve created subscription';
  END IF;

  RAISE NOTICE 'PASS: Subscription management working';
END $$;

-- =============================================================================
-- 5. TEST INVOICE STORAGE AND DUPLICATE DETECTION
-- =============================================================================

-- Test saved invoices functionality
DO $$
DECLARE
  invoice_id UUID;
  duplicate_detected BOOLEAN;
  tool_id UUID;
BEGIN
  -- Get tool ID
  SELECT id INTO tool_id FROM tools WHERE tool_key = 'invoice-reconciler';

  -- Insert test invoice
  INSERT INTO saved_invoices (
    user_id, tool_id, airline_code, original_filename, 
    file_hash, file_size, file_path, metadata
  )
  VALUES (
    'test-user-1', tool_id, 'FDB', 'test-invoice.pdf',
    'sha256-test-hash-123', 1024000, 'test-user-1/FDB/test-invoice.pdf',
    '{"upload_date": "2025-01-01", "validated": true}'::jsonb
  )
  RETURNING id INTO invoice_id;

  IF invoice_id IS NULL THEN
    RAISE EXCEPTION 'FAIL: Could not create saved invoice';
  END IF;

  -- Test duplicate detection by trying to insert same hash
  BEGIN
    INSERT INTO saved_invoices (
      user_id, tool_id, airline_code, original_filename, 
      file_hash, file_size, file_path, metadata
    )
    VALUES (
      'test-user-1', tool_id, 'FDB', 'test-invoice-duplicate.pdf',
      'sha256-test-hash-123', 1024000, 'test-user-1/FDB/test-invoice-duplicate.pdf',
      '{"upload_date": "2025-01-01", "validated": true}'::jsonb
    );
    duplicate_detected := FALSE;
  EXCEPTION WHEN unique_violation THEN
    duplicate_detected := TRUE;
  END;

  IF NOT duplicate_detected THEN
    RAISE EXCEPTION 'FAIL: Duplicate detection constraint not working';
  END IF;

  RAISE NOTICE 'PASS: Invoice storage and duplicate detection working';
END $$;

-- =============================================================================
-- 6. TEST RECONCILIATION JOBS
-- =============================================================================

-- Test reconciliation jobs functionality
DO $$
DECLARE
  job_id UUID;
  invoice_id UUID;
  tool_id UUID;
BEGIN
  -- Get tool ID and invoice ID
  SELECT id INTO tool_id FROM tools WHERE tool_key = 'invoice-reconciler';
  SELECT id INTO invoice_id FROM saved_invoices WHERE user_id = 'test-user-1';

  -- Create reconciliation job
  INSERT INTO reconciliation_jobs (
    user_id, tool_id, saved_invoice_id, airline_code,
    report_file_path, job_status, metadata
  )
  VALUES (
    'test-user-1', tool_id, invoice_id, 'FDB',
    'test-user-1/jobs/job-123/report.xlsx', 'pending',
    '{"created_via": "test", "airline_type": "FDB"}'::jsonb
  )
  RETURNING id INTO job_id;

  IF job_id IS NULL THEN
    RAISE EXCEPTION 'FAIL: Could not create reconciliation job';
  END IF;

  -- Test job status update
  UPDATE reconciliation_jobs 
  SET job_status = 'completed', completed_at = now()
  WHERE id = job_id;

  RAISE NOTICE 'PASS: Reconciliation jobs functionality working';
END $$;

-- =============================================================================
-- 7. TEST STORAGE FUNCTIONS AND QUOTA ENFORCEMENT
-- =============================================================================

-- Test storage utility functions
DO $$
DECLARE
  user_storage_used BIGINT;
  quota_check BOOLEAN;
BEGIN
  -- Test storage calculation function
  SELECT get_user_storage_used('test-user-1') INTO user_storage_used;
  
  IF user_storage_used IS NULL THEN
    RAISE EXCEPTION 'FAIL: Storage calculation function not working';
  END IF;

  -- Test quota validation function
  SELECT validate_user_storage_quota('test-user-1', 50000000) INTO quota_check;
  
  IF NOT quota_check THEN
    RAISE EXCEPTION 'FAIL: Storage quota validation not working properly';
  END IF;

  -- Test quota enforcement (should fail for large file)
  SELECT validate_user_storage_quota('test-user-1', 150000000) INTO quota_check;
  
  IF quota_check THEN
    RAISE EXCEPTION 'FAIL: Storage quota enforcement not working (should reject large file)';
  END IF;

  RAISE NOTICE 'PASS: Storage functions and quota enforcement working';
END $$;

-- =============================================================================
-- 8. TEST SECURITY FUNCTIONS
-- =============================================================================

-- Test security helper functions
DO $$
DECLARE
  has_subscription BOOLEAN;
  path_valid BOOLEAN;
BEGIN
  -- Test subscription validation function
  SELECT user_has_active_tool_subscription('test-user-1', 'invoice-reconciler') INTO has_subscription;
  
  IF NOT has_subscription THEN
    RAISE EXCEPTION 'FAIL: Subscription validation function not working';
  END IF;

  -- Test user without subscription
  SELECT user_has_active_tool_subscription('test-user-2', 'invoice-reconciler') INTO has_subscription;
  
  IF has_subscription THEN
    RAISE EXCEPTION 'FAIL: Subscription validation should return false for user without subscription';
  END IF;

  -- Test path validation function
  SELECT validate_user_file_path('test-user-1', 'test-user-1/FDB/invoice.pdf') INTO path_valid;
  
  IF NOT path_valid THEN
    RAISE EXCEPTION 'FAIL: Valid path rejected by validation function';
  END IF;

  -- Test invalid path (different user)
  SELECT validate_user_file_path('test-user-1', 'test-user-2/FDB/invoice.pdf') INTO path_valid;
  
  IF path_valid THEN
    RAISE EXCEPTION 'FAIL: Invalid path accepted by validation function';
  END IF;

  RAISE NOTICE 'PASS: Security functions working correctly';
END $$;

-- =============================================================================
-- 9. TEST USER ISOLATION (RLS POLICIES)
-- =============================================================================

-- Test that users can only see their own data
DO $$
DECLARE
  tool_id UUID;
  user1_invoice_count INTEGER;
  user2_invoice_count INTEGER;
BEGIN
  -- Get tool ID
  SELECT id INTO tool_id FROM tools WHERE tool_key = 'invoice-reconciler';

  -- Create subscription for test user 2
  INSERT INTO user_tool_subscriptions (user_id, tool_id, subscription_status)
  VALUES ('test-user-2', tool_id, 'active');

  -- Add invoice for user 2
  INSERT INTO saved_invoices (
    user_id, tool_id, airline_code, original_filename, 
    file_hash, file_size, file_path, metadata
  )
  VALUES (
    'test-user-2', tool_id, 'TAP', 'user2-invoice.pdf',
    'sha256-test-hash-456', 2048000, 'test-user-2/TAP/user2-invoice.pdf',
    '{"upload_date": "2025-01-01", "validated": true}'::jsonb
  );

  -- Test user isolation by setting RLS context
  PERFORM set_config('request.jwt.claims', '{"sub": "test-user-1"}', true);
  
  -- User 1 should only see their own invoices
  SELECT COUNT(*) INTO user1_invoice_count FROM saved_invoices;
  
  PERFORM set_config('request.jwt.claims', '{"sub": "test-user-2"}', true);
  
  -- User 2 should only see their own invoices  
  SELECT COUNT(*) INTO user2_invoice_count FROM saved_invoices;

  -- Reset context
  PERFORM set_config('request.jwt.claims', NULL, true);

  -- Each user should see exactly 1 invoice (their own)
  IF user1_invoice_count != 1 OR user2_invoice_count != 1 THEN
    RAISE EXCEPTION 'FAIL: RLS policies not properly isolating user data. User1: %, User2: %', 
      user1_invoice_count, user2_invoice_count;
  END IF;

  RAISE NOTICE 'PASS: User data isolation working correctly';
END $$;

-- =============================================================================
-- 10. TEST DATABASE CONSTRAINTS AND REFERENTIAL INTEGRITY
-- =============================================================================

-- Test foreign key constraints
DO $$
DECLARE
  constraint_violation BOOLEAN := FALSE;
BEGIN
  -- Test invalid tool_id in user_tool_subscriptions
  BEGIN
    INSERT INTO user_tool_subscriptions (user_id, tool_id, subscription_status)
    VALUES ('test-user-1', gen_random_uuid(), 'active');
    constraint_violation := FALSE;
  EXCEPTION WHEN foreign_key_violation THEN
    constraint_violation := TRUE;
  END;

  IF NOT constraint_violation THEN
    RAISE EXCEPTION 'FAIL: Foreign key constraint not enforced on user_tool_subscriptions.tool_id';
  END IF;

  -- Test invalid user_id in saved_invoices
  BEGIN
    INSERT INTO saved_invoices (
      user_id, tool_id, airline_code, original_filename, 
      file_hash, file_size, file_path, metadata
    )
    SELECT 
      gen_random_uuid(), id, 'FDB', 'test.pdf',
      'sha256-test', 1024, 'test/path.pdf', '{}'::jsonb
    FROM tools WHERE tool_key = 'invoice-reconciler';
    constraint_violation := FALSE;
  EXCEPTION WHEN foreign_key_violation THEN
    constraint_violation := TRUE;
  END;

  IF NOT constraint_violation THEN
    RAISE EXCEPTION 'FAIL: Foreign key constraint not enforced on saved_invoices.user_id';
  END IF;

  RAISE NOTICE 'PASS: Database constraints and referential integrity working';
END $$;

-- =============================================================================
-- 11. TEST STORAGE BUCKET CONFIGURATION
-- =============================================================================

-- Test that storage bucket exists and has correct configuration
DO $$
DECLARE
  bucket_count INTEGER;
BEGIN
  -- Check if invoice-reconciler bucket exists
  SELECT COUNT(*) INTO bucket_count 
  FROM storage.buckets 
  WHERE name = 'invoice-reconciler';

  IF bucket_count = 0 THEN
    RAISE EXCEPTION 'FAIL: invoice-reconciler storage bucket does not exist';
  END IF;

  -- Verify bucket configuration
  PERFORM 1 FROM storage.buckets 
  WHERE name = 'invoice-reconciler' 
    AND public = false 
    AND file_size_limit IS NOT NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'FAIL: Storage bucket configuration incorrect';
  END IF;

  RAISE NOTICE 'PASS: Storage bucket properly configured';
END $$;

-- =============================================================================
-- TEST CLEANUP
-- =============================================================================

-- Clean up test data
DO $$
BEGIN
  -- Delete test data in correct order
  DELETE FROM reconciliation_jobs WHERE user_id IN ('test-user-1', 'test-user-2');
  DELETE FROM saved_invoices WHERE user_id IN ('test-user-1', 'test-user-2');
  DELETE FROM user_tool_subscriptions WHERE user_id IN ('test-user-1', 'test-user-2');
  
  -- Note: We don't delete test users from auth.users as they might be needed for other tests
  RAISE NOTICE 'Test cleanup completed';
END $$;

-- =============================================================================
-- TEST SUMMARY
-- =============================================================================

SELECT 'DATABASE SETUP TESTS COMPLETED SUCCESSFULLY' as test_result,
       'All tables, RLS policies, storage buckets, constraints, and functions are working correctly' as details; 