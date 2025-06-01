import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types'; // Assuming your generated types

interface UploadInvoiceParams {
  supabase: SupabaseClient<Database>;
  userId: string;
  airlineId: string; // Corresponds to airline_types.id
  file: File;
}

interface UploadResult {
  filePath?: string;
  error?: Error | null;
  success: boolean;
}

const INVOICE_BUCKET_NAME = 'invoice-reconciler'; // Changed from 'invoices'
const REPORT_BUCKET_NAME = 'reports'; // As per PRD for job-specific report files

/**
 * Uploads an invoice file to Supabase Storage with the organization user_id/airline_id/filename.
 *
 * @param params - The parameters for uploading the invoice.
 * @returns A promise that resolves with an object containing the file path if successful, or an error.
 */
export async function uploadInvoiceToSupabaseStorage(
  { supabase, userId, airlineId, file }: UploadInvoiceParams
): Promise<UploadResult> {
  if (!userId || !airlineId || !file) {
    console.error('User ID, Airline ID, and File are required for upload.');
    return { success: false, error: new Error('Missing required parameters for upload.') };
  }

  const filePath = `${userId}/${airlineId}/${file.name}`;

  try {
    const { data, error } = await supabase.storage
      .from(INVOICE_BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        // upsert: false by default, which is good. We'd typically check for duplicates before calling this.
        // If `saved_invoices` table has a constraint for unique user_id/airline_id/file_hash or file_name,
        // we'd rely on that or the checkForDuplicate utility before attempting an upload that might overwrite
        // or if we wanted to version, logic would be different.
        // For now, simple upload. Duplicate check should happen *before* this function call.
      });

    if (error) {
      console.error('Error uploading invoice to Supabase Storage:', error);
      return { success: false, error };
    }

    if (data) {
        // The path returned by supabase.storage.upload is the key, which is what we constructed.
        // It's good to return it for confirmation or if any transformation happened.
      return { success: true, filePath: data.path };
    }
    
    // Should not happen if error is null and data is null, but as a fallback:
    return { success: false, error: new Error('Unknown error during Supabase Storage upload.') };

  } catch (e) {
    console.error('Exception during invoice upload:', e);
    return { success: false, error: e instanceof Error ? e : new Error(String(e)) };
  }
}

/**
 * Deletes an invoice file from Supabase Storage.
 *
 * @param supabase - The Supabase client.
 * @param filePath - The path of the file to delete in the format user_id/airline_id/filename.
 * @returns A promise that resolves with an object indicating success or failure.
 */
export async function deleteInvoiceFromSupabaseStorage(
  supabase: SupabaseClient<Database>,
  filePath: string
): Promise<{ success: boolean; error?: Error | null }> {
  if (!filePath) {
    console.error('File path is required for deletion.');
    return { success: false, error: new Error('File path is required.') };
  }

  try {
    const { error } = await supabase.storage
      .from(INVOICE_BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting invoice from Supabase Storage:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (e) {
    console.error('Exception during invoice deletion:', e);
    return { success: false, error: e instanceof Error ? e : new Error(String(e)) };
  }
}

/**
 * Uploads an Excel report file to Supabase Storage.
 * The path will be user_id/jobs/job_id/filename.
 * This function will be called when a reconciliation job is created or when a report is uploaded.
 */
export async function uploadReportToSupabaseStorage(
  supabase: SupabaseClient<Database>,
  userId: string,
  jobId: string,
  file: File
): Promise<UploadResult> {
  if (!userId || !jobId || !file) {
    console.error('User ID, Job ID, and File are required for report upload.');
    return { success: false, error: new Error('Missing required parameters for report upload.') };
  }

  const filePath = `${userId}/jobs/${jobId}/${file.name}`;

  try {
    const { data, error } = await supabase.storage
      .from(REPORT_BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        // upsert: true // Allow overwriting if a report for the same job is re-uploaded
      });

    if (error) {
      console.error('Error uploading report to Supabase Storage:', error);
      return { success: false, error };
    }

    if (data) {
      return { success: true, filePath: data.path };
    }
    
    return { success: false, error: new Error('Unknown error during Supabase Storage report upload.') };

  } catch (e) {
    console.error('Exception during report upload:', e);
    return { success: false, error: e instanceof Error ? e : new Error(String(e)) };
  }
}
