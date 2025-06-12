-- Part 4: Fix Remaining Policy Issues
-- This migration consolidates remaining multiple permissive policies

-- Fix tools policies (consolidate multiple permissive policies)
DROP POLICY IF EXISTS "Admin full access to tools" ON "public"."tools";
DROP POLICY IF EXISTS "Admin manage tools" ON "public"."tools";
DROP POLICY IF EXISTS "Admin view all tools" ON "public"."tools";
DROP POLICY IF EXISTS "Anyone can view active tools" ON "public"."tools";
DROP POLICY IF EXISTS "Authenticated users can view all tools" ON "public"."tools";
DROP POLICY IF EXISTS "Public can view active tools" ON "public"."tools";

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

-- Add policy comments
COMMENT ON POLICY "Optimized authenticated tools access" ON "public"."tools" IS 'Consolidated policy for authenticated user tool access';
COMMENT ON POLICY "Consolidated select own invoices" ON "public"."saved_invoices" IS 'Optimized policy for user invoice access';
COMMENT ON POLICY "Optimized admin leads access" ON "public"."leads" IS 'Consolidated admin access policy for leads management';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Part 4: Remaining policy consolidation completed successfully';
    RAISE NOTICE 'All security and performance optimizations completed!';
    RAISE NOTICE 'Manual action required: Enable leaked password protection in Supabase Auth settings';
END $$; 