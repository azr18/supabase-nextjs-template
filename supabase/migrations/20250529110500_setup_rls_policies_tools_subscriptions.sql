-- RLS Policies Migration for Tools and User Tool Subscriptions Tables
-- This migration sets up comprehensive Row Level Security policies for multi-tenant SaaS platform

-- ==================================================
-- TOOLS TABLE RLS POLICIES
-- ==================================================

-- Drop existing policies to recreate them with more comprehensive rules
DROP POLICY IF EXISTS "Anyone can view active tools" ON "public"."tools";
DROP POLICY IF EXISTS "Only service_role can manage tools" ON "public"."tools";

-- Policy 1: Public and authenticated users can view active tools
-- This allows the landing page and dashboard to show available tools
CREATE POLICY "Public can view active tools"
ON "public"."tools"
AS PERMISSIVE
FOR SELECT
TO PUBLIC
USING (status = 'active');

-- Policy 2: Authenticated users can view all tools (including coming_soon for dashboard)
-- This allows logged-in users to see tools that might be in development
CREATE POLICY "Authenticated users can view all tools"
ON "public"."tools"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (status IN ('active', 'coming_soon', 'maintenance'));

-- Policy 3: Service role has full access for admin operations
CREATE POLICY "Service role full access to tools"
ON "public"."tools"
AS PERMISSIVE
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 4: No direct insert for regular users
CREATE POLICY "No direct tool insert for users"
ON "public"."tools"
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Policy 5: No direct update for regular users
CREATE POLICY "No direct tool update for users"
ON "public"."tools"
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

-- Policy 6: No direct delete for regular users
CREATE POLICY "No direct tool delete for users"
ON "public"."tools"
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (false);

-- ==================================================
-- USER_TOOL_SUBSCRIPTIONS TABLE RLS POLICIES
-- ==================================================

-- Drop existing policies to recreate them with more comprehensive rules
DROP POLICY IF EXISTS "Users can view their own tool subscriptions" ON "public"."user_tool_subscriptions";
DROP POLICY IF EXISTS "Only service_role can manage tool subscriptions" ON "public"."user_tool_subscriptions";

-- Policy 1: Users can only view their own subscriptions
CREATE POLICY "Users view own subscriptions only"
ON "public"."user_tool_subscriptions"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: Service role has full access for admin operations
CREATE POLICY "Service role full access to subscriptions"
ON "public"."user_tool_subscriptions"
AS PERMISSIVE
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 3: No direct insert for regular users
CREATE POLICY "No direct subscription insert for users"
ON "public"."user_tool_subscriptions"
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Policy 4: No direct update for regular users
CREATE POLICY "No direct subscription update for users"
ON "public"."user_tool_subscriptions"
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

-- Policy 5: No direct delete for regular users
CREATE POLICY "No direct subscription delete for users"
ON "public"."user_tool_subscriptions"
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (false);

-- Policy 6: Ensure users can only access subscriptions for active tools
-- This adds an extra layer of security by checking tool status
CREATE POLICY "Subscriptions only for active tools"
ON "public"."user_tool_subscriptions"
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM "public"."tools" t 
        WHERE t.id = tool_id 
        AND t.status = 'active'
    )
);

-- ==================================================
-- SECURITY FUNCTIONS FOR SUBSCRIPTION VALIDATION
-- ==================================================

-- Function to check if user has active subscription to a specific tool
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
        WHERE uts.user_id = auth.uid()
        AND t.slug = tool_slug
        AND uts.status IN ('active', 'trial')
        AND (uts.expires_at IS NULL OR uts.expires_at > NOW())
        AND (uts.trial_ends_at IS NULL OR uts.trial_ends_at > NOW())
    ) INTO has_subscription;
    
    RETURN COALESCE(has_subscription, FALSE);
END;
$$;

