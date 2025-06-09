import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
// import { cookies } from 'next/headers'; // cookies import removed as it's unused

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  // const cookieStore = cookies(); // cookieStore is likely handled internally by createClient
  // Assuming createClient in @/lib/supabase/server.ts is incorrectly async and takes 0 arguments
  const supabase = await createClient(); 
  const { jobId } = await params;

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Error fetching user:', userError);
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to download reports.' },
        { status: 401 }
      );
    }

    if (!jobId) {
      return NextResponse.json(
        { error: 'Bad Request: Job ID is required.' },
        { status: 400 }
      );
    }

    const { data: job, error: jobError } = await supabase
      .from('reconciliation_jobs')
      .select('status, report_storage_path, user_id, report_filename')
      .eq('id', jobId)
      .single();

    if (jobError) {
      console.error(`Error fetching job ${jobId}:`, jobError);
      if (jobError.code === 'PGRST116') { // PostgREST error code for "No rows found"
        return NextResponse.json(
          { error: 'Not Found: Job not found.' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Internal Server Error: Could not retrieve job details.' },
        { status: 500 }
      );
    }

    if (!job) {
      return NextResponse.json(
        { error: 'Not Found: Job not found.' },
        { status: 404 }
      );
    }

    if (job.user_id !== user.id) {
      console.warn(`User ${user.id} attempted to access job ${jobId} owned by ${job.user_id}`);
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to access this report.' },
        { status: 403 }
      );
    }

    if (job.status !== 'completed') {
      return NextResponse.json(
        { error: 'Bad Request: Report is not ready for download. Job status is: ' + job.status },
        { status: 400 }
      );
    }

    if (!job.report_storage_path) {
      console.error(`Job ${jobId} is completed but has no report_storage_path.`);
      return NextResponse.json(
        { error: 'Internal Server Error: Report file path is missing.' },
        { status: 500 }
      );
    }

    const expiresIn = 60; // Signed URL expires in 60 seconds
    const { data: signedUrlData, error: signedUrlError } =
      await supabase.storage
        .from('reports') // As per PRD: 'reports' bucket
        .createSignedUrl(job.report_storage_path, expiresIn, {
          download: job.report_filename || `reconciliation_report_${jobId}.xlsx`, // Suggest a filename for download
        });

    if (signedUrlError) {
      console.error('Error creating signed URL:', signedUrlError);
      return NextResponse.json(
        { error: 'Internal Server Error: Could not generate download link.' },
        { status: 500 }
      );
    }

    if (!signedUrlData || !signedUrlData.signedUrl) {
        console.error('Error creating signed URL: No signed URL in response data.');
        return NextResponse.json(
          { error: 'Internal Server Error: Could not generate download link (empty response).' },
          { status: 500 }
        );
    }

    return NextResponse.json({ downloadUrl: signedUrlData.signedUrl });

  } catch (error: unknown) {
    console.error('Unexpected error in download API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json(
      { error: 'Internal Server Error: An unexpected error occurred.', details: errorMessage },
      { status: 500 }
    );
  }
} 