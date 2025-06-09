const fs = require('fs');
const path = require('path');

async function testFlyDubaiProcessor() {
  try {
    console.log('🧪 Testing Fly Dubai processor directly...');
    
    // Import the processor (using dynamic import for ES modules)
    const { FlyDubaiProcessor } = await import('./nextjs/src/lib/processors/flyDubai/FlyDubaiProcessor.ts');
    
    // Load fixture files
    const pdfPath = path.join(__dirname, 'nextjs', 'tests', 'fixtures', '1748342669424_2501013781418TLV001248_25-25_1-15.1.25.pdf');
    const excelPath = path.join(__dirname, 'nextjs', 'tests', 'fixtures', 'AllDataReport_2025-01-01_to_2025-06-15_0333000901.xls');
    
    console.log('📁 Loading files:');
    console.log('PDF:', pdfPath);
    console.log('Excel:', excelPath);
    
    if (!fs.existsSync(pdfPath)) {
      console.error('❌ PDF file not found');
      return;
    }
    
    if (!fs.existsSync(excelPath)) {
      console.error('❌ Excel file not found');
      return;
    }
    
    const invoiceBuffer = fs.readFileSync(pdfPath);
    const reportBuffer = fs.readFileSync(excelPath);
    
    console.log('✅ Files loaded:', {
      pdfSize: invoiceBuffer.length,
      excelSize: reportBuffer.length
    });
    
    // Create input
    const input = {
      invoiceFileBuffer: invoiceBuffer,
      reportFileBuffer: reportBuffer,
      airlineType: 'flydubai'
    };
    
    // Process
    console.log('🚀 Processing...');
    const processor = new FlyDubaiProcessor();
    const result = await processor.process(input);
    
    console.log('📊 Results:');
    console.log('Success:', result.success);
    
    if (!result.success) {
      console.error('❌ Processing failed:', result.error);
      return;
    }
    
    console.log('📋 Summary:');
    console.log('- AWB data:', result.processedInvoiceData?.awb?.length || 0, 'records');
    console.log('- CCA data:', result.processedInvoiceData?.cca?.length || 0, 'records');
    console.log('- Report data:', result.processedReportData?.length || 0, 'records');
    console.log('- Reconciled data:', result.reconciledData?.length || 0, 'records');
    console.log('- Discrepancies:', result.reconciledData?.filter(r => r['Discrepancy Found']).length || 0);
    
    // Show sample AWB data
    if (result.processedInvoiceData?.awb?.length > 0) {
      console.log('\n📋 Sample AWB Data (first record):');
      const firstAwb = result.processedInvoiceData.awb[0];
      console.log(JSON.stringify(firstAwb, null, 2));
    }
    
    // Show sample reconciled data
    if (result.reconciledData?.length > 0) {
      console.log('\n📋 Sample Reconciled Data (first record):');
      const firstReconciled = result.reconciledData[0];
      console.log(JSON.stringify(firstReconciled, null, 2));
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testFlyDubaiProcessor(); 