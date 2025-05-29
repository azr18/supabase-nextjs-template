-- Create saved_invoices table for SaaS platform
-- This table stores user invoices with metadata for reuse and duplicate detection

CREATE TABLE "public"."saved_invoices" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL,
    "user_id" UUID NOT NULL,
    "airline_type" TEXT NOT NULL CHECK (airline_type IN ('fly_dubai', 'tap', 'philippines_airlines', 'air_india', 'el_al')),
    "original_filename" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_hash" TEXT NOT NULL,
    "file_size" BIGINT NOT NULL CHECK (file_size > 0),
    "mime_type" TEXT NOT NULL DEFAULT 'application/pdf',
    "upload_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "last_used_at" TIMESTAMP WITH TIME ZONE,
    "usage_count" INTEGER NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
    "metadata" JSONB DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE "public"."saved_invoices" ENABLE ROW LEVEL SECURITY;

-- Create primary key
CREATE UNIQUE INDEX saved_invoices_pkey ON "public"."saved_invoices" USING btree (id);
ALTER TABLE "public"."saved_invoices" ADD CONSTRAINT "saved_invoices_pkey" PRIMARY KEY USING INDEX "saved_invoices_pkey";

-- Create foreign key constraint to auth.users
ALTER TABLE "public"."saved_invoices" 
ADD CONSTRAINT "saved_invoices_user_id_fkey" 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create partial unique index to prevent duplicate active files for same user and airline
-- Note: This is an index only, not a constraint, to allow soft-deleted duplicates
CREATE UNIQUE INDEX saved_invoices_user_airline_hash_active_unique_idx 
ON "public"."saved_invoices" USING btree (user_id, airline_type, file_hash)
WHERE is_active = true;

-- Create indexes for efficient querying
CREATE INDEX saved_invoices_user_id_idx ON "public"."saved_invoices" USING btree (user_id);
CREATE INDEX saved_invoices_airline_type_idx ON "public"."saved_invoices" USING btree (airline_type);
CREATE INDEX saved_invoices_file_hash_idx ON "public"."saved_invoices" USING btree (file_hash);
CREATE INDEX saved_invoices_upload_date_idx ON "public"."saved_invoices" USING btree (upload_date);
CREATE INDEX saved_invoices_last_used_at_idx ON "public"."saved_invoices" USING btree (last_used_at);
CREATE INDEX saved_invoices_is_active_idx ON "public"."saved_invoices" USING btree (is_active);

-- Create compound index for user-airline filtering
CREATE INDEX saved_invoices_user_airline_active_idx 
ON "public"."saved_invoices" USING btree (user_id, airline_type, is_active);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."saved_invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."saved_invoices" TO "service_role";

-- Create RLS policy: Users can only access their own invoices
CREATE POLICY "Users can manage their own saved invoices"
ON "public"."saved_invoices"
AS PERMISSIVE
FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- Create RLS policy: Service role can manage all invoices (admin operations)
CREATE POLICY "Service role can manage all saved invoices"
ON "public"."saved_invoices"
AS PERMISSIVE
FOR ALL
TO service_role
USING (true);

