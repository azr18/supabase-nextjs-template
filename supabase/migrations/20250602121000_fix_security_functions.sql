-- Part 1: Fix Function Search Path Security Issues
-- This migration addresses function search_path vulnerabilities

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

-- Update subscription functions with secure search_path
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

-- Add comments
COMMENT ON FUNCTION public.set_reconciliation_job_expiry() IS 'Trigger function with secure search_path for job status updates';
COMMENT ON FUNCTION public.cleanup_expired_reconciliation_jobs() IS 'Function with secure search_path for cleaning expired jobs';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Part 1: Function security fixes completed successfully';
END $$; 