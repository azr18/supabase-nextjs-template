import { createClient } from '../../../lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting reconciliation with Python microservice');
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { airlineType, invoiceFileId, reportFileId } = await request.json();

    if (!airlineType || !invoiceFileId || !reportFileId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    if (airlineType !== 'flydubai') {
      return NextResponse.json(
        { error: 'Invalid airlineType. Currently, only "flydubai" is supported.' },
        { status: 400 }
      );
    }

    console.log('📁 Retrieving files from Supabase storage:', { 
      invoiceFileId, 
      reportFileId, 
      userId: user.id 
    });

    // Retrieve invoice PDF file
    const { data: invoiceFile, error: invoiceError } = await supabase.storage
      .from('invoices')
      .download(invoiceFileId);

    if (invoiceError) {
      console.error('❌ Invoice file retrieval error:', invoiceError);
      return NextResponse.json({ 
        error: 'Failed to retrieve invoice file',
        details: invoiceError.message
      }, { status: 500 });
    }

    // Retrieve report Excel file
    const { data: reportFile, error: reportError } = await supabase.storage
      .from('reports')
      .download(reportFileId);

    if (reportError) {
      console.error('❌ Report file retrieval error:', reportError);
      return NextResponse.json({ 
        error: 'Failed to retrieve report file',
        details: reportError.message
      }, { status: 500 });
    }

    // Convert files to base64 for Python service
    const invoiceBuffer = Buffer.from(await invoiceFile.arrayBuffer());
    const reportBuffer = Buffer.from(await reportFile.arrayBuffer());
    
    const invoiceBase64 = invoiceBuffer.toString('base64');
    const reportBase64 = reportBuffer.toString('base64');

    console.log('✅ Files retrieved and converted to base64:', {
      invoiceSize: invoiceBuffer.length,
      reportSize: reportBuffer.length
    });

    // Call Python microservice
    console.log('🐍 Calling Python reconciliation microservice...');
    
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:5000';
    
    try {
      const response = await fetch(`${pythonServiceUrl}/reconcile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdf_file: invoiceBase64,
          excel_file: reportBase64
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Python service error:', errorData);
        return NextResponse.json({
          error: 'Python reconciliation service failed',
          details: errorData.error || `HTTP ${response.status}`,
          status: response.status
        }, { status: 500 });
      }

      const result = await response.json();
      
      console.log('✅ Python service reconciliation completed:', {
        success: result.success,
        invoicesRows: result.invoices_rows,
        ccaRows: result.cca_rows,
        totalNetDue: result.total_net_due_awb,
        hasExcelFile: !!result.excel_file
      });

      // Return the result from Python service
      return NextResponse.json({
        success: result.success,
        message: 'Reconciliation completed successfully',
        data: {
          invoicesRows: result.invoices_rows,
          ccaRows: result.cca_rows,
          totalNetDueAwb: result.total_net_due_awb,
          excelFile: result.excel_file, // base64 encoded processed Excel
          airlineType,
          userId: user.id
        }
      }, { status: 200 });

    } catch (fetchError) {
      console.error('❌ Failed to connect to Python service:', fetchError);
      return NextResponse.json({
        error: 'Failed to connect to Python reconciliation service',
        details: fetchError instanceof Error ? fetchError.message : 'Connection failed',
        hint: 'Ensure Python service is running on http://localhost:5000'
      }, { status: 503 });
    }

  } catch (e) {
    console.error('💥 Unexpected error in reconciliation:', e);
    return NextResponse.json({ 
      error: 'An unexpected error occurred during reconciliation',
      details: e instanceof Error ? e.message : 'Unknown error'
    }, { status: 500 });
  }
} 