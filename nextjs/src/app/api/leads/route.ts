import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

type LeadInsert = Database['public']['Tables']['leads']['Insert'];
type LeadRow = Database['public']['Tables']['leads']['Row'];

export async function POST(request: NextRequest) {
  try {
    console.log('=== Lead Submission API ===');
    
    // Use anon key for public contact form with RLS policies allowing public inserts
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hcyteovnllklmvoptxjr.supabase.co';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjeXRlb3ZubGxrbG12b3B0eGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1MDI5MTcsImV4cCI6MjA2NDA3ODkxN30.QEoxsRXBGSiZYFkEvIe_6wqdU2s8sprHIJEiLsLZy7I';
    
    const supabase = createClient<Database>(supabaseUrl, supabaseKey);
    console.log('Supabase client created successfully');
    
    // Parse form data
    const body = await request.json();
    console.log('Request body parsed successfully');
    
    const { 
      firstName, 
      lastName, 
      email, 
      phoneNumber, 
      company, 
      industry, 
      message 
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !message) {
      console.log('Validation failed - missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, email, and message are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      console.log('Validation failed - invalid email format');
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate phone number length if provided
    if (phoneNumber && phoneNumber.replace(/\D/g, '').length < 10) {
      console.log('Validation failed - invalid phone number');
      return NextResponse.json(
        { error: 'Phone number must be at least 10 digits' },
        { status: 400 }
      );
    }

    // Prepare lead data
    const leadData: LeadInsert = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.toLowerCase().trim(),
      phone_number: phoneNumber?.trim() || null,
      company: company?.trim() || null,
      industry: industry || null,
      message: message.trim(),
      source: 'landing_page_contact_form'
    };

    console.log('Lead data prepared for database insertion');

    // Insert lead into database using anon key (with RLS)
    const { error } = await supabase
      .from('leads')
      .insert(leadData);

    if (error) {
      console.error('Database insert error:', error);
      return NextResponse.json(
        { error: 'Failed to submit contact form. Please try again.' },
        { status: 500 }
      );
    }

    console.log('Database insert successful');

    // Success response
    return NextResponse.json({
      success: true,
      message: 'Thank you for your interest! We will contact you within 24 hours.'
    });

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 