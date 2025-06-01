import ExcelJS from 'exceljs';
import { ProcessedReportData } from '../types';

/**
 * Extracts data from a standardized Excel report file.
 *
 * @param excelBuffer Buffer containing the Excel file (Node.js Buffer type).
 * @param headerRow The 1-based index of the header row. Defaults to 8.
 * @param columnMappings Optional mapping for specific column names if needed,
 *                       e.g., { 'Awb Prefix From Report': 'awbprefix' }.
 *                       Keys are actual header names in Excel, values are desired keys in ProcessedReportData.
 * @returns A promise that resolves to an array of ProcessedReportData.
 */
export async function extractDataFromExcel(
  excelBuffer: Buffer, // Explicitly Node.js Buffer
  headerRow: number = 8,
  columnMappings?: Record<string, string>
): Promise<ProcessedReportData[]> {
  const workbook = new ExcelJS.Workbook();

  // Ensure we pass an ArrayBuffer to exceljs, derived from the Node.js Buffer
  const arrayBufferView = new Uint8Array(excelBuffer);
  const arrayBuffer = arrayBufferView.buffer;
  
  await workbook.xlsx.load(arrayBuffer);

  const worksheet = workbook.worksheets[0]; // Assuming data is on the first sheet
  if (!worksheet) {
    throw new Error('Excel file contains no worksheets.');
  }

  const data: ProcessedReportData[] = [];
  const actualHeaderRow = worksheet.getRow(headerRow);
  const headers: string[] = [];

  if (!actualHeaderRow.hasValues) {
    throw new Error(`Header row ${headerRow} not found or is empty.`);
  }

  actualHeaderRow.eachCell({ includeEmpty: false }, (cell: ExcelJS.Cell, colNumber: number) => {
    headers[colNumber - 1] = cell.value?.toString().trim().toLowerCase() || '';
  });
  
  if (headers.length === 0) {
    throw new Error(`No headers found in row ${headerRow}.`);
  }

  // Validate required headers (as per app(1).py)
  const requiredPythonHeaders = ['awbprefix', 'awbsuffix', 'chargewt', 'frt_cost_rate', 'total_cost'];
  const presentHeaders = headers.filter(h => h); // Filter out empty strings from sparse header row
  
  const missingPythonHeaders = requiredPythonHeaders.filter(
    (rh) => !presentHeaders.includes(rh)
  );

  if (missingPythonHeaders.length > 0 && !columnMappings) { // Only throw if no mappings are provided to potentially correct them
    console.warn(
      `Standard report headers missing and no columnMappings provided. Missing: ${missingPythonHeaders.join(
        ', '
      )}. Found: ${presentHeaders.join(', ')}`
    );
    // Not throwing an error here as per original plan to allow flexibility,
    // but logging a warning. The processor for each airline will be responsible
    // for handling missing critical data if not mapped.
  }


  worksheet.eachRow((row: ExcelJS.Row, rowNumber: number) => {
    if (rowNumber > headerRow) { // Start reading data rows after the header row
      const rowData: ProcessedReportData = {};
      let hasValues = false;
      row.eachCell({ includeEmpty: true }, (cell: ExcelJS.Cell, colNumber: number) => {
        const headerName = headers[colNumber - 1];
        if (headerName) { // Only process if there's a corresponding header
          const finalHeaderName = columnMappings?.[headerName] || headerName;
          // Special handling for AWB Prefix and Suffix to ensure they are strings
          if (finalHeaderName === 'awbprefix' || finalHeaderName === 'awbsuffix') {
            rowData[finalHeaderName] = cell.value?.toString().replace(/\.0$/, '') || '';
          } else {
            // For other cells, attempt to get the underlying value directly.
            // ExcelJS might return objects for dates, formulas, rich text, etc.
            // We are interested in the result of the cell's calculation or its simple value.
            if (cell.value !== null && cell.value !== undefined) {
                if (typeof cell.value === 'object' && 'result' in cell.value && cell.value.result !== undefined) {
                    // This handles formula results primarily
                    rowData[finalHeaderName] = cell.value.result;
                } else if (typeof cell.value === 'object' && 'text' in cell.value && typeof cell.value.text === 'string' ) {
                    // This handles rich text by taking the plain text version
                    rowData[finalHeaderName] = cell.value.text;
                } else if (cell.value instanceof Date) {
                    rowData[finalHeaderName] = cell.value.toISOString();
                }
                 else {
                    rowData[finalHeaderName] = cell.value;
                }
            } else {
                 rowData[finalHeaderName] = null; // Or undefined, depending on desired output for empty cells
            }
          }
          if (cell.value !== null && cell.value !== undefined) {
            hasValues = true;
          }
        }
      });
      if (hasValues) { // Only add row if it contains some data
        data.push(rowData);
      }
    }
  });

  return data;
}

// Example usage (for testing purposes, remove later):
/*
async function testExtractor() {
  const fs = require('fs');
  const path = require('path');
  try {
    const sampleFilePath = path.join(__dirname, '../../../../../../sample_report.xlsx'); // Adjust path as needed
    console.log(`Attempting to read: ${sampleFilePath}`);
    if (!fs.existsSync(sampleFilePath)) {
      console.error('Sample report file not found at path:', sampleFilePath);
      return;
    }
    const buffer = fs.readFileSync(sampleFilePath);
    console.log('File read into buffer. Length:', buffer.length);

    const extracted = await extractDataFromExcel(buffer);
    console.log('Extracted Data:', JSON.stringify(extracted, null, 2));
    console.log(`Number of records: ${extracted.length}`);

    if (extracted.length > 0) {
        console.log('First record:', extracted[0]);
        console.log('AWB Prefix of first record:', extracted[0]['awbprefix']);
        console.log('AWB Suffix of first record:', extracted[0]['awbsuffix']);
    }

  } catch (error) {
    console.error('Error during test extraction:', error);
  }
}

testExtractor();
*/ 