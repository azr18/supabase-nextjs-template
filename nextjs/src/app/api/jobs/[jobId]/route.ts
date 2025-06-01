import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  const { jobId } = params;
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Error fetching user:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const { data: job, error: jobError } = await supabase
      .from('reconciliation_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (jobError) {
      if (jobError.code === 'PGRST116') { // PostgREST error code for "No rows found"
        return NextResponse.json({ error: 'Job not found or access denied' }, { status: 404 });
      }
      console.error('Error fetching job:', jobError);
      return NextResponse.json({ error: 'Error fetching job details', details: jobError.message }, { status: 500 });
    }

    if (!job) {
      return NextResponse.json({ error: 'Job not found or access denied' }, { status: 404 });
    }

    return NextResponse.json(job, { status: 200 });
  } catch (error: any) {
    console.error('Catch all error in GET /api/jobs/[jobId]:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
} 