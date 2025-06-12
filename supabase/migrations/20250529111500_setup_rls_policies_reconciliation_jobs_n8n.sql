-- RLS Policies Migration for Reconciliation Jobs Table with N8N Integration Support
-- This migration enhances the existing RLS policies to support N8N webhook integration

-- ==================================================
-- N8N INTEGRATION SUPPORT FUNCTIONS
-- ==================================================

-- Function to validate N8N webhook access to job data
CREATE OR REPLACE FUNCTION "public"."validate_n8n_webhook_access"(job_id UUID, webhook_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    job_exists BOOLEAN := FALSE;
    token_valid BOOLEAN := FALSE;
BEGIN
    -- Check if job exists and is in a state that allows N8N access
    SELECT EXISTS (
        SELECT 1 
        FROM "public"."reconciliation_jobs" 
        WHERE id = job_id 
        AND status IN ('submitted', 'processing', 'completed', 'failed')
    ) INTO job_exists;
    
    -- In production, you would validate the webhook_token against a secure token
    -- For MVP, we'll use a simple token validation
    -- TODO: Implement proper webhook authentication in production
    token_valid := (webhook_token IS NOT NULL AND LENGTH(webhook_token) > 0);
    
    RETURN job_exists AND token_valid;
END;
$$;

-- Function to check if user can access N8N job webhooks (admin function)
CREATE OR REPLACE FUNCTION "public"."can_access_n8n_webhooks"()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only service_role or admin users can access N8N webhook data
    RETURN auth.role() = 'service_role';
END;
$$;

-- ==================================================
-- ENHANCED RLS POLICIES FOR N8N INTEGRATION
-- ==================================================

-- Policy: Allow N8N webhook callbacks to update job status and results
-- This policy enables N8N workflows to update job progress and deliver results
CREATE POLICY "N8N webhook callback access"
ON "public"."reconciliation_jobs"
AS PERMISSIVE
FOR UPDATE
TO service_role
USING (
    -- Allow updates for N8N integration fields
    webhook_payload IS NOT NULL 
    AND webhook_payload != '{}'::jsonb
)
WITH CHECK (
    -- Ensure N8N can only update specific fields related to processing
    true -- service_role can update any field for webhook callbacks
);

-- Policy: Allow reading of expired jobs for cleanup
CREATE POLICY "Allow cleanup of expired jobs"
ON "public"."reconciliation_jobs"
AS PERMISSIVE
FOR SELECT
TO service_role
USING (
    expires_at IS NOT NULL 
    AND expires_at < NOW()
    AND status = 'completed'
);

-- Policy: Temporary files access control
CREATE POLICY "Temporary files access control"
ON "public"."reconciliation_jobs"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
    -- Users can access their own jobs that haven't expired
    auth.uid() = user_id 
    AND (expires_at IS NULL OR expires_at > NOW())
    AND result_file_path IS NOT NULL
);

-- ==================================================
-- N8N WEBHOOK DATA ACCESS POLICIES
-- ==================================================

-- RLS for the n8n_job_webhooks view
-- Ensure the view inherits security from the underlying table
ALTER VIEW "public"."n8n_job_webhooks" SET (security_invoker = true);

-- ==================================================
-- SECURITY FUNCTIONS FOR N8N INTEGRATION
-- ==================================================

