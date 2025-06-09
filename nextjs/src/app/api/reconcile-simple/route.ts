import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Simple reconcile route accessed');
    
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ 
      message: 'Reconcile route working with Supabase auth',
      userId: user.id 
    }, { status: 200 });
  } catch (error) {
    console.error('Simple reconcile route error:', error);
    return NextResponse.json(
      { error: 'Simple reconcile route error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 