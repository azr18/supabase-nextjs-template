import fs from 'fs';
import path from 'path';

async function testExactAWBExtraction() {
  try {
    console.log('🧪 Testing EXACT AWB Data Extraction from Fly Dubai PDF...\n');
    
    // Import the actual processor modules
    const { FlyDubaiProcessor } = await import('./src/lib/processors/flyDubai/FlyDubaiProcessor.ts');
    const { extractTextWithLayout } = await import('./src/lib/processors/utils/pdfExtractor.ts');
    
    // Load the PDF fixture
    const pdfPath = path.join(__dirname, 'tests', 'fixtures', '1748342669424_2501013781418TLV001248_25-25_1-15.1.25.pdf');
    
    if (!fs.existsSync(pdfPath)) {
      console.error('❌ PDF file not found');
      return;
    }
    
    const pdfBuffer = fs.readFileSync(pdfPath);
    console.log('✅ PDF loaded, size:', pdfBuffer.length, 'bytes\n');
    
    // Extract text with layout
    console.log('🔍 Step 1: Extracting text with layout...');
    const pagesData = await extractTextWithLayout(pdfBuffer);
    console.log(`📄 Extracted ${pagesData.length} pages\n`);
    
    // Use FlyDubaiProcessor to extract AWB data
    console.log('🔍 Step 2: Using FlyDubaiProcessor to extract AWB data...');
    const processor = new FlyDubaiProcessor();
    
    // Call the internal AWB extraction method
    const awbData = processor._extractAwbDataFromFlyDubaiPdf(pagesData);
    
    console.log('📊 EXTRACTION RESULTS:');
    console.log('=' .repeat(80));
    console.log(`✅ Total AWB Records Found: ${awbData.length}\n`);
    
    // Show each AWB record in detail
    awbData.forEach((awb, index) => {
      console.log(`📋 AWB Record #${index + 1}:`);
      console.log('─'.repeat(50));
      console.log(`   AWB Number: ${awb.awbNumber}`);
      console.log(`   AWB Serial Part 1: ${awb.awbSerialPart1}`);
      console.log(`   AWB Serial Part 2: ${awb.awbSerialPart2}`);
      console.log(`   Flight Date: ${awb.flightDate}`);
      console.log(`   Origin: ${awb.origin}`);
      console.log(`   Destination: ${awb.destination}`);
      console.log(`   Charge Weight: ${awb.chargeWeight}`);
      console.log(`   Net Yield Rate: ${awb.netYieldRate}`);
      console.log(`   PP Freight Charge: ${awb.ppFreightCharge}`);
      console.log(`   PP Due Airline: ${awb.ppDueAirline}`);
      console.log(`   CC Freight Charge: ${awb.ccFreightCharge}`);
      console.log(`   CC Due Agent: ${awb.ccDueAgent}`);
      console.log(`   CC Due Airline: ${awb.ccDueAirline}`);
      console.log(`   Disc: ${awb.disc}`);
      console.log(`   Agency Comm: ${awb.agencyComm}`);
      console.log(`   Taxes: ${awb.taxes}`);
      console.log(`   Others: ${awb.others}`);
      console.log(`   Net Due for AWB: ${awb.netDueForAwb}`);
      console.log(`   Exchange Rate: ${awb.exchangeRate}`);
      console.log();
    });
    
    console.log('=' .repeat(80));
    
    // Show summary statistics
    console.log('📈 SUMMARY STATISTICS:');
    console.log('─'.repeat(30));
    
    const totalNetDue = awbData
      .filter(awb => awb.awbNumber !== 'Total')
      .reduce((sum, awb) => {
        const amount = parseFloat(awb.netDueForAwb) || 0;
        return sum + amount;
      }, 0);
    
    const totalChargeWeight = awbData
      .filter(awb => awb.awbNumber !== 'Total')
      .reduce((sum, awb) => {
        const weight = parseFloat(awb.chargeWeight?.replace(/[KkLb\s]/g, '') || '0') || 0;
        return sum + weight;
      }, 0);
    
    console.log(`   Total Net Due: $${totalNetDue.toFixed(2)}`);
    console.log(`   Total Charge Weight: ${totalChargeWeight.toFixed(2)} kg`);
    console.log(`   Average Net Due per AWB: $${(totalNetDue / awbData.filter(awb => awb.awbNumber !== 'Total').length).toFixed(2)}`);
    
    // Show unique destinations
    const destinations = [...new Set(awbData.map(awb => awb.destination))];
    console.log(`   Destinations: ${destinations.join(', ')}`);
    
    // Show date range
    const dates = awbData.map(awb => awb.flightDate).filter(date => date && date !== '');
    console.log(`   Flight Dates: ${[...new Set(dates)].sort().join(', ')}`);
    
    console.log('\n✅ Exact AWB extraction test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testExactAWBExtraction(); 