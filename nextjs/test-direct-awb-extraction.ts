import fs from 'fs';
import path from 'path';
import { FlyDubaiProcessor } from './src/lib/processors/flyDubai/FlyDubaiProcessor';
import type { ReconciliationInput } from './src/lib/processors/types';

async function testDirectAWBExtraction() {
  try {
    console.log('🧪 Testing EXACT AWB Data Extraction from Fly Dubai PDF...\n');
    
    // Load the PDF fixture
    const pdfPath = path.join(__dirname, 'tests', 'fixtures', '1748342669424_2501013781418TLV001248_25-25_1-15.1.25.pdf');
    const excelPath = path.join(__dirname, 'tests', 'fixtures', 'AllDataReport_2025-01-01_to_2025-06-15_0333000901.xls');
    
    if (!fs.existsSync(pdfPath)) {
      console.error('❌ PDF file not found at:', pdfPath);
      return;
    }
    
    if (!fs.existsSync(excelPath)) {
      console.error('❌ Excel file not found at:', excelPath);
      return;
    }
    
    const pdfBuffer = fs.readFileSync(pdfPath);
    const excelBuffer = fs.readFileSync(excelPath);
    
    console.log('✅ Files loaded successfully:');
    console.log(`   PDF: ${pdfBuffer.length} bytes`);
    console.log(`   Excel: ${excelBuffer.length} bytes\n`);
    
    // Process with FlyDubaiProcessor
    console.log('🔍 Processing with FlyDubaiProcessor...');
    const processor = new FlyDubaiProcessor();
    
    const input: ReconciliationInput = {
      invoiceFileBuffer: pdfBuffer,
      reportFileBuffer: excelBuffer,
      airlineType: 'flydubai'
    };
    
    const result = await processor.process(input);
    
    if (!result.success) {
      console.error('❌ Processing failed:', result.error);
      return;
    }
    
    const awbData = result.processedInvoiceData?.awb || [];
    const ccaData = result.processedInvoiceData?.cca || [];
    const reportData = result.processedReportData || [];
    const reconciledData = result.reconciledData || [];
    
    console.log('\n📊 EXTRACTION RESULTS:');
    console.log('=' .repeat(80));
    console.log(`✅ AWB Records: ${awbData.length}`);
    console.log(`✅ CCA Records: ${ccaData.length}`);
    console.log(`✅ Report Records: ${reportData.length}`);
    console.log(`✅ Reconciled Records: ${reconciledData.length}\n`);
    
    // Show first 5 AWB records in detail
    console.log('📋 FIRST 5 AWB RECORDS:');
    console.log('─'.repeat(80));
    awbData.slice(0, 5).forEach((awb, index) => {
      console.log(`AWB #${index + 1}:`);
      console.log(`   AWB Number: ${awb.awbNumber}`);
      console.log(`   Flight Date: ${awb.flightDate}`);
      console.log(`   Route: ${awb.origin} → ${awb.destination}`);
      console.log(`   Charge Weight: ${awb.chargeWeight}`);
      console.log(`   Net Yield Rate: ${awb.netYieldRate}`);
      console.log(`   Net Due for AWB: ${awb.netDueForAwb}`);
      console.log(`   PP Freight: ${awb.ppFreightCharge}`);
      console.log(`   CC Freight: ${awb.ccFreightCharge}`);
      console.log();
    });
    
    // Show summary stats
    console.log('📈 SUMMARY STATISTICS:');
    console.log('─'.repeat(50));
    
    const nonTotalRecords = awbData.filter(awb => awb.awbNumber !== 'Total');
    
    const totalNetDue = nonTotalRecords.reduce((sum, awb) => {
      const amount = parseFloat(awb.netDueForAwb) || 0;
      return sum + amount;
    }, 0);
    
    const totalChargeWeight = nonTotalRecords.reduce((sum, awb) => {
      const weight = parseFloat(awb.chargeWeight?.replace(/[KkLb\s]/g, '') || '0') || 0;
      return sum + weight;
    }, 0);
    
    const destinations = [...new Set(awbData.map(awb => awb.destination))];
    const flightDates = [...new Set(awbData.map(awb => awb.flightDate).filter(date => date && date !== ''))];
    
    console.log(`   Total Net Due: $${totalNetDue.toFixed(2)}`);
    console.log(`   Total Charge Weight: ${totalChargeWeight.toFixed(2)} kg`);
    console.log(`   Average Net Due per AWB: $${(totalNetDue / nonTotalRecords.length).toFixed(2)}`);
    console.log(`   Destinations: ${destinations.join(', ')}`);
    console.log(`   Flight Date Range: ${flightDates.sort().join(', ')}`);
    
    // Show reconciliation summary
    if (reconciledData.length > 0) {
      console.log('\n🔄 RECONCILIATION SUMMARY:');
      console.log('─'.repeat(50));
      
      const discrepancies = reconciledData.filter(r => r.discrepancyFound);
      const matches = reconciledData.filter(r => !r.discrepancyFound);
      
      console.log(`   ✅ Perfect Matches: ${matches.length}`);
      console.log(`   ⚠️  Discrepancies Found: ${discrepancies.length}`);
      
      if (discrepancies.length > 0) {
        console.log('\n   Top 3 Discrepancies:');
        discrepancies.slice(0, 3).forEach((disc, index) => {
          console.log(`   ${index + 1}. AWB ${disc.awbPrefix} ${disc.awbSerial}:`);
          console.log(`      Invoice Net Due: $${disc.netDueInvoice}`);
          console.log(`      Report Net Due: $${disc.netDueReport}`);
          console.log(`      Difference: $${disc.diffNetDue}`);
        });
      }
    }
    
    console.log('\n✅ Exact AWB extraction test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testDirectAWBExtraction(); 