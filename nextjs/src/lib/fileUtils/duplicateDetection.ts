import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types'; // Assuming your generated types

/**
 * Generates a SHA-256 hash for a given file.
 * @param file The file to hash.
 * @returns A promise that resolves with the hex string of the hash.
 */
export async function generateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

interface CheckForDuplicateParams {
  supabase: SupabaseClient<Database>;
  userId: string;
  airlineId: string; // Assuming airline_types table uses 'id' and saved_invoices uses 'airline_id'
  fileHash: string;
  fileName: string;
  fileSize: number;
}

interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingInvoice?: Database['public']['Tables']['saved_invoices']['Row'];
}

/**
 * Checks for duplicate invoices in the Supabase 'saved_invoices' table.
 * A duplicate is considered if:
 * 1. The user ID, airline ID, and file hash match an existing record.
 * OR
 * 2. The user ID, airline ID, original filename, and file size match an existing record.
 *
 * @param params - The parameters for checking for duplicates.
 * @returns A promise that resolves with an object indicating if a duplicate exists and the existing invoice data if found.
 */
export async function checkForDuplicate(
  { supabase, userId, airlineId, fileHash, fileName, fileSize }: CheckForDuplicateParams
): Promise<DuplicateCheckResult> {
  if (!userId || !airlineId) {
    console.error('User ID and Airline ID are required for duplicate check.');
    // Or throw an error, depending on desired error handling
    return { isDuplicate: false }; 
  }

  // Check 1: Match by hash
  const { data: hashMatch, error: hashError } = await supabase
    .from('saved_invoices')
    .select('*')
    .eq('user_id', userId)
    .eq('airline_type', airlineId)
    .eq('file_hash', fileHash)
    .maybeSingle();

  if (hashError) {
    console.error('Error checking for duplicate by hash:', hashError);
    // Consider how to handle this error; returning false for now
    // or rethrow, or return an error status
    return { isDuplicate: false };
  }

  if (hashMatch) {
    return { isDuplicate: true, existingInvoice: hashMatch };
  }

  // Check 2: Match by filename and size (if no hash match)
  const { data: nameSizeMatch, error: nameSizeError } = await supabase
    .from('saved_invoices')
    .select('*')
    .eq('user_id', userId)
    .eq('airline_type', airlineId)
    .eq('original_filename', fileName)
    .eq('file_size', fileSize)
    .maybeSingle();

  if (nameSizeError) {
    console.error('Error checking for duplicate by filename/size:', nameSizeError);
    // Consider how to handle this error
    return { isDuplicate: false };
  }

  if (nameSizeMatch) {
    return { isDuplicate: true, existingInvoice: nameSizeMatch };
  }

  return { isDuplicate: false };
} 