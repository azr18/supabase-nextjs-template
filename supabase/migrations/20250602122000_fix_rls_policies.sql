-- Part 2: Fix RLS Policy Performance Issues
-- This migration optimizes RLS policies for better performance

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

-- Fix user_tool_subscriptions multiple policies
DROP POLICY IF EXISTS "Subscriptions visibility rules" ON "public"."user_tool_subscriptions";

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Part 2: RLS policy performance optimization completed successfully';
END $$; 