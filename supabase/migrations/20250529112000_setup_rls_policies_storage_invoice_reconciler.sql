-- Migration: Setup RLS policies for invoice-reconciler storage bucket
-- Description: Configure storage bucket RLS policies for user isolation, quota enforcement, and subscription-based access control
-- Created: 2025-05-29

-- Create storage access control functions
CREATE OR REPLACE FUNCTION public.check_user_owns_storage_object(object_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Extract user_id from object path (expected format: user_id/...)
    -- Object name should start with authenticated user's ID
    RETURN object_name LIKE (auth.uid()::text || '/%') OR object_name = auth.uid()::text;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_user_has_tool_access_for_storage(bucket_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    tool_name text;
    user_has_access boolean := false;
BEGIN
    -- Return false if user is not authenticated
    IF auth.uid() IS NULL THEN
        RETURN false;
    END IF;
    
    -- Map bucket names to tool names
    tool_name := CASE 
        WHEN bucket_name = 'invoice-reconciler' THEN 'invoice-reconciler'
        ELSE bucket_name
    END;
    
    -- Check if user has active subscription for the tool
    SELECT EXISTS(
        SELECT 1 FROM user_tool_subscriptions uts
        JOIN tools t ON uts.tool_id = t.id
        WHERE uts.user_id = auth.uid()
        AND t.name = tool_name
        AND uts.status = 'active'
    ) INTO user_has_access;
    
    RETURN user_has_access;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_storage_quota_before_upload(bucket_name text, file_size bigint DEFAULT 0)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_usage bigint;
    quota_limit bigint := 104857600; -- 100MB in bytes
    user_uuid uuid;
BEGIN
    -- Get authenticated user
    user_uuid := auth.uid();
    
    -- Return false if user is not authenticated
    IF user_uuid IS NULL THEN
        RETURN false;
    END IF;
    
    -- Get current storage usage for user
    SELECT COALESCE(SUM(
        (objects.metadata->>'size')::bigint
    ), 0)
    FROM storage.objects
    WHERE bucket_id = bucket_name
    AND owner = user_uuid
    INTO current_usage;
    
    -- Check if adding this file would exceed quota
    RETURN (current_usage + file_size) <= quota_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_invoice_reconciler_file_path(object_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    path_parts text[];
    user_uuid text;
BEGIN
    -- Split path by '/'
    path_parts := string_to_array(object_name, '/');
    
    -- Path should have at least 2 parts: user_id/filename or user_id/subfolder/filename
    IF array_length(path_parts, 1) < 2 THEN
        RETURN false;
    END IF;
    
    -- First part should be the user's ID
    user_uuid := auth.uid()::text;
    IF path_parts[1] != user_uuid THEN
        RETURN false;
    END IF;
    
    -- Validate path structure based on content type
    -- For invoice-reconciler N8N approach: user_id/jobs/job_id/filename
    --                                   or user_id/reports/job_id/filename  
    IF array_length(path_parts, 1) >= 3 THEN
        -- Check for valid second-level directories (no saved_invoices for N8N approach)
        IF path_parts[2] NOT IN ('jobs', 'reports') THEN
            RETURN false;
        END IF;
    END IF;
    
    RETURN true;
END;
$$;

-- Grant necessary permissions on functions
GRANT EXECUTE ON FUNCTION public.check_user_owns_storage_object TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.check_user_has_tool_access_for_storage TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.check_storage_quota_before_upload TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.validate_invoice_reconciler_file_path TO authenticated, anon;

-- Add helpful comments
COMMENT ON FUNCTION public.check_user_owns_storage_object IS 'Validates that a storage object path belongs to the authenticated user';
COMMENT ON FUNCTION public.check_user_has_tool_access_for_storage IS 'Checks if user has active subscription for tool associated with storage bucket';
COMMENT ON FUNCTION public.check_storage_quota_before_upload IS 'Validates that uploading a file will not exceed user storage quota (100MB)';
COMMENT ON FUNCTION public.validate_invoice_reconciler_file_path IS 'Validates file path structure for invoice-reconciler bucket';

-- Enable RLS on storage.objects and storage.buckets (if not already enabled)
-- Note: RLS is typically already enabled on these tables in Supabase

-- Now we need to use Supabase's storage policies API
-- The RLS policies will be configured through the Supabase dashboard or through the storage API 