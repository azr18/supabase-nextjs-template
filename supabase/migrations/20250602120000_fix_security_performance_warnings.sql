-- Fix Supabase Security and Performance Warnings
-- This migration addresses all security and performance issues identified by the database linter

-- ==================================================
-- SECURITY FIXES
-- ==================================================

-- Fix 1: Function Search Path Mutable - Add search_path to existing functions
CREATE OR REPLACE FUNCTION public.set_reconciliation_job_expiry()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Set expiry to 48 hours from completion for completed jobs
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.expires_at = NOW() + INTERVAL '48 hours';
        NEW.completed_at = NOW();
    END IF;
    
    -- Set failed_at timestamp for failed jobs
    IF NEW.status = 'failed' AND OLD.status != 'failed' THEN
        NEW.failed_at = NOW();
    END IF;
    
    -- Set started_at timestamp when processing begins
    IF NEW.status = 'processing' AND OLD.status != 'processing' THEN
        NEW.started_at = NOW();
    END IF;
    
    -- Set webhook_triggered_at when webhook payload is set
    IF NEW.webhook_payload IS DISTINCT FROM OLD.webhook_payload AND NEW.webhook_payload != '{}' THEN
        NEW.webhook_triggered_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_reconciliation_jobs()
RETURNS INTEGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    -- Update expired jobs status
    UPDATE "public"."reconciliation_jobs"
    SET status = 'expired', updated_at = NOW()
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW() 
    AND status = 'completed';
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    RETURN expired_count;
END;
$$;

-- ==================================================
-- PERFORMANCE FIXES - RLS Policy Optimization
-- ==================================================

-- Fix auth.uid() calls to use (select auth.uid()) for better performance

-- Fix user_tool_subscriptions policies
DROP POLICY IF EXISTS "Users view own subscriptions only" ON "public"."user_tool_subscriptions";
CREATE POLICY "Users view own subscriptions only"
ON "public"."user_tool_subscriptions"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Temporary admin access for MVP" ON "public"."user_tool_subscriptions";
CREATE POLICY "Temporary admin access for MVP"
ON "public"."user_tool_subscriptions"
AS PERMISSIVE
FOR ALL
TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL);

-- Fix reconciliation_jobs policies
DROP POLICY IF EXISTS "Temporary files access control" ON "public"."reconciliation_jobs";
CREATE POLICY "Temporary files access control"
ON "public"."reconciliation_jobs"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
    -- Users can access their own jobs that haven't expired
    (SELECT auth.uid()) = user_id 
    AND (expires_at IS NULL OR expires_at > NOW())
    AND result_file_path IS NOT NULL
);

-- Fix tools policies (consolidate multiple permissive policies)
DROP POLICY IF EXISTS "Admin full access to tools" ON "public"."tools";
DROP POLICY IF EXISTS "Admin manage tools" ON "public"."tools";
DROP POLICY IF EXISTS "Admin view all tools" ON "public"."tools";
DROP POLICY IF EXISTS "Anyone can view active tools" ON "public"."tools";

-- Recreate optimized tools policies
CREATE POLICY "Optimized authenticated tools access"
ON "public"."tools"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
    status IN ('active', 'coming_soon', 'maintenance') 
    OR (SELECT auth.role()) = 'service_role'
);

-- ==================================================
-- INDEX CLEANUP AND OPTIMIZATION
-- ==================================================

-- Fix 3: Remove duplicate indexes/constraints
-- airline_types_code_key is a constraint, not an index - drop the constraint instead
ALTER TABLE "public"."airline_types" DROP CONSTRAINT IF EXISTS "airline_types_code_key";
-- Keep the explicit unique index airline_types_code_unique

-- tools_slug_key is an index constraint - drop it and keep the explicit index
ALTER TABLE "public"."tools" DROP CONSTRAINT IF EXISTS "tools_slug_key";
-- Keep tools_slug_idx

-- Fix 4: Add missing indexes for foreign keys
CREATE INDEX IF NOT EXISTS "reconciliation_jobs_invoice_file_id_idx" 
ON "public"."reconciliation_jobs" USING btree (invoice_file_id);

CREATE INDEX IF NOT EXISTS "reconciliation_jobs_report_file_id_idx" 
ON "public"."reconciliation_jobs" USING btree (report_file_id);

-- Fix 5: Remove unused indexes (only remove clearly unused ones, keep functional ones)
-- Note: Keeping indexes that will be used by the N8N functionality

-- Remove clearly unused indexes from saved_invoices (this table will be removed in N8N approach)
DROP INDEX IF EXISTS "public"."saved_invoices_user_id_idx";
DROP INDEX IF EXISTS "public"."saved_invoices_file_hash_idx";
DROP INDEX IF EXISTS "public"."saved_invoices_upload_date_idx";
DROP INDEX IF EXISTS "public"."saved_invoices_last_used_at_idx";
DROP INDEX IF EXISTS "public"."saved_invoices_is_active_idx";

-- Remove some unused reconciliation_jobs indexes (keep essential ones for N8N)
DROP INDEX IF EXISTS "public"."reconciliation_jobs_user_status_created_idx";
-- Keep: user_id, tool_id, status, created_at, started_at, completed_at, expires_at, n8n indexes

