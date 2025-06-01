import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import { extractDataFromExcel } from './excelExtractor';
// import { ProcessedReportData } from '../types'; // Not strictly needed for test logic

// Helper function to create a valid Excel buffer for testing
async function createTestExcelBuffer(headerRowIndex = 8, headers: string[], dataRows: any[][]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Sheet1');

  // Add empty rows if headerRowIndex > 1 to place the header correctly
  for (let i = 1; i < headerRowIndex; i++) {
    sheet.addRow([]);
  }
  sheet.addRow(headers);
  dataRows.forEach(row => sheet.addRow(row));

  const excelJsBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(excelJsBuffer); // Convert to Node.js Buffer
}

describe('extractDataFromExcel', () => {
  let testExcelBuffer: Buffer;
  let testExcelBufferCustomHeader: Buffer;

  beforeAll(async () => {
    // Standard headers expected by the function after lowercasing
    const standardHeaders = ['AWBPREFIX', 'AWBSUFFIX', 'CHARGEWT', 'FRT_COST_RATE', 'TOTAL_COST', 'OtherHeader'];
    const testData = [
      ['123', '1234567', 100, 1.5, 150, 'Data1'],
      ['124', '7654321', 200, 2.0, 400, 'Data2'],
      ['125', '0000000.0', 250, 1.0, 250, 'Data3'] // Test .0 stripping for awbsuffix
    ];
    testExcelBuffer = await createTestExcelBuffer(8, standardHeaders, testData);
    testExcelBufferCustomHeader = await createTestExcelBuffer(1, standardHeaders, testData);
  });

  it('should extract data from a generated Excel file with default header row (8)', async () => {
    const data = await extractDataFromExcel(testExcelBuffer);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(3);

    const firstRecord = data[0];
    expect(firstRecord).toBeDefined();
    expect(firstRecord).toHaveProperty('awbprefix', '123');
    expect(firstRecord).toHaveProperty('awbsuffix', '1234567');
    expect(firstRecord).toHaveProperty('chargewt', 100);
    expect(firstRecord).toHaveProperty('frt_cost_rate', 1.5);
    expect(firstRecord).toHaveProperty('total_cost', 150);
    expect(firstRecord).toHaveProperty('otherheader', 'Data1');

    const thirdRecord = data[2];
    expect(thirdRecord).toHaveProperty('awbsuffix', '0000000'); // .0 should be stripped

  });

  it('should extract data with a specified header row (1)', async () => {
    const data = await extractDataFromExcel(testExcelBufferCustomHeader, 1);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(3);
    const firstRecord = data[0];
    expect(firstRecord).toBeDefined();
    expect(firstRecord).toHaveProperty('awbprefix', '123');
  });

  it('should use columnMappings to rename headers', async () => {
    const columnMappings = { 'awbprefix': 'customAwbPrefix', 'otherheader': 'customOther' };
    const data = await extractDataFromExcel(testExcelBuffer, 8, columnMappings);
    
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(3);
    const firstRecord = data[0];
    expect(firstRecord).toBeDefined();
    expect(firstRecord).toHaveProperty('customAwbPrefix', '123');
    expect(firstRecord).not.toHaveProperty('awbprefix');
    expect(firstRecord).toHaveProperty('customOther', 'Data1');
    expect(firstRecord).not.toHaveProperty('otherheader');
    // Unmapped headers should remain
    expect(firstRecord).toHaveProperty('awbsuffix', '1234567');
  });

   it('should handle empty or non-standard Excel files gracefully', async () => {
    const emptyWorkbook = new ExcelJS.Workbook();
    const emptySheet = emptyWorkbook.addWorksheet('Sheet1');
    // Test with header row specified but not found (empty sheet effectively)
    const emptyBufferHeadersNotFound = await emptyWorkbook.xlsx.writeBuffer();
    await expect(extractDataFromExcel(Buffer.from(emptyBufferHeadersNotFound), 1)).rejects.toThrow(
        /Header row 1 not found or is empty/
    );
    
    // Test with header row found, but no data rows
    emptySheet.addRow(['Header1', 'Header2']);
    const noDataRowsBuffer = await emptyWorkbook.xlsx.writeBuffer();
    const noDataResult = await extractDataFromExcel(Buffer.from(noDataRowsBuffer),1);
    expect(noDataResult).toEqual([]);

    // Test with a buffer that is not a valid Excel file
    const badBuffer = Buffer.from('this is not an excel file, just plain text');
    // Expect exceljs itself to throw an error when trying to load a non-zip/non-excel file
    await expect(extractDataFromExcel(badBuffer)).rejects.toThrow(); 
  });

}); 