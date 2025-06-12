-- Part 3: Fix Index and Constraint Issues
-- This migration handles duplicate indexes and missing foreign key indexes

-- Fix duplicate indexes/constraints
-- airline_types_code_key constraint is referenced by foreign keys, so we'll keep both constraints
-- The duplicate index warning is acceptable since both are actively used
-- ALTER TABLE "public"."airline_types" DROP CONSTRAINT IF EXISTS "airline_types_code_key"; -- SKIP: Referenced by FKs

-- tools_slug_key is an index constraint - drop it and keep the explicit index
ALTER TABLE "public"."tools" DROP CONSTRAINT IF EXISTS "tools_slug_key";
-- Keep tools_slug_idx

-- Add missing indexes for foreign keys
CREATE INDEX IF NOT EXISTS "reconciliation_jobs_invoice_file_id_idx" 
ON "public"."reconciliation_jobs" USING btree (invoice_file_id);

CREATE INDEX IF NOT EXISTS "reconciliation_jobs_report_file_id_idx" 
ON "public"."reconciliation_jobs" USING btree (report_file_id);

-- Remove unused indexes (only remove clearly unused ones, keep functional ones)
-- Note: Keeping indexes that will be used by the N8N functionality

-- Remove clearly unused indexes from saved_invoices (this table will be removed in N8N approach)
DROP INDEX IF EXISTS "public"."saved_invoices_user_id_idx";
DROP INDEX IF EXISTS "public"."saved_invoices_file_hash_idx";
DROP INDEX IF EXISTS "public"."saved_invoices_upload_date_idx";
DROP INDEX IF EXISTS "public"."saved_invoices_last_used_at_idx";
DROP INDEX IF EXISTS "public"."saved_invoices_is_active_idx";

-- Remove some unused reconciliation_jobs indexes (keep essential ones for N8N)
DROP INDEX IF EXISTS "public"."reconciliation_jobs_user_status_created_idx";

-- Remove unused leads indexes (basic functionality doesn't need all of them)
DROP INDEX IF EXISTS "public"."idx_leads_status";
DROP INDEX IF EXISTS "public"."idx_leads_email";

-- Remove some unused airline_types indexes
DROP INDEX IF EXISTS "public"."airline_types_country_idx";

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Part 3: Index and constraint optimization completed successfully';
END $$; 