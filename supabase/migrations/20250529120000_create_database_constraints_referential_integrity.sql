-- Create database constraints for referential integrity
-- This migration adds missing foreign key constraints and check constraints to ensure data consistency

-- First, let's add any missing foreign key constraints that weren't included in the original table migrations

-- 1. Add foreign key constraints from saved_invoices to airline_types (if not already present)
-- This ensures that airline_type in saved_invoices references a valid airline_types.code
DO $$
BEGIN
    -- Check if the constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'saved_invoices_airline_type_fkey' 
        AND table_name = 'saved_invoices'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE "public"."saved_invoices" 
        ADD CONSTRAINT "saved_invoices_airline_type_fkey" 
        FOREIGN KEY (airline_type) REFERENCES "public"."airline_types"(code) ON DELETE RESTRICT;
    END IF;
END $$;

-- 2. Add foreign key constraints from reconciliation_jobs to airline_types (if not already present)
-- This ensures that airline_type in reconciliation_jobs references a valid airline_types.code
DO $$
BEGIN
    -- Check if the constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'reconciliation_jobs_airline_type_fkey' 
        AND table_name = 'reconciliation_jobs'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE "public"."reconciliation_jobs" 
        ADD CONSTRAINT "reconciliation_jobs_airline_type_fkey" 
        FOREIGN KEY (airline_type) REFERENCES "public"."airline_types"(code) ON DELETE RESTRICT;
    END IF;
END $$;

-- 3. Add check constraints to ensure data consistency

-- Ensure that completed_at is only set when status is 'completed'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'reconciliation_jobs_completed_at_status_check'
    ) THEN
        ALTER TABLE "public"."reconciliation_jobs" 
        ADD CONSTRAINT "reconciliation_jobs_completed_at_status_check" 
        CHECK (
            (status = 'completed' AND completed_at IS NOT NULL) OR 
            (status != 'completed' AND completed_at IS NULL)
        );
    END IF;
END $$;

-- Ensure that failed_at is only set when status is 'failed'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'reconciliation_jobs_failed_at_status_check'
    ) THEN
        ALTER TABLE "public"."reconciliation_jobs" 
        ADD CONSTRAINT "reconciliation_jobs_failed_at_status_check" 
        CHECK (
            (status = 'failed' AND failed_at IS NOT NULL) OR 
            (status != 'failed' AND failed_at IS NULL)
        );
    END IF;
END $$;

-- Ensure that error_message is only set when status is 'failed'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'reconciliation_jobs_error_message_status_check'
    ) THEN
        ALTER TABLE "public"."reconciliation_jobs" 
        ADD CONSTRAINT "reconciliation_jobs_error_message_status_check" 
        CHECK (
            (status = 'failed' AND error_message IS NOT NULL) OR 
            (status != 'failed' AND error_message IS NULL)
        );
    END IF;
END $$;

-- Ensure that expires_at is in the future when set
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'user_tool_subscriptions_expires_at_future_check'
    ) THEN
        ALTER TABLE "public"."user_tool_subscriptions" 
        ADD CONSTRAINT "user_tool_subscriptions_expires_at_future_check" 
        CHECK (expires_at IS NULL OR expires_at > started_at);
    END IF;
END $$;

-- Ensure that trial_ends_at is in the future when set and after started_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'user_tool_subscriptions_trial_ends_at_check'
    ) THEN
        ALTER TABLE "public"."user_tool_subscriptions" 
        ADD CONSTRAINT "user_tool_subscriptions_trial_ends_at_check" 
        CHECK (trial_ends_at IS NULL OR trial_ends_at > started_at);
    END IF;
END $$;

-- 4. Add additional check constraints for file validation

-- Ensure file_size is reasonable (not more than 100MB = 104,857,600 bytes)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'saved_invoices_file_size_limit_check'
    ) THEN
        ALTER TABLE "public"."saved_invoices" 
        ADD CONSTRAINT "saved_invoices_file_size_limit_check" 
        CHECK (file_size <= 104857600); -- 100MB limit
    END IF;
END $$;

-- Ensure file_hash is a valid SHA-256 hash (64 hexadecimal characters)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'saved_invoices_file_hash_format_check'
    ) THEN
        ALTER TABLE "public"."saved_invoices" 
        ADD CONSTRAINT "saved_invoices_file_hash_format_check" 
        CHECK (file_hash ~ '^[a-fA-F0-9]{64}$');
    END IF;
END $$;

-- Ensure MIME type is valid for PDF files
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'saved_invoices_mime_type_check'
    ) THEN
        ALTER TABLE "public"."saved_invoices" 
        ADD CONSTRAINT "saved_invoices_mime_type_check" 
        CHECK (mime_type IN ('application/pdf', 'application/x-pdf'));
    END IF;
END $$;

-- 5. Add constraint to ensure job duration consistency
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'reconciliation_jobs_duration_consistency_check'
    ) THEN
        ALTER TABLE "public"."reconciliation_jobs" 
        ADD CONSTRAINT "reconciliation_jobs_duration_consistency_check" 
        CHECK (
            (actual_duration_minutes IS NULL) OR 
            (actual_duration_minutes >= 0 AND actual_duration_minutes <= 10080) -- Max 7 days
        );
    END IF;
END $$;

-- 6. Add constraint to ensure logical date ordering in reconciliation_jobs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'reconciliation_jobs_date_order_check'
    ) THEN
        ALTER TABLE "public"."reconciliation_jobs" 
        ADD CONSTRAINT "reconciliation_jobs_date_order_check" 
        CHECK (
            (started_at IS NULL OR started_at >= created_at) AND
            (completed_at IS NULL OR (started_at IS NOT NULL AND completed_at >= started_at)) AND
            (failed_at IS NULL OR (started_at IS NOT NULL AND failed_at >= started_at))
        );
    END IF;