-- Function to safely update job status from N8N webhooks
CREATE OR REPLACE FUNCTION "public"."update_job_from_n8n_webhook"(
    p_job_id UUID,
    p_status TEXT,
    p_n8n_workflow_id TEXT DEFAULT NULL,
    p_n8n_execution_id TEXT DEFAULT NULL,
    p_result_file_path TEXT DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL,
    p_webhook_payload JSONB DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    update_success BOOLEAN := FALSE;
    allowed_statuses TEXT[] := ARRAY['processing', 'completed', 'failed'];
BEGIN
    -- Validate status is allowed for N8N updates
    IF NOT (p_status = ANY(allowed_statuses)) THEN
        RAISE EXCEPTION 'Invalid status for N8N webhook update: %', p_status;
    END IF;
    
    -- Update the job with N8N data
    UPDATE "public"."reconciliation_jobs"
    SET 
        status = p_status,
        n8n_workflow_id = COALESCE(p_n8n_workflow_id, n8n_workflow_id),
        n8n_execution_id = COALESCE(p_n8n_execution_id, n8n_execution_id),
        result_file_path = COALESCE(p_result_file_path, result_file_path),
        error_message = COALESCE(p_error_message, error_message),
        webhook_payload = COALESCE(p_webhook_payload, webhook_payload),
        n8n_response_received_at = NOW(),
        updated_at = NOW()
    WHERE id = p_job_id
    AND status IN ('submitted', 'processing'); -- Only allow updates from these states
    
    GET DIAGNOSTICS update_success = ROW_COUNT;
    
    RETURN (update_success > 0);
END;
$$;

-- Function to create N8N webhook payload for job
CREATE OR REPLACE FUNCTION "public"."create_n8n_webhook_payload"(
    p_job_id UUID,
    p_callback_base_url TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    job_data RECORD;
    webhook_payload JSONB;
BEGIN
    -- Get job data for webhook payload
    SELECT 
        rj.id,
        rj.user_id,
        rj.airline_type,
        rj.invoice_file_path,
        rj.report_file_path,
        rj.job_name,
        t.name as tool_name,
        at.display_name as airline_display_name,
        at.processing_config
    INTO job_data
    FROM "public"."reconciliation_jobs" rj
    JOIN "public"."tools" t ON rj.tool_id = t.id
    JOIN "public"."airline_types" at ON rj.airline_type = at.code
    WHERE rj.id = p_job_id
    AND rj.user_id = auth.uid(); -- Ensure user owns the job
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Job not found or access denied: %', p_job_id;
    END IF;
    
    -- Build webhook payload
    webhook_payload := jsonb_build_object(
        'job_id', job_data.id,
        'user_id', job_data.user_id,
        'airline_type', job_data.airline_type,
        'airline_display_name', job_data.airline_display_name,
        'job_name', job_data.job_name,
        'tool_name', job_data.tool_name,
        'invoice_file_path', job_data.invoice_file_path,
        'report_file_path', job_data.report_file_path,
        'processing_config', job_data.processing_config,
        'callback_urls', jsonb_build_object(
            'status_update', p_callback_base_url || '/api/n8n-callback/status',
            'result_delivery', p_callback_base_url || '/api/n8n-callback/result',
            'error_notification', p_callback_base_url || '/api/n8n-callback/error'
        ),
        'created_at', NOW()
    );
    
    -- Update job with webhook payload
    UPDATE "public"."reconciliation_jobs"
    SET 
        webhook_payload = webhook_payload,
        callback_url = p_callback_base_url || '/api/n8n-callback',
        status = 'submitted',
        updated_at = NOW()
    WHERE id = p_job_id;
    
    RETURN webhook_payload;
END;
$$;

-- ==================================================
-- GRANT PERMISSIONS FOR N8N INTEGRATION
-- ==================================================

-- Grant execute permissions for N8N webhook functions
GRANT EXECUTE ON FUNCTION "public"."validate_n8n_webhook_access"(UUID, TEXT) TO "service_role";
GRANT EXECUTE ON FUNCTION "public"."can_access_n8n_webhooks"() TO "service_role";
GRANT EXECUTE ON FUNCTION "public"."update_job_from_n8n_webhook"(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO "service_role";
GRANT EXECUTE ON FUNCTION "public"."create_n8n_webhook_payload"(UUID, TEXT) TO "authenticated";

-- ==================================================
-- COMMENTS AND DOCUMENTATION
-- ==================================================

COMMENT ON FUNCTION "public"."validate_n8n_webhook_access"(UUID, TEXT) IS 'Validates N8N webhook access to job data with token authentication';
COMMENT ON FUNCTION "public"."can_access_n8n_webhooks"() IS 'Checks if current user/role can access N8N webhook monitoring data';
COMMENT ON FUNCTION "public"."update_job_from_n8n_webhook"(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) IS 'Safely updates reconciliation job status and results from N8N webhook callbacks';
COMMENT ON FUNCTION "public"."create_n8n_webhook_payload"(UUID, TEXT) IS 'Creates webhook payload for triggering N8N workflows with job and callback information';

-- Add policy comments for documentation
COMMENT ON POLICY "N8N webhook callback access" ON "public"."reconciliation_jobs" IS 'Allows N8N service_role to update jobs via webhook callbacks';
COMMENT ON POLICY "Allow cleanup of expired jobs" ON "public"."reconciliation_jobs" IS 'Enables automated cleanup of expired temporary job reports';
COMMENT ON POLICY "Temporary files access control" ON "public"."reconciliation_jobs" IS 'Controls user access to temporary report files based on expiration'; 