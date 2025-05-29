-- Create reconciliation_jobs table for SaaS platform
-- This table tracks invoice reconciliation jobs with status and progress

CREATE TABLE "public"."reconciliation_jobs" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL,
    "user_id" UUID NOT NULL,
    "tool_id" UUID NOT NULL,
    "airline_type" TEXT NOT NULL CHECK (airline_type IN ('fly_dubai', 'tap', 'philippines_airlines', 'air_india', 'el_al')),
    "status" TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    "progress_percentage" INTEGER NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    "job_name" TEXT NOT NULL,
    "description" TEXT,
    "invoice_file_id" UUID,
    "report_file_id" UUID,
    "invoice_file_path" TEXT,
    "report_file_path" TEXT,
    "result_file_path" TEXT,
    "started_at" TIMESTAMP WITH TIME ZONE,
    "completed_at" TIMESTAMP WITH TIME ZONE,
    "failed_at" TIMESTAMP WITH TIME ZONE,
    "error_message" TEXT,
    "error_details" JSONB,
    "processing_metadata" JSONB DEFAULT '{}',
    "result_summary" JSONB DEFAULT '{}',
    "estimated_duration_minutes" INTEGER,
    "actual_duration_minutes" INTEGER,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE "public"."reconciliation_jobs" ENABLE ROW LEVEL SECURITY;

-- Create primary key
CREATE UNIQUE INDEX reconciliation_jobs_pkey ON "public"."reconciliation_jobs" USING btree (id);
ALTER TABLE "public"."reconciliation_jobs" ADD CONSTRAINT "reconciliation_jobs_pkey" PRIMARY KEY USING INDEX "reconciliation_jobs_pkey";

-- Create foreign key constraint to auth.users
ALTER TABLE "public"."reconciliation_jobs" 
ADD CONSTRAINT "reconciliation_jobs_user_id_fkey" 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create foreign key constraint to public.tools
ALTER TABLE "public"."reconciliation_jobs" 
ADD CONSTRAINT "reconciliation_jobs_tool_id_fkey" 
FOREIGN KEY (tool_id) REFERENCES public.tools(id) ON DELETE RESTRICT;

-- Create foreign key constraint to saved_invoices (optional reference)
ALTER TABLE "public"."reconciliation_jobs" 
ADD CONSTRAINT "reconciliation_jobs_invoice_file_id_fkey" 
FOREIGN KEY (invoice_file_id) REFERENCES public.saved_invoices(id) ON DELETE SET NULL;

-- Create foreign key constraint to saved_invoices for report file (optional reference)
ALTER TABLE "public"."reconciliation_jobs" 
ADD CONSTRAINT "reconciliation_jobs_report_file_id_fkey" 
FOREIGN KEY (report_file_id) REFERENCES public.saved_invoices(id) ON DELETE SET NULL;

-- Create indexes for efficient querying
CREATE INDEX reconciliation_jobs_user_id_idx ON "public"."reconciliation_jobs" USING btree (user_id);
CREATE INDEX reconciliation_jobs_tool_id_idx ON "public"."reconciliation_jobs" USING btree (tool_id);
CREATE INDEX reconciliation_jobs_airline_type_idx ON "public"."reconciliation_jobs" USING btree (airline_type);
CREATE INDEX reconciliation_jobs_status_idx ON "public"."reconciliation_jobs" USING btree (status);
CREATE INDEX reconciliation_jobs_created_at_idx ON "public"."reconciliation_jobs" USING btree (created_at);
CREATE INDEX reconciliation_jobs_started_at_idx ON "public"."reconciliation_jobs" USING btree (started_at);
CREATE INDEX reconciliation_jobs_completed_at_idx ON "public"."reconciliation_jobs" USING btree (completed_at);

-- Create compound index for user-status filtering (most common query pattern)
CREATE INDEX reconciliation_jobs_user_status_created_idx 
ON "public"."reconciliation_jobs" USING btree (user_id, status, created_at DESC);