-- Remove unused leads indexes (basic functionality doesn't need all of them)
DROP INDEX IF EXISTS "public"."idx_leads_status";
DROP INDEX IF EXISTS "public"."idx_leads_email";

-- Remove some unused airline_types indexes
DROP INDEX IF EXISTS "public"."airline_types_country_idx";
-- Keep is_active and order_index for functionality

-- ==================================================
-- OPTIMIZED RLS POLICIES FOR BETTER PERFORMANCE
-- ==================================================

-- Consolidate multiple permissive policies where possible

-- Fix saved_invoices multiple policies (will be removed in N8N approach anyway)
-- But for now, consolidate them
DROP POLICY IF EXISTS "Allow authenticated users to insert their own invoices" ON "public"."saved_invoices";
DROP POLICY IF EXISTS "Users can insert own invoices" ON "public"."saved_invoices";
CREATE POLICY "Consolidated insert own invoices"
ON "public"."saved_invoices"
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Allow authenticated users to select their own invoices" ON "public"."saved_invoices";
DROP POLICY IF EXISTS "Users can view own active invoices" ON "public"."saved_invoices";
DROP POLICY IF EXISTS "Users can view own inactive invoices" ON "public"."saved_invoices";
CREATE POLICY "Consolidated select own invoices"
ON "public"."saved_invoices"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Allow authenticated users to update their own invoices" ON "public"."saved_invoices";
DROP POLICY IF EXISTS "Users can update own invoices" ON "public"."saved_invoices";
CREATE POLICY "Consolidated update own invoices"
ON "public"."saved_invoices"
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Allow authenticated users to delete their own invoices" ON "public"."saved_invoices";
CREATE POLICY "Consolidated delete own invoices"
ON "public"."saved_invoices"
AS PERMISSIVE
FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- Fix user_tool_subscriptions multiple policies
DROP POLICY IF EXISTS "Subscriptions visibility rules" ON "public"."user_tool_subscriptions";
-- Keep the simplified "Users view own subscriptions only" and "Temporary admin access for MVP"

-- Fix leads policies for performance
DROP POLICY IF EXISTS "Authenticated admin can view leads" ON "public"."leads";
DROP POLICY IF EXISTS "Authenticated admin can update leads" ON "public"."leads";
DROP POLICY IF EXISTS "Authenticated admin can delete leads" ON "public"."leads";

CREATE POLICY "Optimized admin leads access"
ON "public"."leads"
AS PERMISSIVE
FOR ALL
TO authenticated
USING ((SELECT auth.role()) = 'service_role')
WITH CHECK ((SELECT auth.role()) = 'service_role');

-- ==================================================
-- FUNCTION OPTIMIZATION
-- ==================================================

-- Update other functions to use optimized search_path
CREATE OR REPLACE FUNCTION "public"."user_has_active_tool_subscription"(tool_slug TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    has_subscription BOOLEAN := FALSE;
BEGIN
    -- Check if the current user has an active subscription to the specified tool
    SELECT EXISTS (
        SELECT 1 
        FROM "public"."user_tool_subscriptions" uts
        JOIN "public"."tools" t ON uts.tool_id = t.id
        WHERE uts.user_id = (SELECT auth.uid())
        AND t.slug = tool_slug
        AND uts.status IN ('active', 'trial')
        AND (uts.expires_at IS NULL OR uts.expires_at > NOW())
        AND (uts.trial_ends_at IS NULL OR uts.trial_ends_at > NOW())
    ) INTO has_subscription;
    
    RETURN COALESCE(has_subscription, FALSE);
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_user_active_tools"()
RETURNS TABLE (
    tool_id UUID,
    tool_name TEXT,
    tool_slug TEXT,
    tool_description TEXT,
    tool_icon TEXT,
    subscription_status TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    trial_ends_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id as tool_id,
        t.name as tool_name,
        t.slug as tool_slug,
        t.description as tool_description,
        t.icon as tool_icon,
        uts.status as subscription_status,
        uts.expires_at,
        uts.trial_ends_at
    FROM "public"."user_tool_subscriptions" uts
    JOIN "public"."tools" t ON uts.tool_id = t.id
    WHERE uts.user_id = (SELECT auth.uid())
    AND uts.status IN ('active', 'trial')
    AND (uts.expires_at IS NULL OR uts.expires_at > NOW())
    AND (uts.trial_ends_at IS NULL OR uts.trial_ends_at > NOW())
    AND t.status = 'active'
    ORDER BY t.order_index;
END;
$$;

-- ==================================================
-- COMMENTS AND DOCUMENTATION
-- ==================================================

COMMENT ON FUNCTION public.set_reconciliation_job_expiry() IS 'Trigger function with secure search_path for job status updates';
COMMENT ON FUNCTION public.cleanup_expired_reconciliation_jobs() IS 'Function with secure search_path for cleaning expired jobs';
COMMENT ON POLICY "Optimized authenticated tools access" ON "public"."tools" IS 'Consolidated policy for authenticated user tool access';
COMMENT ON POLICY "Consolidated select own invoices" ON "public"."saved_invoices" IS 'Optimized policy for user invoice access';
COMMENT ON POLICY "Optimized admin leads access" ON "public"."leads" IS 'Consolidated admin access policy for leads management';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Security and performance optimization migration completed successfully';
    RAISE NOTICE 'Fixed: Function search paths, RLS policy performance, duplicate indexes, missing foreign key indexes';
    RAISE NOTICE 'Remaining: Enable leaked password protection in Supabase Auth settings';
END $$; 