END $$;

-- 7. Add constraint to ensure subscription logical consistency
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'user_tool_subscriptions_status_consistency_check'
    ) THEN
        ALTER TABLE "public"."user_tool_subscriptions" 
        ADD CONSTRAINT "user_tool_subscriptions_status_consistency_check" 
        CHECK (
            -- If status is 'trial', trial_ends_at must be set
            (status != 'trial' OR trial_ends_at IS NOT NULL) AND
            -- If status is 'expired', expires_at must be set and in the past
            (status != 'expired' OR (expires_at IS NOT NULL AND expires_at <= NOW()))
        );
    END IF;
END $$;

-- 8. Create a function to validate referential integrity across the entire system
CREATE OR REPLACE FUNCTION public.validate_referential_integrity()
RETURNS TABLE(
    table_name TEXT,
    constraint_type TEXT,
    issue_count BIGINT,
    description TEXT
) AS $$
BEGIN
    -- Check for orphaned user_tool_subscriptions
    RETURN QUERY
    SELECT 
        'user_tool_subscriptions'::TEXT,
        'foreign_key'::TEXT,
        COUNT(*)::BIGINT,
        'Subscriptions referencing non-existent users or tools'::TEXT
    FROM "public"."user_tool_subscriptions" uts
    WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = uts.user_id)
       OR NOT EXISTS (SELECT 1 FROM "public"."tools" t WHERE t.id = uts.tool_id);

    -- Check for orphaned saved_invoices
    RETURN QUERY
    SELECT 
        'saved_invoices'::TEXT,
        'foreign_key'::TEXT,
        COUNT(*)::BIGINT,
        'Saved invoices referencing non-existent users or invalid airline types'::TEXT
    FROM "public"."saved_invoices" si
    WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = si.user_id)
       OR NOT EXISTS (SELECT 1 FROM "public"."airline_types" at WHERE at.code = si.airline_type);

    -- Check for orphaned reconciliation_jobs
    RETURN QUERY
    SELECT 
        'reconciliation_jobs'::TEXT,
        'foreign_key'::TEXT,
        COUNT(*)::BIGINT,
        'Reconciliation jobs referencing non-existent users, tools, or invalid airline types'::TEXT
    FROM "public"."reconciliation_jobs" rj
    WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = rj.user_id)
       OR NOT EXISTS (SELECT 1 FROM "public"."tools" t WHERE t.id = rj.tool_id)
       OR NOT EXISTS (SELECT 1 FROM "public"."airline_types" at WHERE at.code = rj.airline_type);

    -- Check for invalid reconciliation job references to saved invoices
    RETURN QUERY
    SELECT 
        'reconciliation_jobs'::TEXT,
        'foreign_key'::TEXT,
        COUNT(*)::BIGINT,
        'Reconciliation jobs referencing non-existent saved invoices'::TEXT
    FROM "public"."reconciliation_jobs" rj
    WHERE (rj.invoice_file_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM "public"."saved_invoices" si WHERE si.id = rj.invoice_file_id
    )) OR (rj.report_file_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM "public"."saved_invoices" si WHERE si.id = rj.report_file_id
    ));

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service_role for admin validation
GRANT EXECUTE ON FUNCTION public.validate_referential_integrity() TO "service_role";

-- 9. Create a function to clean up orphaned records (admin use only)
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_records()
RETURNS TABLE(
    action TEXT,
    table_name TEXT,
    records_affected BIGINT
) AS $$
DECLARE
    affected_count BIGINT;
BEGIN
    -- Clean up orphaned user_tool_subscriptions (users that no longer exist)
    DELETE FROM "public"."user_tool_subscriptions" 
    WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = user_id);
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    
    RETURN QUERY SELECT 'DELETE'::TEXT, 'user_tool_subscriptions'::TEXT, affected_count;

    -- Clean up orphaned saved_invoices (users that no longer exist)
    DELETE FROM "public"."saved_invoices" 
    WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = user_id);
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    
    RETURN QUERY SELECT 'DELETE'::TEXT, 'saved_invoices'::TEXT, affected_count;

    -- Clean up orphaned reconciliation_jobs (users that no longer exist)
    DELETE FROM "public"."reconciliation_jobs" 
    WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = user_id);
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    
    RETURN QUERY SELECT 'DELETE'::TEXT, 'reconciliation_jobs'::TEXT, affected_count;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service_role only (admin function)
GRANT EXECUTE ON FUNCTION public.cleanup_orphaned_records() TO "service_role";

-- 10. Add comments for documentation
COMMENT ON CONSTRAINT "saved_invoices_airline_type_fkey" ON "public"."saved_invoices" 
IS 'Ensures airline_type references a valid airline configuration';

COMMENT ON CONSTRAINT "reconciliation_jobs_airline_type_fkey" ON "public"."reconciliation_jobs" 
IS 'Ensures airline_type references a valid airline configuration';

COMMENT ON FUNCTION public.validate_referential_integrity() 
IS 'Admin function to check for referential integrity violations across all tables';

COMMENT ON FUNCTION public.cleanup_orphaned_records() 
IS 'Admin function to clean up orphaned records (use with caution)';

-- Final verification: Create a report of all foreign key constraints in the system
CREATE OR REPLACE VIEW public.system_foreign_key_constraints AS
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule,
    rc.update_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
    AND tc.table_schema = rc.constraint_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('tools', 'user_tool_subscriptions', 'saved_invoices', 'reconciliation_jobs', 'airline_types')
ORDER BY tc.table_name, tc.constraint_name;

-- Grant view access to service_role for admin monitoring
GRANT SELECT ON public.system_foreign_key_constraints TO "service_role"; 