-- Create compound index for airline-specific user queries
CREATE INDEX reconciliation_jobs_user_airline_status_idx 
ON "public"."reconciliation_jobs" USING btree (user_id, airline_type, status);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON TABLE "public"."reconciliation_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."reconciliation_jobs" TO "service_role";

-- Create RLS policy: Users can manage their own reconciliation jobs
CREATE POLICY "Users can manage their own reconciliation jobs"
ON "public"."reconciliation_jobs"
AS PERMISSIVE
FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- Create RLS policy: Service role can manage all jobs (admin operations)
CREATE POLICY "Service role can manage all reconciliation jobs"
ON "public"."reconciliation_jobs"
AS PERMISSIVE
FOR ALL
TO service_role
USING (true);

-- Create trigger to automatically update updated_at
CREATE TRIGGER handle_reconciliation_jobs_updated_at
    BEFORE UPDATE ON "public"."reconciliation_jobs"
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create function to update job status with proper status transitions
CREATE OR REPLACE FUNCTION public.update_job_status(
    job_id UUID,
    new_status TEXT,
    progress_percent INTEGER DEFAULT NULL,
    error_msg TEXT DEFAULT NULL,
    error_data JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_status TEXT;
    affected_rows INTEGER;
BEGIN
    -- Get current status
    SELECT status INTO current_status
    FROM "public"."reconciliation_jobs"
    WHERE id = job_id AND user_id = auth.uid();
    
    IF current_status IS NULL THEN
        RETURN false; -- Job not found or not owned by user
    END IF;
    
    -- Validate status transitions
    IF current_status = 'completed' OR current_status = 'cancelled' THEN
        RETURN false; -- Cannot change completed or cancelled jobs
    END IF;
    
    -- Update job with new status and metadata
    UPDATE "public"."reconciliation_jobs"
    SET 
        status = new_status,
        progress_percentage = COALESCE(progress_percent, progress_percentage),
        error_message = CASE 
            WHEN new_status = 'failed' THEN error_msg 
            WHEN new_status != 'failed' THEN NULL 
            ELSE error_message 
        END,
        error_details = CASE 
            WHEN new_status = 'failed' THEN error_data 
            WHEN new_status != 'failed' THEN NULL 
            ELSE error_details 
        END,
        started_at = CASE 
            WHEN new_status = 'processing' AND started_at IS NULL THEN NOW() 
            ELSE started_at 
        END,
        completed_at = CASE 
            WHEN new_status = 'completed' THEN NOW() 
            ELSE completed_at 
        END,
        failed_at = CASE 
            WHEN new_status = 'failed' THEN NOW() 
            ELSE failed_at 
        END,
        updated_at = NOW()
    WHERE id = job_id AND user_id = auth.uid();
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.update_job_status(UUID, TEXT, INTEGER, TEXT, JSONB) TO "authenticated";

-- Create function to calculate job duration when completed
CREATE OR REPLACE FUNCTION public.calculate_job_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND NEW.started_at IS NOT NULL THEN
        NEW.actual_duration_minutes = EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) / 60;
    ELSIF NEW.status = 'failed' AND NEW.started_at IS NOT NULL THEN
        NEW.actual_duration_minutes = EXTRACT(EPOCH FROM (NEW.failed_at - NEW.started_at)) / 60;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate duration
CREATE TRIGGER calculate_reconciliation_job_duration
    BEFORE UPDATE ON "public"."reconciliation_jobs"
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_job_duration();

-- Create view for recent user jobs with summary information
CREATE VIEW "public"."user_reconciliation_jobs_summary" AS
SELECT 
    rj.id,
    rj.user_id,
    rj.airline_type,
    rj.status,
    rj.progress_percentage,
    rj.job_name,
    rj.description,
    rj.created_at,
    rj.started_at,
    rj.completed_at,
    rj.failed_at,
    rj.actual_duration_minutes,
    rj.error_message,
    rj.result_file_path,
    t.name as tool_name,
    t.slug as tool_slug,
    CASE 
        WHEN rj.status = 'completed' THEN 'success'
        WHEN rj.status = 'failed' THEN 'error'
        WHEN rj.status = 'processing' THEN 'loading'
        ELSE 'pending'
    END as ui_status_type