-- Function to get user's active tool subscriptions
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
    WHERE uts.user_id = auth.uid()
    AND uts.status IN ('active', 'trial')
    AND (uts.expires_at IS NULL OR uts.expires_at > NOW())
    AND (uts.trial_ends_at IS NULL OR uts.trial_ends_at > NOW())
    AND t.status = 'active'
    ORDER BY t.order_index;
END;
$$;

-- Function to check if user has any active subscriptions
CREATE OR REPLACE FUNCTION "public"."user_has_any_active_subscription"()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    has_any_subscription BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM "public"."user_tool_subscriptions" uts
        JOIN "public"."tools" t ON uts.tool_id = t.id
        WHERE uts.user_id = auth.uid()
        AND uts.status IN ('active', 'trial')
        AND (uts.expires_at IS NULL OR uts.expires_at > NOW())
        AND (uts.trial_ends_at IS NULL OR uts.trial_ends_at > NOW())
        AND t.status = 'active'
    ) INTO has_any_subscription;
    
    RETURN COALESCE(has_any_subscription, FALSE);
END;
$$;

-- ==================================================
-- GRANT PERMISSIONS FOR SECURITY FUNCTIONS
-- ==================================================

-- Grant execute permissions on security functions to authenticated users
GRANT EXECUTE ON FUNCTION "public"."user_has_active_tool_subscription"(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION "public"."get_user_active_tools"() TO authenticated;
GRANT EXECUTE ON FUNCTION "public"."user_has_any_active_subscription"() TO authenticated;

-- Grant all permissions to service_role for admin operations
GRANT EXECUTE ON FUNCTION "public"."user_has_active_tool_subscription"(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION "public"."get_user_active_tools"() TO service_role;
GRANT EXECUTE ON FUNCTION "public"."user_has_any_active_subscription"() TO service_role;

-- ==================================================
-- COMMENTS AND DOCUMENTATION
-- ==================================================

COMMENT ON POLICY "Public can view active tools" ON "public"."tools" 
IS 'Allows public access to view active tools for landing page and marketing';

COMMENT ON POLICY "Authenticated users can view all tools" ON "public"."tools" 
IS 'Allows logged-in users to see all tools including those in development';

COMMENT ON POLICY "Service role full access to tools" ON "public"."tools" 
IS 'Full admin access for tool management via Supabase Studio';

COMMENT ON POLICY "No direct tool insert for users" ON "public"."tools" 
IS 'Prevents regular users from inserting tools directly';

COMMENT ON POLICY "No direct tool update for users" ON "public"."tools" 
IS 'Prevents regular users from updating tools directly';

COMMENT ON POLICY "No direct tool delete for users" ON "public"."tools" 
IS 'Prevents regular users from deleting tools directly';

COMMENT ON POLICY "Users view own subscriptions only" ON "public"."user_tool_subscriptions" 
IS 'Users can only see their own subscription records';

COMMENT ON POLICY "Service role full access to subscriptions" ON "public"."user_tool_subscriptions" 
IS 'Full admin access for subscription management via Supabase Studio';

COMMENT ON POLICY "No direct subscription insert for users" ON "public"."user_tool_subscriptions" 
IS 'Prevents users from inserting their own subscriptions';

COMMENT ON POLICY "No direct subscription update for users" ON "public"."user_tool_subscriptions" 
IS 'Prevents users from updating their own subscriptions';

COMMENT ON POLICY "No direct subscription delete for users" ON "public"."user_tool_subscriptions" 
IS 'Prevents users from deleting their own subscriptions';

COMMENT ON POLICY "Subscriptions only for active tools" ON "public"."user_tool_subscriptions" 
IS 'Ensures users can only access subscriptions for active tools';

COMMENT ON FUNCTION "public"."user_has_active_tool_subscription"(TEXT) 
IS 'Security function to check if current user has active subscription to specified tool';

COMMENT ON FUNCTION "public"."get_user_active_tools"() 
IS 'Security function to get all active tool subscriptions for current user';

COMMENT ON FUNCTION "public"."user_has_any_active_subscription"() 
IS 'Security function to check if current user has any active subscriptions'; 