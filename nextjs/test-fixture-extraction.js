const fs = require('fs');
const path = require('path');

// Simple test to extract text from the PDF fixture using pdf-parse directly
async function testPdfExtraction() {
  try {
    console.log('🧪 Testing PDF extraction with fixture file...');
    
    // Import pdf-parse
    const pdf = require('pdf-parse');
    
    // Load the PDF fixture
    const pdfPath = path.join(__dirname, 'tests', 'fixtures', '1748342669424_2501013781418TLV001248_25-25_1-15.1.25.pdf');
    
    console.log('📁 Loading PDF:', pdfPath);
    
    if (!fs.existsSync(pdfPath)) {
      console.error('❌ PDF file not found at:', pdfPath);
      return;
    }
    
    const pdfBuffer = fs.readFileSync(pdfPath);
    console.log('✅ PDF loaded, size:', pdfBuffer.length, 'bytes');
    
    // Extract text using pdf-parse
    console.log('🔍 Extracting text...');
    const data = await pdf(pdfBuffer);
    
    console.log('📊 PDF Info:');
    console.log('- Pages:', data.numpages);
    console.log('- Text length:', data.text.length);
    
    // Show more content to find AWB data
    console.log('\n📋 Full text content (looking for AWB data):');
    console.log('=' .repeat(80));
    console.log(data.text);
    console.log('=' .repeat(80));
    
    // Look for AWB patterns
    console.log('\n🔍 Looking for AWB patterns (141 prefix):');
    const awbMatches = data.text.match(/141\s+\d{7}\s+\d/g);
    if (awbMatches) {
      console.log('Found AWB patterns:', awbMatches.slice(0, 5)); // Show first 5
    } else {
      console.log('No AWB patterns found');
      
      // Look for any 141 mentions
      const any141 = data.text.match(/141/g);
      if (any141) {
        console.log('Found 141 mentions:', any141.length);
        
        // Show context around 141
        const lines = data.text.split('\n');
        lines.forEach((line, index) => {
          if (line.includes('141')) {
            console.log(`Line ${index}: ${line.trim()}`);
          }
        });
      }
    }
    
    console.log('\n✅ PDF extraction test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Test Excel extraction
async function testExcelExtraction() {
  try {
    console.log('\n🧪 Testing Excel extraction with fixture file...');
    
    // Import ExcelJS
    const ExcelJS = require('exceljs');
    
    // Load the Excel fixture
    const excelPath = path.join(__dirname, 'tests', 'fixtures', 'AllDataReport_2025-01-01_to_2025-06-15_0333000901.xls');
    
    console.log('📁 Loading Excel:', excelPath);
    
    if (!fs.existsSync(excelPath)) {
      console.error('❌ Excel file not found at:', excelPath);
      return;
    }
    
    const workbook = new ExcelJS.Workbook();
    
    // Try reading as .xls (older format)
    try {
      await workbook.xlsx.readFile(excelPath);
    } catch (xlsxError) {
      console.log('Failed to read as .xlsx, trying as .xls...');
      // For .xls files, we might need a different approach
      console.log('Note: .xls files require different handling than .xlsx');
      return;
    }
    
    console.log('📊 Excel Info:');
    console.log('- Worksheets:', workbook.worksheets.length);
    
    if (workbook.worksheets.length === 0) {
      console.log('No worksheets found in the file');
      return;
    }
    
    // Get first worksheet
    const worksheet = workbook.worksheets[0];
    console.log('- First sheet name:', worksheet.name);
    console.log('- Row count:', worksheet.rowCount);
    console.log('- Column count:', worksheet.columnCount);
    
    // Show headers (assuming row 8 as per the processor)
    console.log('\n📋 Headers (row 8):');
    const headerRow = worksheet.getRow(8);
    const headers = [];
    headerRow.eachCell((cell) => {
      headers.push(cell.value);
    });
    console.log(headers.slice(0, 10)); // Show first 10 headers
    
    // Show first few data rows
    console.log('\n📋 First 3 data rows:');
    for (let i = 9; i <= Math.min(11, worksheet.rowCount); i++) {
      const row = worksheet.getRow(i);
      const values = [];
      row.eachCell((cell) => {
        values.push(cell.value);
      });
      console.log(`Row ${i}:`, values.slice(0, 5)); // Show first 5 columns
    }
    
    console.log('\n✅ Excel extraction test completed!');
    
  } catch (error) {
    console.error('❌ Excel test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run both tests
async function runTests() {
  await testPdfExtraction();
  await testExcelExtraction();
}

runTests(); 