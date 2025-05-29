-- =============================================
-- Configure Storage Quota Enforcement (100MB per user)
-- Migration: 20250529115000_configure_storage_quota_enforcement.sql
-- =============================================

-- =============================================
-- Enhanced Storage Quota Functions
-- =============================================

-- Function to get current storage usage for a user across all buckets
CREATE OR REPLACE FUNCTION public.get_user_storage_usage_bytes(user_uuid uuid DEFAULT auth.uid())
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_usage bigint;
BEGIN
    -- Return 0 if no user provided
    IF user_uuid IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Calculate total storage usage across all buckets for the user
    SELECT COALESCE(SUM(
        CASE 
            WHEN objects.metadata ? 'size' THEN 
                (objects.metadata->>'size')::bigint
            ELSE 0
        END
    ), 0)
    FROM storage.objects
    WHERE owner = user_uuid
    INTO current_usage;
    
    RETURN current_usage;
END;
$$;

-- Replace existing function with enhanced functionality while maintaining signature compatibility
CREATE OR REPLACE FUNCTION public.check_storage_quota_before_upload(
    bucket_name text, 
    file_size bigint DEFAULT 0
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_usage bigint;
    quota_limit bigint := 104857600; -- 100MB in bytes (100 * 1024 * 1024)
    user_uuid uuid;
BEGIN
    -- Get authenticated user
    user_uuid := auth.uid();
    
    -- Return false if user is not provided
    IF user_uuid IS NULL THEN
        RETURN false;
    END IF;
    
    -- Get current storage usage for user
    current_usage := public.get_user_storage_usage_bytes(user_uuid);
    
    -- Check if adding this file would exceed quota
    RETURN (current_usage + file_size) <= quota_limit;
END;
$$;

-- New enhanced function that provides detailed quota checking with user parameter
CREATE OR REPLACE FUNCTION public.check_storage_quota_before_upload_detailed(
    bucket_name text, 
    file_size bigint DEFAULT 0,
    user_uuid uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_usage bigint;
    quota_limit bigint := 104857600; -- 100MB in bytes (100 * 1024 * 1024)
BEGIN
    -- Return false if user is not provided
    IF user_uuid IS NULL THEN
        RETURN false;
    END IF;
    
    -- Get current storage usage for user
    current_usage := public.get_user_storage_usage_bytes(user_uuid);
    
    -- Check if adding this file would exceed quota
    RETURN (current_usage + file_size) <= quota_limit;
END;
$$;

-- Function to get user storage quota information
CREATE OR REPLACE FUNCTION public.get_user_storage_quota_info(user_uuid uuid DEFAULT auth.uid())
RETURNS TABLE(
    user_id uuid,
    current_usage_bytes bigint,
    current_usage_mb numeric,
    quota_limit_bytes bigint,
    quota_limit_mb numeric,
    available_bytes bigint,
    available_mb numeric,
    usage_percentage numeric,
    can_upload boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    usage_bytes bigint;
    limit_bytes bigint := 104857600; -- 100MB
BEGIN
    -- Return empty if no user
    IF user_uuid IS NULL THEN
        RETURN;
    END IF;
    
    -- Get current usage
    usage_bytes := public.get_user_storage_usage_bytes(user_uuid);
    
    RETURN QUERY SELECT
        user_uuid as user_id,
        usage_bytes as current_usage_bytes,
        ROUND(usage_bytes / 1024.0 / 1024.0, 2) as current_usage_mb,
        limit_bytes as quota_limit_bytes,
        ROUND(limit_bytes / 1024.0 / 1024.0, 2) as quota_limit_mb,
        GREATEST(limit_bytes - usage_bytes, 0) as available_bytes,
        ROUND(GREATEST(limit_bytes - usage_bytes, 0) / 1024.0 / 1024.0, 2) as available_mb,
        ROUND((usage_bytes::numeric / limit_bytes::numeric) * 100, 2) as usage_percentage,
        (usage_bytes < limit_bytes) as can_upload;
END;
$$;

-- Function to validate file upload against quota
CREATE OR REPLACE FUNCTION public.validate_file_upload_quota(
    bucket_name text,
    object_name text,
    file_size bigint,
    user_uuid uuid DEFAULT auth.uid()
)
RETURNS TABLE(
    can_upload boolean,
    reason text,
    current_usage_mb numeric,
    available_mb numeric,
    file_size_mb numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    usage_bytes bigint;
    limit_bytes bigint := 104857600; -- 100MB
    quota_info record;
BEGIN
    -- Check if user is authenticated
    IF user_uuid IS NULL THEN
        RETURN QUERY SELECT 
            false as can_upload,
            'User not authenticated' as reason,
            0::numeric as current_usage_mb,
            0::numeric as available_mb,
            ROUND(file_size / 1024.0 / 1024.0, 2) as file_size_mb;
        RETURN;
    END IF;
    
    -- Get quota information
    SELECT * FROM public.get_user_storage_quota_info(user_uuid) INTO quota_info;
    
    -- Check if file would exceed quota
    IF (quota_info.current_usage_bytes + file_size) > limit_bytes THEN
        RETURN QUERY SELECT 
            false as can_upload,
            'Upload would exceed storage quota of 100MB' as reason,
            quota_info.current_usage_mb,
            quota_info.available_mb,
            ROUND(file_size / 1024.0 / 1024.0, 2) as file_size_mb;
        RETURN;
    END IF;
    
    -- Check individual file size (25MB limit)
    IF file_size > 26214400 THEN -- 25MB in bytes
        RETURN QUERY SELECT 
            false as can_upload,
            'File size exceeds 25MB limit' as reason,
            quota_info.current_usage_mb,
            quota_info.available_mb,
            ROUND(file_size / 1024.0 / 1024.0, 2) as file_size_mb;
        RETURN;
    END IF;
    
    -- Upload is allowed
    RETURN QUERY SELECT 
        true as can_upload,
        'Upload allowed' as reason,
        quota_info.current_usage_mb,
        quota_info.available_mb,
        ROUND(file_size / 1024.0 / 1024.0, 2) as file_size_mb;
END;
$$;

-- =============================================
-- Storage Quota Trigger Function
-- =============================================

-- Function to enforce quota on storage operations
CREATE OR REPLACE FUNCTION public.enforce_storage_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    file_size bigint;
    user_uuid uuid;
    quota_check record;
BEGIN
    -- Extract file size and user from the operation
    IF TG_OP = 'INSERT' THEN
        file_size := COALESCE((NEW.metadata->>'size')::bigint, 0);
        user_uuid := NEW.owner;
        
        -- Validate upload against quota
        SELECT * FROM public.validate_file_upload_quota(
            NEW.bucket_id,
            NEW.name,
            file_size,
            user_uuid
        ) INTO quota_check;
        
        -- Block upload if quota would be exceeded
        IF NOT quota_check.can_upload THEN
            RAISE EXCEPTION 'Storage quota exceeded: %', quota_check.reason
            USING HINT = format('Current usage: %sMB, Available: %sMB, File size: %sMB', 
                               quota_check.current_usage_mb, 
                               quota_check.available_mb, 
                               quota_check.file_size_mb);
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$;

-- =============================================
-- Helper Functions for Application Use
-- =============================================

-- Function to clean up expired temporary files
CREATE OR REPLACE FUNCTION public.cleanup_expired_temp_files(
    hours_old integer DEFAULT 24,
    bucket_name text DEFAULT 'invoice-reconciler'
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count integer := 0;
BEGIN
    -- Delete temporary files older than specified hours
    WITH deleted_files AS (
        DELETE FROM storage.objects
        WHERE bucket_id = bucket_name
        AND name LIKE '%/temp/%'
        AND created_at < (now() - (hours_old || ' hours')::interval)
        RETURNING id
    )
    SELECT count(*) INTO deleted_count FROM deleted_files;
    
    RETURN deleted_count;
END;
$$;

-- Function to get storage usage by bucket for a user
CREATE OR REPLACE FUNCTION public.get_user_storage_by_bucket(user_uuid uuid DEFAULT auth.uid())
RETURNS TABLE(
    bucket_id text,
    file_count bigint,
    total_size_bytes bigint,
    total_size_mb numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Return empty if no user
    IF user_uuid IS NULL THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        objects.bucket_id,
        count(*) as file_count,
        COALESCE(SUM(
            CASE 
                WHEN objects.metadata ? 'size' THEN 
                    (objects.metadata->>'size')::bigint
                ELSE 0
            END
        ), 0) as total_size_bytes,
        ROUND(COALESCE(SUM(
            CASE 
                WHEN objects.metadata ? 'size' THEN 
                    (objects.metadata->>'size')::bigint
                ELSE 0
            END
        ), 0) / 1024.0 / 1024.0, 2) as total_size_mb
    FROM storage.objects
    WHERE owner = user_uuid
    GROUP BY objects.bucket_id
    ORDER BY total_size_bytes DESC;
END;
$$;

-- =============================================
-- Grant Permissions
-- =============================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_user_storage_usage_bytes TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.check_storage_quota_before_upload TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.check_storage_quota_before_upload_detailed TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_storage_quota_info TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.validate_file_upload_quota TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_temp_files TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_storage_by_bucket TO authenticated, anon;

-- =============================================
-- Function Documentation
-- =============================================

COMMENT ON FUNCTION public.get_user_storage_usage_bytes IS 'Returns total storage usage in bytes for a user across all buckets';
COMMENT ON FUNCTION public.check_storage_quota_before_upload IS 'Checks if a file upload would exceed the 100MB user quota (maintains compatibility with existing policies)';
COMMENT ON FUNCTION public.check_storage_quota_before_upload_detailed IS 'Enhanced quota checking with user parameter for application use';
COMMENT ON FUNCTION public.get_user_storage_quota_info IS 'Returns comprehensive quota information for a user';
COMMENT ON FUNCTION public.validate_file_upload_quota IS 'Validates file upload against quota and size limits with detailed feedback';
COMMENT ON FUNCTION public.cleanup_expired_temp_files IS 'Cleans up temporary files older than specified hours';
COMMENT ON FUNCTION public.get_user_storage_by_bucket IS 'Returns storage usage breakdown by bucket for a user';

-- =============================================
-- Configuration Summary
-- =============================================

SELECT 
    'Storage Quota Configuration' as component,
    'CONFIGURED' as status,
    '100MB per user quota enforced via storage policies and enhanced functions' as quota_enforcement,
    '25MB individual file size limit' as file_size_limit,
    'Automatic cleanup of temporary files' as cleanup_feature,
    'Comprehensive quota validation functions' as validation_features; 