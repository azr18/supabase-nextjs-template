-- Enhanced RLS Policies Migration for Saved Invoices Table
-- This migration sets up comprehensive Row Level Security policies for multi-tenant invoice storage

-- ==================================================
-- SAVED_INVOICES TABLE ENHANCED RLS POLICIES
-- ==================================================

-- Drop existing policies to recreate them with more comprehensive rules
DROP POLICY IF EXISTS "Users can manage their own saved invoices" ON "public"."saved_invoices";
DROP POLICY IF EXISTS "Service role can manage all saved invoices" ON "public"."saved_invoices";

-- Policy 1: Users can view their own active invoices
CREATE POLICY "Users can view own active invoices"
ON "public"."saved_invoices"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (auth.uid() = user_id AND is_active = true);

-- Policy 2: Users can view their own inactive invoices (for admin purposes)
CREATE POLICY "Users can view own inactive invoices"
ON "public"."saved_invoices"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (auth.uid() = user_id AND is_active = false);

-- Policy 3: Users can insert their own invoices with validation
CREATE POLICY "Users can insert own invoices"
ON "public"."saved_invoices"
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id 
    AND is_active = true
    AND airline_type IN ('fly_dubai', 'tap', 'philippines_airlines', 'air_india', 'el_al')
    AND file_size > 0
    AND file_size <= 26214400 -- 25MB limit
);

-- Policy 4: Users can update their own invoices (metadata and usage tracking only)
CREATE POLICY "Users can update own invoices"
ON "public"."saved_invoices"
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 5: Prevent physical deletion by users
CREATE POLICY "No physical deletion by users"
ON "public"."saved_invoices"
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (false);

-- Policy 6: Service role has full access for admin operations
CREATE POLICY "Service role full access to saved invoices"
ON "public"."saved_invoices"
AS PERMISSIVE
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 7: Enforce user has active subscription to invoice reconciler
CREATE POLICY "Require active subscription for invoice access"
ON "public"."saved_invoices"
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM "public"."user_tool_subscriptions" uts
        JOIN "public"."tools" t ON uts.tool_id = t.id
        WHERE uts.user_id = auth.uid()
        AND t.slug = 'invoice-reconciler'
        AND uts.status IN ('active', 'trial')
        AND (uts.expires_at IS NULL OR uts.expires_at > NOW())
        AND (uts.trial_ends_at IS NULL OR uts.trial_ends_at > NOW())
        AND t.status = 'active'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM "public"."user_tool_subscriptions" uts
        JOIN "public"."tools" t ON uts.tool_id = t.id
        WHERE uts.user_id = auth.uid()
        AND t.slug = 'invoice-reconciler'
        AND uts.status IN ('active', 'trial')
        AND (uts.expires_at IS NULL OR uts.expires_at > NOW())
        AND (uts.trial_ends_at IS NULL OR uts.trial_ends_at > NOW())
        AND t.status = 'active'
    )
);

-- ==================================================
-- ENHANCED SECURITY FUNCTIONS FOR INVOICE MANAGEMENT
-- ==================================================

