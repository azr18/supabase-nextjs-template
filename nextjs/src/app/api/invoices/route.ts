import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase/types';

export async function POST(request: Request) {
  const supabase = await createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { 
      airlineId,
      originalFilename,
      fileSize,
      fileHash,
      filePath 
    } = await request.json();

    // No need to transform the airlineId since it's already in the correct format
    const airlineTypeForDb = airlineId;

    if (!airlineTypeForDb || !originalFilename || fileSize === undefined || !fileHash || !filePath) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Validate airlineId exists in airline_types table? (Optional, depends on strictness)
    // Could also fetch airline_name if needed for the saved_invoices table

    const { data: newInvoice, error } = await supabase
      .from('saved_invoices')
      .insert({
        user_id: user.id,
        airline_type: airlineTypeForDb,
        original_filename: originalFilename,
        file_size: fileSize,
        file_hash: fileHash,
        file_path: filePath,
        // upload_date is typically handled by `default now()` in DB or `created_at` timestamp
        // metadata: {} // if you have a JSONB column for other details
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving invoice metadata:', error);
      // Check for RLS violation (common Supabase error code for this is '42501' or if details mention RLS)
      // Supabase might also return a more generic error but the details string could contain policy information.
      if (error.code === '42501' || (error.message && error.message.toLowerCase().includes('row level security')) || (error.details && error.details.toLowerCase().includes('row level security'))) {
        return NextResponse.json({ message: 'Failed to save invoice: Permission denied. This may be due to an inactive subscription or other access restrictions.', details: error.message }, { status: 403 }); // 403 Forbidden
      }
      if (error.code === '23505') { // Unique constraint violation
         return NextResponse.json({ message: 'This invoice (based on hash or other unique fields) might already exist.', details: error.message }, { status: 409 });
      }
      if (error.code === '23514') { // Check constraint violation (e.g. invalid airline_type after transformation, or other check fails)
        return NextResponse.json({ message: 'Failed to save invoice: Invalid data provided. Please ensure all fields are correct.', details: error.message }, { status: 400 }); // Bad Request
      }
      return NextResponse.json({ message: 'Failed to save invoice metadata', details: error.message }, { status: 500 });
    }

    return NextResponse.json(newInvoice, { status: 201 });

  } catch (e: any) {
    console.error('API error in /api/invoices POST:', e);
    return NextResponse.json({ message: 'Internal Server Error', details: e.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('invoiceId');

    if (!invoiceId) {
      return NextResponse.json({ message: 'invoiceId is required' }, { status: 400 });
    }

    // 1. Fetch invoice details to get file_path and verify ownership
    const { data: invoice, error: fetchError } = await supabase
      .from('saved_invoices')
      .select('id, user_id, file_path')
      .eq('id', invoiceId)
      .single();

    if (fetchError || !invoice) {
      console.error('Error fetching invoice or invoice not found:', fetchError);
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.user_id !== user.id) {
      return NextResponse.json({ message: 'Forbidden: You do not own this invoice' }, { status: 403 });
    }

    // 2. Check if the invoice is used in any reconciliation_jobs (FR4.19)
    const { data: jobs, error: jobCheckError } = await supabase
      .from('reconciliation_jobs')
      .select('id')
      .eq('saved_invoice_id', invoiceId)
      .limit(1);

    if (jobCheckError) {
      console.error('Error checking reconciliation jobs:', jobCheckError);
      return NextResponse.json({ message: 'Failed to check job usage', details: jobCheckError.message }, { status: 500 });
    }

    if (jobs && jobs.length > 0) {
      return NextResponse.json({ message: 'Invoice is in use by a reconciliation job and cannot be deleted.' }, { status: 400 });
    }

    // 3. Delete the file from Supabase Storage
    if (invoice.file_path) {
      // Dynamically import the storage manager function
      const { deleteInvoiceFromSupabaseStorage } = await import('@/lib/fileUtils/storageManager');
      const { success: deleteSuccess, error: deleteStorageError } = await deleteInvoiceFromSupabaseStorage(supabase, invoice.file_path);
      if (!deleteSuccess) {
        console.error('Failed to delete invoice from storage:', deleteStorageError);
        // Non-fatal for the DB record deletion, but admin should be aware or a cleanup job run
        // For now, we proceed to delete DB record but log this.
      }
    }

    // 4. Delete the invoice record from the saved_invoices table
    const { error: deleteDbError } = await supabase
      .from('saved_invoices')
      .delete()
      .eq('id', invoiceId);

    if (deleteDbError) {
      console.error('Error deleting invoice from database:', deleteDbError);
      return NextResponse.json({ message: 'Failed to delete invoice', details: deleteDbError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Invoice deleted successfully' }, { status: 200 });

  } catch (e: any) {
    console.error('API error in /api/invoices DELETE:', e);
    return NextResponse.json({ message: 'Internal Server Error', details: e.message }, { status: 500 });
  }
}

// GET handler can be added here if needed to fetch invoices through this API route as well,
// though current implementation uses a query utility (getUserInvoicesByAirline).
// Example GET (if you were to use it):
// export async function GET(request: Request) {
//   const supabase = createRouteHandlerClient<Database>({ cookies });
//   const { data: { user } } = await supabase.auth.getUser();
//   if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

//   const { searchParams } = new URL(request.url);
//   const airlineId = searchParams.get('airlineId');

//   if (!airlineId) {
//     return NextResponse.json({ message: 'airlineId is required' }, { status: 400 });
//   }

//   const { data, error } = await supabase
//     .from('saved_invoices')
//     .select('*')
//     .eq('user_id', user.id)
//     .eq('airline_id', airlineId)
//     .order('upload_date', { ascending: false });

//   if (error) {
//     return NextResponse.json({ message: 'Failed to fetch invoices', details: error.message }, { status: 500 });
//   }
//   return NextResponse.json(data);
// } 