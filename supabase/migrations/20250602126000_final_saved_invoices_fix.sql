-- Final Fix: Consolidate saved_invoices SELECT policies
-- This resolves the last multiple permissive policies warning

-- Drop the two separate SELECT policies
DROP POLICY IF EXISTS "Consolidated select own invoices" ON "public"."saved_invoices";
DROP POLICY IF EXISTS "Require active subscription for invoice access" ON "public"."saved_invoices";

-- Create one unified SELECT policy that handles both user ownership and subscription validation
CREATE POLICY "Unified saved invoices access"
ON "public"."saved_invoices"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
    -- User must own the invoice AND have active subscription
    (SELECT auth.uid()) = user_id 
    AND EXISTS (
        SELECT 1 
        FROM "public"."user_tool_subscriptions" uts
        JOIN "public"."tools" t ON uts.tool_id = t.id
        WHERE uts.user_id = (SELECT auth.uid())
        AND t.slug = 'invoice-reconciler'
        AND uts.status IN ('active', 'trial')
        AND (uts.expires_at IS NULL OR uts.expires_at > NOW())
        AND (uts.trial_ends_at IS NULL OR uts.trial_ends_at > NOW())
    )
);

-- Add comment
COMMENT ON POLICY "Unified saved invoices access" ON "public"."saved_invoices" IS 'Consolidated user ownership and subscription validation with optimized auth functions';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Final saved_invoices policy consolidation completed!';
    RAISE NOTICE 'Only acceptable duplicate index warning should remain';
END $$; 