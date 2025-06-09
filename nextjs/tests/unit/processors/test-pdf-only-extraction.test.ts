import fs from 'fs';
import path from 'path';
import { FlyDubaiProcessor } from '../../../src/lib/processors/flyDubai/FlyDubaiProcessor';
import { extractTextWithLayout } from '../../../src/lib/processors/utils/pdfExtractor';

describe('Fly Dubai PDF AWB Extraction Only', () => {
  test('should extract exact AWB data from PDF fixture', async () => {
    console.log('🧪 Testing EXACT AWB Data Extraction from Fly Dubai PDF ONLY...\n');
    
    // Load the PDF fixture
    const pdfPath = path.join(__dirname, '../../fixtures', '1748342669424_2501013781418TLV001248_25-25_1-15.1.25.pdf');
    
    // Verify file exists
    expect(fs.existsSync(pdfPath)).toBe(true);
    
    const pdfBuffer = fs.readFileSync(pdfPath);
    
    console.log('✅ PDF loaded successfully:');
    console.log(`   PDF: ${pdfBuffer.length} bytes\n`);
    
    // Extract text from PDF
    console.log('🔍 Step 1: Extracting text with layout...');
    const pagesData = await extractTextWithLayout(pdfBuffer);
    console.log(`📄 Extracted ${pagesData.length} pages\n`);
    
    // Use FlyDubaiProcessor to extract AWB data directly
    console.log('🔍 Step 2: Using FlyDubaiProcessor to extract AWB data...');
    const processor = new FlyDubaiProcessor();
    
    // Access the private method through any to get AWB data
    const awbData = (processor as any)._extractAwbDataFromFlyDubaiPdf(pagesData);
    
    console.log('\n📊 PDF EXTRACTION RESULTS:');
    console.log('=' .repeat(80));
    console.log(`✅ AWB Records Extracted: ${awbData.length}\n`);
    
    // Verify we got data
    expect(awbData.length).toBeGreaterThan(0);
    
    // Show ALL AWB records in detail
    console.log('📋 ALL AWB RECORDS EXTRACTED:');
    console.log('─'.repeat(80));
    awbData.forEach((awb: any, index: number) => {
      console.log(`AWB #${index + 1}:`);
      console.log(`   AWB Number: ${awb.awbNumber}`);
      console.log(`   AWB Serial: ${awb.awbSerialPart1} ${awb.awbSerialPart2}`);
      console.log(`   Flight Date: ${awb.flightDate}`);
      console.log(`   Route: ${awb.origin} → ${awb.destination}`);
      console.log(`   Charge Weight: ${awb.chargeWeight}`);
      console.log(`   Net Yield Rate: ${awb.netYieldRate}`);
      console.log(`   Net Due for AWB: ${awb.netDueForAwb}`);
      console.log(`   PP Freight Charge: ${awb.ppFreightCharge}`);
      console.log(`   PP Due Airline: ${awb.ppDueAirline}`);
      console.log(`   CC Freight Charge: ${awb.ccFreightCharge}`);
      console.log(`   CC Due Agent: ${awb.ccDueAgent}`);
      console.log(`   CC Due Airline: ${awb.ccDueAirline}`);
      console.log(`   Disc: ${awb.disc}`);
      console.log(`   Agency Comm: ${awb.agencyComm}`);
      console.log(`   Taxes: ${awb.taxes}`);
      console.log(`   Others: ${awb.others}`);
      console.log(`   Exchange Rate: ${awb.exchangeRate}`);
      console.log('─'.repeat(40));
      
      // Verify AWB structure
      expect(awb.awbNumber).toBeDefined();
      expect(awb.origin).toBe('TLV'); // Should be Tel Aviv
      expect(awb.destination).toBeDefined();
      expect(awb.chargeWeight).toBeDefined();
      expect(awb.netDueForAwb).toBeDefined();
    });
    
    // Show summary stats
    console.log('\n📈 SUMMARY STATISTICS:');
    console.log('─'.repeat(50));
    
    const nonTotalRecords = awbData.filter((awb: any) => awb.awbNumber !== 'Total');
    
    const totalNetDue = nonTotalRecords.reduce((sum: number, awb: any) => {
      const amount = parseFloat(awb.netDueForAwb) || 0;
      return sum + amount;
    }, 0);
    
    const totalChargeWeight = nonTotalRecords.reduce((sum: number, awb: any) => {
      const weight = parseFloat(awb.chargeWeight?.replace(/[KkLb\s]/g, '') || '0') || 0;
      return sum + weight;
    }, 0);
    
    const destinations = [...new Set(awbData.map((awb: any) => awb.destination))];
    const flightDates = [...new Set(awbData.map((awb: any) => awb.flightDate).filter((date: string) => date && date !== ''))];
    
    console.log(`   Total AWB Records: ${awbData.length}`);
    console.log(`   Non-Total Records: ${nonTotalRecords.length}`);
    console.log(`   Total Net Due: $${totalNetDue.toFixed(2)}`);
    console.log(`   Total Charge Weight: ${totalChargeWeight.toFixed(2)} kg`);
    console.log(`   Average Net Due per AWB: $${(totalNetDue / nonTotalRecords.length).toFixed(2)}`);
    console.log(`   Unique Destinations: ${destinations.join(', ')}`);
    console.log(`   Flight Date Range: ${flightDates.sort().join(', ')}`);
    
    // Show specific AWB examples
    console.log('\n🎯 SPECIFIC AWB EXAMPLES:');
    console.log('─'.repeat(50));
    
    // Find AWBs with specific serial numbers from our earlier extraction
    const exampleSerials = ['5295292', '5295295', '5295462'];
    exampleSerials.forEach(serial => {
      const awb = awbData.find((a: any) => a.awbSerialPart1 === serial);
      if (awb) {
        console.log(`✅ Found AWB 141 ${serial}:`);
        console.log(`   Date: ${awb.flightDate}, Dest: ${awb.destination}`);
        console.log(`   Weight: ${awb.chargeWeight}, Net Due: $${awb.netDueForAwb}`);
        console.log(`   Rate: ${awb.netYieldRate}, PP Freight: ${awb.ppFreightCharge}`);
      }
    });
    
    // Verify we have reasonable data
    expect(totalNetDue).toBeGreaterThan(0);
    expect(totalChargeWeight).toBeGreaterThan(0);
    expect(destinations.length).toBeGreaterThan(0);
    
    console.log('\n✅ PDF-only AWB extraction test completed successfully!');
  }, 30000); // 30 second timeout for processing
}); 