-- Migration: Create database constraints for referential integrity
-- This ensures data consistency across tools, subscriptions, jobs, and airline types

-- =================================================================
-- FOREIGN KEY CONSTRAINTS
-- =================================================================

-- Add foreign key constraint from user_tool_subscriptions to tools
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_user_tool_subscriptions_tool_id'
        AND table_name = 'user_tool_subscriptions'
    ) THEN
        ALTER TABLE user_tool_subscriptions 
        ADD CONSTRAINT fk_user_tool_subscriptions_tool_id 
        FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraint from user_tool_subscriptions to auth.users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_user_tool_subscriptions_user_id'
        AND table_name = 'user_tool_subscriptions'
    ) THEN
        ALTER TABLE user_tool_subscriptions 
        ADD CONSTRAINT fk_user_tool_subscriptions_user_id 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraint from reconciliation_jobs to auth.users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_reconciliation_jobs_user_id'
        AND table_name = 'reconciliation_jobs'
    ) THEN
        ALTER TABLE reconciliation_jobs 
        ADD CONSTRAINT fk_reconciliation_jobs_user_id 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraint from reconciliation_jobs to airline_types
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_reconciliation_jobs_airline_type'
        AND table_name = 'reconciliation_jobs'
    ) THEN
        ALTER TABLE reconciliation_jobs 
        ADD CONSTRAINT fk_reconciliation_jobs_airline_type 
        FOREIGN KEY (airline_type) REFERENCES airline_types(code) ON DELETE RESTRICT;
    END IF;
END $$;

-- =================================================================
-- UNIQUE CONSTRAINTS
-- =================================================================

-- Ensure tool names are unique
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_tool_name'
        AND table_name = 'tools'
    ) THEN
        ALTER TABLE tools 
        ADD CONSTRAINT unique_tool_name UNIQUE (name);
    END IF;
END $$;

-- Ensure airline codes are unique
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_airline_code'
        AND table_name = 'airline_types'
    ) THEN
        ALTER TABLE airline_types 
        ADD CONSTRAINT unique_airline_code UNIQUE (code);
    END IF;
END $$;

-- Ensure one active subscription per user per tool
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_active_user_tool_subscription'
        AND table_name = 'user_tool_subscriptions'
    ) THEN
        ALTER TABLE user_tool_subscriptions 
        ADD CONSTRAINT unique_active_user_tool_subscription 
        UNIQUE (user_id, tool_id, status) 
        DEFERRABLE INITIALLY DEFERRED;
    END IF;
END $$;

-- =================================================================
-- CHECK CONSTRAINTS
-- =================================================================

-- Ensure valid subscription status values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'check_subscription_status'
    ) THEN
        ALTER TABLE user_tool_subscriptions 
        ADD CONSTRAINT check_subscription_status 
        CHECK (status IN ('active', 'inactive', 'trial', 'expired', 'cancelled'));
    END IF;
END $$;

-- Ensure valid job status values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'check_job_status'
    ) THEN
        ALTER TABLE reconciliation_jobs 
        ADD CONSTRAINT check_job_status 
        CHECK (status IN ('uploading', 'submitted', 'processing', 'completed', 'failed', 'expired'));
    END IF;
END $$;

-- Ensure job_id is not empty
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'check_job_id_not_empty'
    ) THEN
        ALTER TABLE reconciliation_jobs 
        ADD CONSTRAINT check_job_id_not_empty 
        CHECK (length(trim(job_id)) > 0);
    END IF;
END $$;

-- Ensure airline_type is not empty
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'check_airline_type_not_empty'
    ) THEN
        ALTER TABLE reconciliation_jobs 
        ADD CONSTRAINT check_airline_type_not_empty 
        CHECK (length(trim(airline_type)) > 0);
    END IF;
END $$;

-- Ensure expires_at is in the future when set
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'check_expires_at_future'
    ) THEN
        ALTER TABLE reconciliation_jobs 
        ADD CONSTRAINT check_expires_at_future 
        CHECK (expires_at IS NULL OR expires_at > created_at);
    END IF;
END $$;

-- =================================================================
-- INDEXES FOR PERFORMANCE
-- =================================================================

-- Index for user lookup on subscriptions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_user_tool_subscriptions_user_id'
    ) THEN
        CREATE INDEX idx_user_tool_subscriptions_user_id 
        ON user_tool_subscriptions(user_id);
    END IF;
END $$;

-- Index for tool lookup on subscriptions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_user_tool_subscriptions_tool_id'
    ) THEN
        CREATE INDEX idx_user_tool_subscriptions_tool_id 
        ON user_tool_subscriptions(tool_id);
    END IF;
END $$;

-- Index for active subscriptions lookup
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_user_tool_subscriptions_active'
    ) THEN
        CREATE INDEX idx_user_tool_subscriptions_active 
        ON user_tool_subscriptions(user_id, tool_id, status) 
        WHERE status = 'active';
    END IF;
END $$;

-- Index for user jobs lookup
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_reconciliation_jobs_user_id'
    ) THEN
        CREATE INDEX idx_reconciliation_jobs_user_id 
        ON reconciliation_jobs(user_id);
    END IF;
END $$;

-- Index for job status lookup
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_reconciliation_jobs_status'
    ) THEN
        CREATE INDEX idx_reconciliation_jobs_status 
        ON reconciliation_jobs(status);
    END IF;
END $$;

-- Index for job expiry cleanup
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_reconciliation_jobs_expires_at'
    ) THEN
        CREATE INDEX idx_reconciliation_jobs_expires_at 
        ON reconciliation_jobs(expires_at) 
        WHERE expires_at IS NOT NULL;
    END IF;
END $$;

-- Composite index for user job history with status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_reconciliation_jobs_user_status_created'
    ) THEN
        CREATE INDEX idx_reconciliation_jobs_user_status_created 
        ON reconciliation_jobs(user_id, status, created_at DESC);
    END IF;
END $$;

-- =================================================================
-- VERIFICATION FUNCTION
-- =================================================================

CREATE OR REPLACE FUNCTION verify_database_constraints()
RETURNS TABLE (
    table_name text,
    constraint_name text,
    constraint_type text,
    is_valid boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tc.table_name::text,
        tc.constraint_name::text,
        tc.constraint_type::text,
        CASE 
            WHEN tc.constraint_type = 'FOREIGN KEY' THEN 
                (SELECT COUNT(*) = 0 FROM information_schema.constraint_column_usage ccu 
                 WHERE ccu.constraint_name = tc.constraint_name)
            ELSE true
        END as is_valid
    FROM information_schema.table_constraints tc
    WHERE tc.table_schema = 'public'
    AND tc.table_name IN ('tools', 'user_tool_subscriptions', 'reconciliation_jobs', 'airline_types')
    AND tc.constraint_type IN ('FOREIGN KEY', 'UNIQUE', 'CHECK')
    ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;
END;
$$;

-- Test database constraints
SELECT 'Database constraints verification:' as status;
SELECT * FROM verify_database_constraints(); 