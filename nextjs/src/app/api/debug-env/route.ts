import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('--- DEBUG ENV API ---');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', anonKey ? 'Loaded' : 'Missing or Undefined');
  console.log('---------------------');

  return NextResponse.json({
    supabaseUrl: supabaseUrl || 'Not Found',
    anonKeyIsSet: !!anonKey,
  });
} 