-- Create trigger to automatically update updated_at
CREATE TRIGGER handle_saved_invoices_updated_at
    BEFORE UPDATE ON "public"."saved_invoices"
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create function to update last_used_at when invoice is used
CREATE OR REPLACE FUNCTION public.update_invoice_usage(invoice_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE "public"."saved_invoices"
    SET 
        last_used_at = NOW(),
        usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE id = invoice_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.update_invoice_usage(UUID) TO "authenticated";

-- Create view for active invoices with airline filtering
CREATE VIEW "public"."active_saved_invoices" AS
SELECT 
    id,
    user_id,
    airline_type,
    original_filename,
    file_path,
    file_hash,
    file_size,
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

-- Grant permissions on the view
GRANT SELECT ON "public"."active_saved_invoices" TO "authenticated";
GRANT ALL ON "public"."active_saved_invoices" TO "service_role";

-- Create function to soft delete invoices (set is_active = false)
CREATE OR REPLACE FUNCTION public.soft_delete_invoice(invoice_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE "public"."saved_invoices"
    SET 
        is_active = false,
        updated_at = NOW()
    WHERE id = invoice_id AND user_id = auth.uid();
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.soft_delete_invoice(UUID) TO "authenticated";

-- Create function to check for duplicate invoices
CREATE OR REPLACE FUNCTION public.check_duplicate_invoice(
    p_user_id UUID,
    p_airline_type TEXT,
    p_file_hash TEXT,
    p_filename TEXT DEFAULT NULL,
    p_file_size BIGINT DEFAULT NULL
)
RETURNS TABLE(
    duplicate_found BOOLEAN,
    existing_invoice_id UUID,
    existing_filename TEXT,
    existing_upload_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE WHEN si.id IS NOT NULL THEN true ELSE false END as duplicate_found,
        si.id as existing_invoice_id,
        si.original_filename as existing_filename,
        si.upload_date as existing_upload_date
    FROM "public"."saved_invoices" si
    WHERE si.user_id = p_user_id 
    AND si.airline_type = p_airline_type 
    AND si.file_hash = p_file_hash
    AND si.is_active = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.check_duplicate_invoice(UUID, TEXT, TEXT, TEXT, BIGINT) TO "authenticated";

-- Create function to safely insert invoice with duplicate checking
CREATE OR REPLACE FUNCTION public.insert_saved_invoice(
    p_airline_type TEXT,
    p_original_filename TEXT,
    p_file_path TEXT,
    p_file_hash TEXT,
    p_file_size BIGINT,
    p_mime_type TEXT DEFAULT 'application/pdf',
    p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE(
    success BOOLEAN,
    invoice_id UUID,
    is_duplicate BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_user_id UUID;
    v_existing_id UUID;
    v_new_id UUID;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN QUERY SELECT false, NULL::UUID, false, 'User not authenticated';
        RETURN;
    END IF;
    
    -- Check for existing active invoice with same hash
    SELECT id INTO v_existing_id
    FROM "public"."saved_invoices"
    WHERE user_id = v_user_id 
    AND airline_type = p_airline_type 
    AND file_hash = p_file_hash
    AND is_active = true
    LIMIT 1;
    
    IF v_existing_id IS NOT NULL THEN
        -- Duplicate found
        RETURN QUERY SELECT false, v_existing_id, true, 'Duplicate invoice already exists';
        RETURN;
    END IF;
    
    -- Insert new invoice
    INSERT INTO "public"."saved_invoices" (
        user_id,
        airline_type,
        original_filename,
        file_path,
        file_hash,
        file_size,
        mime_type,
        metadata
    ) VALUES (
        v_user_id,
        p_airline_type,
        p_original_filename,
        p_file_path,
        p_file_hash,
        p_file_size,
        p_mime_type,
        p_metadata
    ) RETURNING id INTO v_new_id;
    
    RETURN QUERY SELECT true, v_new_id, false, 'Invoice saved successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.insert_saved_invoice(TEXT, TEXT, TEXT, TEXT, BIGINT, TEXT, JSONB) TO "authenticated";

COMMENT ON TABLE "public"."saved_invoices" IS 'Stores user invoices with metadata for reuse and duplicate detection across airline types';
COMMENT ON COLUMN "public"."saved_invoices"."airline_type" IS 'Type of airline invoice: fly_dubai, tap, philippines_airlines, air_india, el_al';
COMMENT ON COLUMN "public"."saved_invoices"."file_hash" IS 'SHA-256 hash of the file content for duplicate detection';
COMMENT ON COLUMN "public"."saved_invoices"."file_path" IS 'Storage path in Supabase storage bucket';
COMMENT ON COLUMN "public"."saved_invoices"."usage_count" IS 'Number of times this invoice has been used in reconciliation jobs';
COMMENT ON COLUMN "public"."saved_invoices"."last_used_at" IS 'Timestamp when this invoice was last used in a reconciliation job';
COMMENT ON COLUMN "public"."saved_invoices"."metadata" IS 'Additional invoice metadata as JSON (extraction results, processing notes, etc.)';
COMMENT ON COLUMN "public"."saved_invoices"."is_active" IS 'Soft delete flag - false means invoice is deleted but kept for referential integrity';
COMMENT ON VIEW "public"."active_saved_invoices" IS 'View showing only active (non-deleted) saved invoices';
COMMENT ON FUNCTION public.update_invoice_usage(UUID) IS 'Updates usage statistics when an invoice is used in a reconciliation job';
COMMENT ON FUNCTION public.soft_delete_invoice(UUID) IS 'Soft deletes an invoice by setting is_active = false';
COMMENT ON FUNCTION public.check_duplicate_invoice(UUID, TEXT, TEXT, TEXT, BIGINT) IS 'Checks if an invoice with the same hash already exists for the user and airline type';
COMMENT ON FUNCTION public.insert_saved_invoice(TEXT, TEXT, TEXT, TEXT, BIGINT, TEXT, JSONB) IS 'Safely inserts a new invoice with duplicate checking and user authentication'; 