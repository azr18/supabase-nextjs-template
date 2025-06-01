import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Error fetching user or no user for storage usage:', userError);
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // For now, this calculates usage based on 'saved_invoices' table.
    // FR3.8 mentions "across all tools and files", so a more comprehensive solution
    // would also sum sizes from 'reconciliation_jobs' (for reports) and other potential storage.
    const { data, error: usageError } = await supabase
      .from('saved_invoices')
      .select('file_size')
      .eq('user_id', user.id);

    if (usageError) {
      console.error('Error fetching storage usage for user:', user.id, usageError);
      return NextResponse.json({ message: 'Failed to calculate storage usage', details: usageError.message }, { status: 500 });
    }

    const totalUsage = data.reduce((acc, invoice) => acc + (invoice.file_size || 0), 0);

    return NextResponse.json({ userId: user.id, totalUsageBytes: totalUsage, quotaBytes: 100 * 1024 * 1024 }, { status: 200 });

  } catch (e: any) {
    console.error('API error in /api/storage-usage GET:', e);
    return NextResponse.json({ message: 'Internal Server Error', details: e.message }, { status: 500 });
  }
} 