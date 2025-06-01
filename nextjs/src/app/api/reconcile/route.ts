import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { FlyDubaiProcessor } from '@/lib/processors/flyDubai/FlyDubaiProcessor';
import type { ReconciliationInput } from '@/lib/processors/types';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { airlineType, invoiceFileId, reportFileId } = await request.json();

  if (!airlineType || !invoiceFileId || !reportFileId) {
    return NextResponse.json(
      { error: 'Missing airlineType, invoiceFileId, or reportFileId' },
      { status: 400 }
    );
  }

  if (airlineType !== 'flydubai') {
    return NextResponse.json(
      { error: 'Invalid airlineType. Currently, only "flydubai" is supported.' },
      { status: 400 }
    );
  }

  // --- 6.1.2: Fetch files from Supabase Storage ---
  let invoiceFileBuffer: ArrayBuffer | null = null;
  let reportFileBuffer: ArrayBuffer | null = null;
  let jobId: string | null = null; // Variable to store the job ID

  // --- 6.2.1: Create Job Record ---
  try {
    const { data: jobData, error: jobError } = await supabase
      .from('reconciliation_jobs')
      .insert({
        user_id: user.id,
        airline_type: airlineType,
        status: 'processing',
        invoice_file_id: invoiceFileId, // Link to the persistent saved_invoice id
        report_file_path: reportFileId, // Store the path of the uploaded report file for this job
      })
      .select('id')
      .single();

    if (jobError || !jobData) {
      console.error('Error creating reconciliation job:', jobError);
      return NextResponse.json(
        { error: 'Failed to create reconciliation job.' },
        { status: 500 }
      );
    }
    jobId = jobData.id;
    console.log('Reconciliation job created with ID:', jobId);
  } catch (e) {
    console.error('Unexpected error creating job:', e);
    return NextResponse.json({ error: 'Internal server error while creating job.' }, { status: 500 });
  }

  // Fetch Invoice File
  try {
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('saved_invoices')
      .select('file_path')
      .eq('id', invoiceFileId)
      .eq('user_id', user.id)
      .single();

    if (invoiceError || !invoiceData) {
      console.error('Error fetching invoice details:', invoiceError);
      return NextResponse.json(
        { error: 'Failed to fetch invoice details or invoice not found.' },
        { status: 404 }
      );
    }

    const invoiceFilePath = invoiceData.file_path;
    if (!invoiceFilePath) {
      return NextResponse.json(
        { error: 'Invoice file path not found.' },
        { status: 404 }
      );
    }

    // Assuming 'invoice_storage' is your bucket name. Replace if different.
    const { data: invoiceBlob, error: downloadInvoiceError } =
      await supabase.storage.from('invoice_storage').download(invoiceFilePath);

    if (downloadInvoiceError) {
      console.error('Error downloading invoice file:', downloadInvoiceError);
      return NextResponse.json(
        { error: 'Failed to download invoice file.' },
        { status: 500 }
      );
    }
    invoiceFileBuffer = await invoiceBlob.arrayBuffer();
  } catch (e) {
    console.error('Unexpected error fetching invoice:', e);
    return NextResponse.json({ error: 'Internal server error while fetching invoice.' }, { status: 500 });
  }

  // Fetch Report File
  // Assuming reportFileId is the direct storage path provided by the client for the uploaded report.
  // Or, it could be an ID to another table that stores temporary upload paths.
  // For this step, we'll treat reportFileId as the direct path.
  const reportFilePath = reportFileId; // Assuming reportFileId is the full path or a key to construct it.
                                   // Example if it's just a filename in a user's pending folder:
                                   // const reportFilePath = `${user.id}/invoice-reconciler/pending_reports/${reportFileId}`;


  if (!reportFilePath || typeof reportFilePath !== 'string') {
     return NextResponse.json({ error: 'Invalid reportFileId (must be a string path).' }, { status: 400 });
  }

  try {
    // Assuming 'invoice_storage' is your bucket name. Replace if different.
    const { data: reportBlob, error: downloadReportError } =
      await supabase.storage.from('invoice_storage').download(reportFilePath);

    if (downloadReportError) {
      console.error('Error downloading report file:', downloadReportError);
      return NextResponse.json(
        { error: 'Failed to download report file.' },
        { status: 500 }
      );
    }
    reportFileBuffer = await reportBlob.arrayBuffer();
  } catch (e) {
    console.error('Unexpected error fetching report:', e);
    return NextResponse.json({ error: 'Internal server error while fetching report.' }, { status: 500 });
  }

  if (!invoiceFileBuffer || !reportFileBuffer) {
    return NextResponse.json({ error: 'Failed to load file buffers.' }, { status: 500 });
  }

  // Placeholder for further processing
  // For now, just confirming files were "fetched" (buffers would be populated)
  console.log('Invoice file buffer size:', invoiceFileBuffer.byteLength);
  console.log('Report file buffer size:', reportFileBuffer.byteLength);

  // --- 6.1.3: Instantiate Airline Processor ---
  let processor;
  if (airlineType === 'flydubai') {
    processor = new FlyDubaiProcessor();
  } else {
    // Placeholder/error for other airline types
    // --- 6.2.3: Update job to "failed" on error ---
    if (jobId) {
      try {
        await supabase
          .from('reconciliation_jobs')
          .update({ status: 'failed', error_message: `Airline type '${airlineType}' is not yet supported.` })
          .eq('id', jobId);
      } catch (updateError) {
        console.error('Failed to update job status to failed:', updateError);
        // Log and continue, primary error is more important
      }
    }
    return NextResponse.json(
      { error: `Airline type '${airlineType}' is not yet supported.` },
      { status: 400 }
    );
  }

  // --- Actual Processing ---
  try {
    const input: ReconciliationInput = {
      invoiceFileBuffer: Buffer.from(invoiceFileBuffer!),
      reportFileBuffer: Buffer.from(reportFileBuffer!),
      airlineType: airlineType as 'flydubai', // Cast for now
    };

    const result = await processor.process(input);

    if (result.success && result.generatedReportBuffer) {
      // --- 6.2.2: Upload generated report and update job to "completed" ---
      const reportOutputFilePath = `${user.id}/invoice-reconciler/jobs/${jobId}/${airlineType}_${new Date().toISOString()}_reconciliation_report.xlsx`;
      const { error: uploadError } = await supabase.storage
        .from('reconciliation_reports_storage') // Assuming a separate bucket for generated reports
        .upload(reportOutputFilePath, result.generatedReportBuffer, {
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          upsert: true, // Overwrite if somehow a file with the exact same name exists (unlikely with timestamp)
        });

      if (uploadError) {
        console.error('Error uploading reconciliation report:', uploadError);
        // Update job to "failed" even if processing was successful but upload failed
        await supabase
          .from('reconciliation_jobs')
          .update({ status: 'failed', error_message: 'Failed to upload generated report.' })
          .eq('id', jobId!);
        return NextResponse.json({ error: 'Failed to upload reconciliation report.' }, { status: 500 });
      }

      await supabase
        .from('reconciliation_jobs')
        .update({ status: 'completed', generated_report_path: reportOutputFilePath })
        .eq('id', jobId!);

      console.log('Reconciliation successful, report uploaded, job updated to completed.');
      return NextResponse.json({
        message: 'Reconciliation successful!',
        jobId,
        reportPath: reportOutputFilePath,
        // Include other relevant data from 'result' if needed
      });
    } else {
      // --- 6.2.3: Update job to "failed" if processing failed ---
      await supabase
        .from('reconciliation_jobs')
        .update({ status: 'failed', error_message: result.error || 'Processing failed for an unknown reason.' })
        .eq('id', jobId!);
      return NextResponse.json({ error: result.error || 'Processing failed.' }, { status: 500 });
    }
  } catch (processingError: any) {
    console.error('Error during reconciliation processing:', processingError);
    // --- 6.2.3: Update job to "failed" on exception ---
    if (jobId) {
      try {
        await supabase
          .from('reconciliation_jobs')
          .update({ status: 'failed', error_message: processingError.message || 'An unexpected error occurred during processing.' })
          .eq('id', jobId);
      } catch (updateError) {
        console.error('Failed to update job status to failed after processing error:', updateError);
      }
    }
    return NextResponse.json({ error: 'An unexpected error occurred during reconciliation.' }, { status: 500 });
  }

  /* Original response before processing logic was added - keeping for reference
  return NextResponse.json({
    message: 'Files fetched, ready for processing.',
    airlineType,
    invoiceFileId, // Keep original IDs for context
    reportFileId, // Keep original IDs for context
    jobId, // Return the new job ID
    userId: user.id,
    invoiceSize: invoiceFileBuffer.byteLength,
    reportSize: reportFileBuffer.byteLength,
  });
  */
} 