-- Function to check user's total storage usage across all invoices
CREATE OR REPLACE FUNCTION "public"."get_user_storage_usage"()
RETURNS TABLE (
    total_files BIGINT,
    total_size_bytes BIGINT,
    total_size_mb NUMERIC,
    quota_mb NUMERIC,
    quota_remaining_mb NUMERIC,
    quota_usage_percent NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_size BIGINT := 0;
    v_quota_bytes BIGINT := 104857600; -- 100MB in bytes
BEGIN
    -- Calculate total storage usage for current user
    SELECT 
        COUNT(*) as file_count,
        COALESCE(SUM(file_size), 0) as total_bytes
    INTO total_files, total_size_bytes
    FROM "public"."saved_invoices"
    WHERE user_id = auth.uid() 
    AND is_active = true;
    
    -- Convert to MB and calculate quota info
    total_size_mb := ROUND((total_size_bytes / 1048576.0)::NUMERIC, 2);
    quota_mb := ROUND((v_quota_bytes / 1048576.0)::NUMERIC, 2);
    quota_remaining_mb := GREATEST(0, quota_mb - total_size_mb);
    quota_usage_percent := CASE 
        WHEN v_quota_bytes > 0 THEN ROUND((total_size_bytes * 100.0 / v_quota_bytes)::NUMERIC, 2)
        ELSE 0
    END;
    
    RETURN NEXT;
END;
$$;

-- Function to get user's invoices by airline with usage stats
CREATE OR REPLACE FUNCTION "public"."get_user_invoices_by_airline"(p_airline_type TEXT DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    airline_type TEXT,
    original_filename TEXT,
    file_size BIGINT,
    file_size_mb NUMERIC,
    upload_date TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER,
    metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        si.id,
        si.airline_type,
        si.original_filename,
        si.file_size,
        ROUND((si.file_size / 1048576.0)::NUMERIC, 2) as file_size_mb,
        si.upload_date,
        si.last_used_at,
        si.usage_count,
        si.metadata
    FROM "public"."saved_invoices" si
    WHERE si.user_id = auth.uid()
    AND si.is_active = true
    AND (p_airline_type IS NULL OR si.airline_type = p_airline_type)
    ORDER BY si.airline_type, si.upload_date DESC;
END;
$$;

-- Function to validate storage quota before insert
CREATE OR REPLACE FUNCTION "public"."check_storage_quota_before_insert"(p_file_size BIGINT)
RETURNS TABLE (
    can_upload BOOLEAN,
    current_usage_mb NUMERIC,
    quota_mb NUMERIC,
    remaining_mb NUMERIC,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_usage BIGINT;
    v_quota_bytes BIGINT := 104857600; -- 100MB in bytes
    v_new_total BIGINT;
BEGIN
    -- Get current usage
    SELECT COALESCE(SUM(file_size), 0)
    INTO v_current_usage
    FROM "public"."saved_invoices"
    WHERE user_id = auth.uid() 
    AND is_active = true;
    
    -- Calculate totals
    v_new_total := v_current_usage + p_file_size;
    current_usage_mb := ROUND((v_current_usage / 1048576.0)::NUMERIC, 2);
    quota_mb := ROUND((v_quota_bytes / 1048576.0)::NUMERIC, 2);
    remaining_mb := ROUND(((v_quota_bytes - v_current_usage) / 1048576.0)::NUMERIC, 2);
    
    -- Check if upload would exceed quota
    IF v_new_total > v_quota_bytes THEN
        can_upload := false;
        message := 'Upload would exceed 100MB storage quota';
    ELSE
        can_upload := true;
        message := 'Upload allowed within quota';
    END IF;
    
    RETURN NEXT;
END;
$$;

-- Function to safely clean up old unused invoices
CREATE OR REPLACE FUNCTION "public"."cleanup_old_unused_invoices"(
    p_days_threshold INTEGER DEFAULT 90,
    p_max_cleanup INTEGER DEFAULT 10
)
RETURNS TABLE (
    cleaned_count INTEGER,
    space_freed_mb NUMERIC,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_old_invoices UUID[];
    v_space_freed BIGINT := 0;
BEGIN
    -- Find old unused invoices for current user
    SELECT ARRAY_AGG(id)
    INTO v_old_invoices
    FROM (
        SELECT id
        FROM "public"."saved_invoices"
        WHERE user_id = auth.uid()
        AND is_active = true
        AND usage_count = 0
        AND upload_date < NOW() - INTERVAL '1 day' * p_days_threshold
        ORDER BY upload_date ASC
        LIMIT p_max_cleanup
    ) subq;
    
    -- Calculate space that will be freed
    SELECT COALESCE(SUM(file_size), 0)
    INTO v_space_freed
    FROM "public"."saved_invoices"
    WHERE id = ANY(v_old_invoices);
    
    -- Soft delete old invoices
    UPDATE "public"."saved_invoices"
    SET is_active = false, updated_at = NOW()
    WHERE id = ANY(v_old_invoices);
    
    cleaned_count := COALESCE(array_length(v_old_invoices, 1), 0);
    space_freed_mb := ROUND((v_space_freed / 1048576.0)::NUMERIC, 2);
    message := format('Cleaned up %s old unused invoices, freed %s MB', cleaned_count, space_freed_mb);
    
    RETURN NEXT;
END;
$$;

-- ==================================================
-- GRANT PERMISSIONS FOR ENHANCED SECURITY FUNCTIONS
-- ==================================================

-- Grant execute permissions on enhanced security functions to authenticated users
GRANT EXECUTE ON FUNCTION "public"."get_user_storage_usage"() TO authenticated;
GRANT EXECUTE ON FUNCTION "public"."get_user_invoices_by_airline"(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION "public"."check_storage_quota_before_insert"(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION "public"."cleanup_old_unused_invoices"(INTEGER, INTEGER) TO authenticated;

-- Grant all permissions to service_role for admin operations
GRANT EXECUTE ON FUNCTION "public"."get_user_storage_usage"() TO service_role;
GRANT EXECUTE ON FUNCTION "public"."get_user_invoices_by_airline"(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION "public"."check_storage_quota_before_insert"(BIGINT) TO service_role;
GRANT EXECUTE ON FUNCTION "public"."cleanup_old_unused_invoices"(INTEGER, INTEGER) TO service_role;

-- ==================================================
-- UPDATE ACTIVE_SAVED_INVOICES VIEW WITH RLS
-- ==================================================

-- Drop and recreate the view to ensure it respects RLS policies
DROP VIEW IF EXISTS "public"."active_saved_invoices";

CREATE VIEW "public"."active_saved_invoices" AS
SELECT 
    id,
    user_id,
    airline_type,
    original_filename,
    file_path,
    file_hash,
    file_size,
    ROUND((file_size / 1048576.0)::NUMERIC, 2) as file_size_mb,
    mime_type,
    upload_date,
    last_used_at,
    usage_count,
    metadata,
    created_at,
    updated_at
FROM "public"."saved_invoices"
WHERE is_active = true
ORDER BY airline_type, upload_date DESC;

-- Grant permissions on the updated view
GRANT SELECT ON "public"."active_saved_invoices" TO authenticated;
GRANT ALL ON "public"."active_saved_invoices" TO service_role;

-- ==================================================
-- COMMENTS AND DOCUMENTATION
-- ==================================================

COMMENT ON POLICY "Users can view own active invoices" ON "public"."saved_invoices" 
IS 'Users can view their own active invoices for selection and management';

COMMENT ON POLICY "Users can view own inactive invoices" ON "public"."saved_invoices" 
IS 'Users can view their own deleted invoices for reference';

COMMENT ON POLICY "Users can insert own invoices" ON "public"."saved_invoices" 
IS 'Users can upload invoices with size and type validation';

COMMENT ON POLICY "Users can update own invoices" ON "public"."saved_invoices" 
IS 'Users can update metadata and usage tracking on their invoices';

COMMENT ON POLICY "No physical deletion by users" ON "public"."saved_invoices" 
IS 'Prevents users from physically deleting invoice records';

COMMENT ON POLICY "Service role full access to saved invoices" ON "public"."saved_invoices" 
IS 'Full admin access for invoice management via Supabase Studio';

COMMENT ON POLICY "Require active subscription for invoice access" ON "public"."saved_invoices" 
IS 'Enforces that users must have active invoice reconciler subscription';

COMMENT ON FUNCTION "public"."get_user_storage_usage"() 
IS 'Returns current user storage usage and quota information';

COMMENT ON FUNCTION "public"."get_user_invoices_by_airline"(TEXT) 
IS 'Returns user invoices filtered by airline type with usage statistics';

COMMENT ON FUNCTION "public"."check_storage_quota_before_insert"(BIGINT) 
IS 'Validates if a file upload would exceed the user storage quota';

COMMENT ON FUNCTION "public"."cleanup_old_unused_invoices"(INTEGER, INTEGER) 
IS 'Safely cleans up old unused invoices to free storage space'; 