FROM "public"."reconciliation_jobs" rj
JOIN "public"."tools" t ON rj.tool_id = t.id
ORDER BY rj.created_at DESC;

-- Grant permissions on the view
GRANT SELECT ON "public"."user_reconciliation_jobs_summary" TO "authenticated";
GRANT ALL ON "public"."user_reconciliation_jobs_summary" TO "service_role";

-- Create function to create a new reconciliation job
CREATE OR REPLACE FUNCTION public.create_reconciliation_job(
    p_tool_id UUID,
    p_airline_type TEXT,
    p_job_name TEXT,
    p_description TEXT DEFAULT NULL,
    p_invoice_file_id UUID DEFAULT NULL,
    p_report_file_id UUID DEFAULT NULL,
    p_invoice_file_path TEXT DEFAULT NULL,
    p_report_file_path TEXT DEFAULT NULL,
    p_estimated_duration INTEGER DEFAULT NULL,
    p_processing_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE(
    success BOOLEAN,
    job_id UUID,
    message TEXT
) AS $$
DECLARE
    v_user_id UUID;
    v_new_job_id UUID;
    v_tool_exists BOOLEAN;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN QUERY SELECT false, NULL::UUID, 'User not authenticated';
        RETURN;
    END IF;
    
    -- Verify tool exists
    SELECT EXISTS(SELECT 1 FROM public.tools WHERE id = p_tool_id) INTO v_tool_exists;
    
    IF NOT v_tool_exists THEN
        RETURN QUERY SELECT false, NULL::UUID, 'Tool not found';
        RETURN;
    END IF;
    
    -- Insert new reconciliation job
    INSERT INTO "public"."reconciliation_jobs" (
        user_id,
        tool_id,
        airline_type,
        job_name,
        description,
        invoice_file_id,
        report_file_id,
        invoice_file_path,
        report_file_path,
        estimated_duration_minutes,
        processing_metadata
    ) VALUES (
        v_user_id,
        p_tool_id,
        p_airline_type,
        p_job_name,
        p_description,
        p_invoice_file_id,
        p_report_file_id,
        p_invoice_file_path,
        p_report_file_path,
        p_estimated_duration,
        p_processing_metadata
    ) RETURNING id INTO v_new_job_id;
    
    RETURN QUERY SELECT true, v_new_job_id, 'Reconciliation job created successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.create_reconciliation_job(UUID, TEXT, TEXT, TEXT, UUID, UUID, TEXT, TEXT, INTEGER, JSONB) TO "authenticated";

COMMENT ON TABLE "public"."reconciliation_jobs" IS 'Tracks invoice reconciliation jobs with status, progress, and results';
COMMENT ON COLUMN "public"."reconciliation_jobs"."airline_type" IS 'Type of airline for reconciliation: fly_dubai, tap, philippines_airlines, air_india, el_al';
COMMENT ON COLUMN "public"."reconciliation_jobs"."status" IS 'Current job status: pending, processing, completed, failed, cancelled';
COMMENT ON COLUMN "public"."reconciliation_jobs"."progress_percentage" IS 'Job completion percentage (0-100)';
COMMENT ON COLUMN "public"."reconciliation_jobs"."processing_metadata" IS 'Metadata about the reconciliation process (settings, parameters, etc.)';
COMMENT ON COLUMN "public"."reconciliation_jobs"."result_summary" IS 'Summary of reconciliation results (totals, discrepancies, statistics)';
COMMENT ON COLUMN "public"."reconciliation_jobs"."error_details" IS 'Detailed error information as JSON when job fails';
COMMENT ON COLUMN "public"."reconciliation_jobs"."actual_duration_minutes" IS 'Actual time taken to complete the job in minutes';
COMMENT ON VIEW "public"."user_reconciliation_jobs_summary" IS 'Summary view of user reconciliation jobs with tool details and UI-friendly status types'; 