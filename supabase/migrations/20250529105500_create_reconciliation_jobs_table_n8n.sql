-- Modify reconciliation_jobs table for N8N integration
-- This migration adds N8N-specific fields to support external workflow processing

-- Add N8N integration fields to existing reconciliation_jobs table
ALTER TABLE "public"."reconciliation_jobs" 
ADD COLUMN IF NOT EXISTS "webhook_payload" JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "n8n_workflow_id" TEXT,
ADD COLUMN IF NOT EXISTS "n8n_execution_id" TEXT,
ADD COLUMN IF NOT EXISTS "callback_url" TEXT,
ADD COLUMN IF NOT EXISTS "webhook_triggered_at" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "n8n_response_received_at" TIMESTAMP WITH TIME ZONE;

-- Update status field constraint to include N8N-specific statuses
ALTER TABLE "public"."reconciliation_jobs" 
DROP CONSTRAINT IF EXISTS reconciliation_jobs_status_check;

ALTER TABLE "public"."reconciliation_jobs" 
ADD CONSTRAINT "reconciliation_jobs_status_check" 
CHECK (status IN ('uploading', 'submitted', 'processing', 'completed', 'failed', 'cancelled', 'expired'));

-- Create indexes for N8N integration fields
CREATE INDEX IF NOT EXISTS reconciliation_jobs_n8n_workflow_id_idx 
ON "public"."reconciliation_jobs" USING btree (n8n_workflow_id);

CREATE INDEX IF NOT EXISTS reconciliation_jobs_n8n_execution_id_idx 
ON "public"."reconciliation_jobs" USING btree (n8n_execution_id);

CREATE INDEX IF NOT EXISTS reconciliation_jobs_expires_at_idx 
ON "public"."reconciliation_jobs" USING btree (expires_at);

CREATE INDEX IF NOT EXISTS reconciliation_jobs_webhook_triggered_at_idx 
ON "public"."reconciliation_jobs" USING btree (webhook_triggered_at);

-- Add comments for N8N integration fields
COMMENT ON COLUMN "public"."reconciliation_jobs"."webhook_payload" IS 'JSON payload sent to N8N webhook containing job details and file paths';
COMMENT ON COLUMN "public"."reconciliation_jobs"."expires_at" IS 'When temporary files and reports expire (48 hours from completion)';
COMMENT ON COLUMN "public"."reconciliation_jobs"."n8n_workflow_id" IS 'ID of the N8N workflow processing this job';
COMMENT ON COLUMN "public"."reconciliation_jobs"."n8n_execution_id" IS 'ID of the specific N8N workflow execution for tracking';
COMMENT ON COLUMN "public"."reconciliation_jobs"."callback_url" IS 'URL for N8N to send status updates and results';
COMMENT ON COLUMN "public"."reconciliation_jobs"."webhook_triggered_at" IS 'When the N8N webhook was triggered';
COMMENT ON COLUMN "public"."reconciliation_jobs"."n8n_response_received_at" IS 'When the last response was received from N8N';

-- Create function to automatically set expires_at when job completes
CREATE OR REPLACE FUNCTION public.set_reconciliation_job_expiry()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger for automatic field updates
DROP TRIGGER IF EXISTS reconciliation_jobs_auto_fields ON "public"."reconciliation_jobs";
CREATE TRIGGER reconciliation_jobs_auto_fields
    BEFORE UPDATE ON "public"."reconciliation_jobs"
    FOR EACH ROW
    EXECUTE FUNCTION public.set_reconciliation_job_expiry();

-- Create view for N8N webhook data
CREATE OR REPLACE VIEW "public"."n8n_job_webhooks" AS
SELECT 
    id,
    user_id,
    airline_type,
    status,
    webhook_payload,
    n8n_workflow_id,
    n8n_execution_id,
    callback_url,
    webhook_triggered_at,
    n8n_response_received_at,
    invoice_file_path,
    report_file_path,
    result_file_path,
    expires_at,
    created_at
FROM "public"."reconciliation_jobs"
WHERE webhook_payload IS NOT NULL AND webhook_payload != '{}'
ORDER BY webhook_triggered_at DESC;

-- Grant permissions on the view
GRANT SELECT ON "public"."n8n_job_webhooks" TO "authenticated";
GRANT ALL ON "public"."n8n_job_webhooks" TO "service_role";

-- Create function to clean up expired jobs
CREATE OR REPLACE FUNCTION public.cleanup_expired_reconciliation_jobs()
RETURNS INTEGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission for cleanup function
GRANT EXECUTE ON FUNCTION public.cleanup_expired_reconciliation_jobs() TO "service_role";

-- Add constraint to ensure expires_at is reasonable (not more than 7 days in future)
ALTER TABLE "public"."reconciliation_jobs" 
ADD CONSTRAINT "reconciliation_jobs_expires_at_check" 
CHECK (expires_at IS NULL OR expires_at <= NOW() + INTERVAL '7 days');

COMMENT ON TABLE "public"."reconciliation_jobs" IS 'Tracks invoice reconciliation jobs with N8N workflow integration, status tracking, and temporary report management';
COMMENT ON VIEW "public"."n8n_job_webhooks" IS 'View of reconciliation jobs with N8N webhook integration data for monitoring and debugging';
COMMENT ON FUNCTION public.cleanup_expired_reconciliation_jobs() IS 'Function to mark completed reconciliation jobs as expired after 48 hours'; 