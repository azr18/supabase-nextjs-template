import ExcelJS from 'exceljs';
import { AwbData, CcaData } from '../types'; // Assuming types are defined

// TODO: Define a more specific type for reconciledData and summaryMetrics if possible
interface FlyDubaiReportData {
  awbData: AwbData[];
  ccaData: CcaData[];
  reconciledData: any[];
  summaryMetrics: any;
}

/**
 * Generates an Excel report for Fly Dubai reconciliation.
 * Based on the structure and formatting logic from app(1).py.
 *
 * Sheet Structures:
 *
 * 1. Summary Sheet:
 *    - Columns: Metric, Value
 *    - Metrics:
 *      - Invoice AWB Count
 *      - Total Invoice Amount (Net Due)
 *      - Total Invoice Charge Weight
 *      - Average Net Yield Rate
 *      - Total Report Amount (for Matched AWBs)
 *      - Difference (Report - Invoice)
 *
 * 2. Reconciliation Sheet:
 *    - Columns:
 *      - AWB Prefix
 *      - AWB Serial
 *      - Charge Weight (Invoice)
 *      - Charge Weight (Report)
 *      - Net Yield Rate (Invoice)
 *      - Net Yield Rate (Report)
 *      - Net Due (Invoice)
 *      - Net Due (Report)
 *      - Diff Net Due
 *      - Discrepancy Found (TRUE/FALSE)
 *    - Includes a 'Total' row for applicable numeric columns.
 *    - Conditional Formatting:
 *      - Highlight rows where 'Discrepancy Found' is TRUE (e.g., Yellow fill).
 *      - Highlight specific cells with mismatches:
 *        - Charge Weight (Invoice) vs Charge Weight (Report) (e.g., Light Red/Orange fill if different and both are numbers).
 *        - Net Yield Rate (Invoice) vs Net Yield Rate (Report) (e.g., Light Red/Orange fill if different and both are numbers).
 *        - Net Due (Invoice) vs Net Due (Report) (e.g., Light Red/Orange fill if different and both are numbers).
 *        - 'Diff Net Due' cell (e.g., Bright Red fill with thick black border if not zero).
 *    - Table Style: TableStyleMedium2
 *
 * 3. Invoices Sheet:
 *    - Columns (Order based on app(1).py, AWB Number split into Prefix/Serial):
 *      - AWB Prefix
 *      - AWB Serial
 *      - Flight Date (dd/mm/yyyy)
 *      - Origin
 *      - Destination
 *      - Charge Weight (numeric)
 *      - Net Yield Rate (numeric)
 *      - PP Freight Charge
 *      - PP Due Airline
 *      - CC Freight Charge
 *      - CC Due Agent
 *      - CC Due Airline
 *      - Disc.
 *      - Agency Comm.
 *      - Taxes
 *      - Others
 *      - Net Due for AWB
 *    - Includes a 'Total' row for applicable numeric columns.
 *    - Conditional Formatting:
 *      - Highlight entire rows in red if the 'Diff Net Due' for that AWB in the 'Reconciliation' sheet is non-zero.
 *    - Table Style: TableStyleMedium9
 *
 * 4. CCA Sheet:
 *    - Columns (Order based on app(1).py, AWB Number split into Prefix/Serial):
 *      - AWB Prefix
 *      - AWB Serial
 *      - CCA Ref. No
 *      - CCA Issue Date (dd/Mon e.g., 25MAR)
 *      - Origin
 *      - Destination
 *      - MOP Freight Charge
 *      - MOP Other Charge
 *      - Freight Charge
 *      - Due Airline
 *      - Due Agent
 *      - Disc.
 *      - Agency Comm.
 *      - Taxes
 *      - Others
 *      - Net Due for AWB (Sale Currency)
 *    - Includes a 'Total' row for applicable numeric columns.
 *    - Table Style: TableStyleMedium10
 *
 * General Formatting:
 *  - Autofit column widths for all sheets.
 *  - Numbers should be formatted appropriately (e.g., 2 decimal places for currency).
 */
export async function generateFlyDubaiReport(data: FlyDubaiReportData): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();

  // 1. Summary Sheet
  const summarySheet = workbook.addWorksheet('Summary');
  const summaryMetricsData = data.summaryMetrics || {};

  // Define headers and an order for summary metrics
  const summaryHeaders = ['Metric', 'Value'];
  const summaryMetricsOrder = [
    'Invoice AWB Count',
    'Total Invoice Amount (Net Due)',
    'Total Invoice Charge Weight',
    'Average Net Yield Rate',
    'Total Report Amount (for Matched AWBs)',
    'Difference (Report - Invoice)',
  ];

  summarySheet.columns = summaryHeaders.map(header => ({
    header: header,
    key: header.toLowerCase().replace(/\\s+/g, ''), // Create a key from the header
    width: header === 'Metric' ? 40 : 20, // Initial widths
  }));

  // Add rows from summaryMetrics, ensuring order and handling missing metrics
  summaryMetricsOrder.forEach(metricName => {
    summarySheet.addRow({
      metric: metricName,
      value: summaryMetricsData[metricName] ?? 'N/A', // Use N/A if metric is missing
    });
  });

  // Apply number formatting for currency and weights
  summarySheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) { // Skip header row
      const metricCell = row.getCell(1);
      const valueCell = row.getCell(2);
      const metricName = metricCell.value ? metricCell.value.toString() : '';

      if (metricName.includes('Amount') || metricName.includes('Difference')) {
        valueCell.numFmt = '#,##0.00';
      } else if (metricName.includes('Weight')) {
        valueCell.numFmt = '#,##0.00';
      } else if (metricName.includes('Rate')) {
        valueCell.numFmt = '0.00000'; // 5 decimal places for rate
      } else if (metricName.includes('Count')) {
        valueCell.numFmt = '0';
      }
    }
  });
  
  autofitColumns(summarySheet);


  // 2. Reconciliation Sheet
  const reconciliationSheet = workbook.addWorksheet('Reconciliation');
  const reconciledData = data.reconciledData || [];

  const reconciliationHeaders = [
    { header: 'AWB Prefix', key: 'awbPrefix', width: 15 },
    { header: 'AWB Serial', key: 'awbSerial', width: 15 },
    { header: 'Charge Weight (Invoice)', key: 'chargeWeightInvoice', width: 20, style: { numFmt: '#,##0.00' } },
    { header: 'Charge Weight (Report)', key: 'chargeWeightReport', width: 20, style: { numFmt: '#,##0.00' } },
    { header: 'Net Yield Rate (Invoice)', key: 'netYieldRateInvoice', width: 20, style: { numFmt: '0.00000' } },
    { header: 'Net Yield Rate (Report)', key: 'netYieldRateReport', width: 20, style: { numFmt: '0.00000' } },
    { header: 'Net Due (Invoice)', key: 'netDueInvoice', width: 20, style: { numFmt: '#,##0.00' } },
    { header: 'Net Due (Report)', key: 'netDueReport', width: 20, style: { numFmt: '#,##0.00' } },
    { header: 'Diff Net Due', key: 'diffNetDue', width: 15, style: { numFmt: '#,##0.00' } },
    { header: 'Discrepancy Found', key: 'discrepancyFound', width: 20 },
  ];
  reconciliationSheet.columns = reconciliationHeaders;

  // Add data rows
  reconciledData.forEach(row => {
    reconciliationSheet.addRow(row);
  });

  // Add 'Total' row if data exists
  if (reconciledData.length > 0) {
    const totalsRowRecon: any = { awbPrefix: 'Total' };
    const colsToSumRecon = [
      'chargeWeightInvoice', 'chargeWeightReport',
      'netDueInvoice', 'netDueReport', 'diffNetDue'
    ];
    colsToSumRecon.forEach(key => {
      totalsRowRecon[key] = { formula: `SUM(${reconciliationSheet.getColumn(key).letter}2:${reconciliationSheet.getColumn(key).letter}${reconciledData.length + 1})`, result: undefined };
    });
    reconciliationSheet.addRow(totalsRowRecon);
  }
  
  autofitColumns(reconciliationSheet);

  // Table Style
  if (reconciliationSheet.rowCount > 0) {
    const tableHeaders = reconciliationHeaders.map(h => ({ name: h.header, filterButton: true }));
    const tableRows = reconciledData.map((row: any) => reconciliationHeaders.map(h => row[h.key]));

    reconciliationSheet.addTable({
      name: 'ReconciliationTable',
      ref: `A1:${reconciliationSheet.getColumn(reconciliationHeaders.length).letter}${reconciliationSheet.rowCount}`,
      headerRow: true,
      totalsRow: reconciledData.length > 0 && reconciliationSheet.getRow(reconciliationSheet.rowCount).getCell(1).value === 'Total', // Check if last row is total
      style: {
        theme: 'TableStyleMedium2',
        showRowStripes: true,
      },
      columns: tableHeaders,
      rows: tableRows.slice(0, reconciledData.length), // Data rows, excluding the manually added total row for table definition
    });
  }

  // Conditional Formatting
  const yellowFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } }; // Yellow
  const orangeFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } }; // Light Red/Orange
  const brightRedFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } }; // Bright Red
  const blackThickBorder: Partial<ExcelJS.Borders> = {
    left: { style: 'thick', color: { argb: 'FF000000' } },
    right: { style: 'thick', color: { argb: 'FF000000' } },
    top: { style: 'thick', color: { argb: 'FF000000' } },
    bottom: { style: 'thick', color: { argb: 'FF000000' } },
  };

  // Iterate over data rows (excluding header and total row)
  for (let i = 2; i <= reconciledData.length + 1; i++) {
    const discrepancyFoundCell = reconciliationSheet.getCell(`J${i}`); // Column J for Discrepancy Found

    // 1. Highlight entire row if Discrepancy Found is TRUE
    if (discrepancyFoundCell.value === true || discrepancyFoundCell.value === 'TRUE') {
       for (let col = 1; col <= reconciliationHeaders.length; col++) {
        reconciliationSheet.getCell(i, col).fill = yellowFill;
      }
    }

    // 2. Highlight specific mismatching cells
    const cwInvCell = reconciliationSheet.getCell(`C${i}`);
    const cwRepCell = reconciliationSheet.getCell(`D${i}`);
    const nyrInvCell = reconciliationSheet.getCell(`E${i}`);
    const nyrRepCell = reconciliationSheet.getCell(`F${i}`);
    const ndInvCell = reconciliationSheet.getCell(`G${i}`);
    const ndRepCell = reconciliationSheet.getCell(`H${i}`);
    const diffNdCell = reconciliationSheet.getCell(`I${i}`);

    // Charge Weight Mismatch
    if (typeof cwInvCell.value === 'number' && typeof cwRepCell.value === 'number' && Math.abs(Number(cwInvCell.value) - Number(cwRepCell.value)) > 0.001) {
      cwInvCell.fill = orangeFill;
      cwRepCell.fill = orangeFill;
    }
     // Net Yield Rate Mismatch (using a small tolerance for float comparison)
    if (typeof nyrInvCell.value === 'number' && typeof nyrRepCell.value === 'number' && Math.abs(Number(nyrInvCell.value) - Number(nyrRepCell.value)) > 0.000001) {
      nyrInvCell.fill = orangeFill;
      nyrRepCell.fill = orangeFill;
    }
    // Net Due Mismatch (check Diff Net Due directly)
    if (typeof diffNdCell.value === 'number' && Math.abs(Number(diffNdCell.value)) > 0.001) {
      ndInvCell.fill = orangeFill;
      ndRepCell.fill = orangeFill;
      diffNdCell.fill = brightRedFill;
      diffNdCell.border = blackThickBorder;
    }
  }


  // 3. Invoices Sheet
  const invoicesSheet = workbook.addWorksheet('Invoices');
  const awbDataForSheet = data.awbData || []; // Use data.awbData

  const invoicesHeaders = [
    { header: 'AWB Prefix', key: 'awbPrefix', width: 15 },
    { header: 'AWB Serial', key: 'awbSerial', width: 15 },
    { header: 'Flight Date', key: 'flightDate', width: 15, style: { numFmt: 'dd/mm/yyyy' } }, // Assuming data is already Date object or parsable
    { header: 'Origin', key: 'origin', width: 10 },
    { header: 'Destination', key: 'destination', width: 15 },
    { header: 'Charge Weight', key: 'chargeWeight', width: 18, style: { numFmt: '#,##0.00' } },
    { header: 'Net Yield Rate', key: 'netYieldRate', width: 18, style: { numFmt: '0.00000' } },
    { header: 'PP Freight Charge', key: 'ppFreightCharge', width: 20, style: { numFmt: '#,##0.00' } },
    { header: 'PP Due Airline', key: 'ppDueAirline', width: 20, style: { numFmt: '#,##0.00' } },
    { header: 'CC Freight Charge', key: 'ccFreightCharge', width: 20, style: { numFmt: '#,##0.00' } },
    { header: 'CC Due Agent', key: 'ccDueAgent', width: 20, style: { numFmt: '#,##0.00' } },
    { header: 'CC Due Airline', key: 'ccDueAirline', width: 20, style: { numFmt: '#,##0.00' } },
    { header: 'Disc.', key: 'disc', width: 12, style: { numFmt: '#,##0.00' } },
    { header: 'Agency Comm.', key: 'agencyComm', width: 18, style: { numFmt: '#,##0.00' } },
    { header: 'Taxes', key: 'taxes', width: 12, style: { numFmt: '#,##0.00' } },
    { header: 'Others', key: 'others', width: 12, style: { numFmt: '#,##0.00' } },
    { header: 'Net Due for AWB', key: 'netDueForAwb', width: 20, style: { numFmt: '#,##0.00' } },
  ];
  invoicesSheet.columns = invoicesHeaders;

  // Map AwbData to the sheet, converting string numbers to actual numbers for summing and formatting
  const processedAwbData = awbDataForSheet.map(awb => ({
    ...awb,
    chargeWeight: parseFloat(awb.chargeWeight.replace('K', '')) || 0,
    netYieldRate: parseFloat(awb.netYieldRate) || 0,
    ppFreightCharge: parseFloat(awb.ppFreightCharge) || 0,
    ppDueAirline: parseFloat(awb.ppDueAirline) || 0,
    ccFreightCharge: parseFloat(awb.ccFreightCharge) || 0,
    ccDueAgent: parseFloat(awb.ccDueAgent) || 0,
    ccDueAirline: parseFloat(awb.ccDueAirline) || 0,
    disc: parseFloat(awb.disc) || 0,
    agencyComm: parseFloat(awb.agencyComm) || 0,
    taxes: parseFloat(awb.taxes) || 0,
    others: parseFloat(awb.others) || 0,
    netDueForAwb: parseFloat(awb.netDueForAwb) || 0,
    // flightDate needs to be handled carefully if it's a string. ExcelJS might need Date objects for date numFmt.
    // For now, assuming it might be a string that Excel can parse, or it's already a Date.
  }));

  processedAwbData.forEach(awb => {
    invoicesSheet.addRow(awb);
  });

  // Add 'Total' row for Invoices sheet
  if (processedAwbData.length > 0) {
    const totalsRowInvoices: any = { awbPrefix: 'Total' };
    const invoiceColsToSum = [
      'chargeWeight', 'ppFreightCharge', 'ppDueAirline', 'ccFreightCharge', 'ccDueAgent',
      'ccDueAirline', 'disc', 'agencyComm', 'taxes', 'others', 'netDueForAwb'
    ];
    invoiceColsToSum.forEach(key => {
      totalsRowInvoices[key] = { formula: `SUM(${invoicesSheet.getColumn(key).letter}2:${invoicesSheet.getColumn(key).letter}${processedAwbData.length + 1})`, result: undefined };
    });
    invoicesSheet.addRow(totalsRowInvoices);
  }

  autofitColumns(invoicesSheet);

  // Table Style for Invoices
  if (invoicesSheet.rowCount > 0) {
    const invTableHeaders = invoicesHeaders.map(h => ({ name: h.header, filterButton: true }));
    // Provide data rows for the table definition, excluding the manually added total row
    const invTableRows = processedAwbData.map((row: any) => invoicesHeaders.map(h => row[h.key]));

    invoicesSheet.addTable({
      name: 'InvoicesTable',
      ref: `A1:${invoicesSheet.getColumn(invoicesHeaders.length).letter}${invoicesSheet.rowCount}`,
      headerRow: true,
      totalsRow: processedAwbData.length > 0 && invoicesSheet.getRow(invoicesSheet.rowCount).getCell(1).value === 'Total',
      style: {
        theme: 'TableStyleMedium9',
        showRowStripes: true,
      },
      columns: invTableHeaders,
      rows: invTableRows,
    });
  }

  // Conditional Formatting for Invoices sheet (highlight rows with Net Due discrepancy)
  const redFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } }; // Bright Red
  const discrepancyAwbKeys = new Set(
    reconciledData
      .filter(r => r.diffNetDue && Math.abs(Number(r.diffNetDue)) > 0.001)
      .map(r => `${r.awbPrefix}-${r.awbSerial}`)
  );

  for (let i = 2; i <= processedAwbData.length + 1; i++) {
    const awbPrefixCell = invoicesSheet.getCell(`A${i}`);
    const awbSerialCell = invoicesSheet.getCell(`B${i}`);
    const currentAwbKey = `${awbPrefixCell.value}-${awbSerialCell.value}`;

    if (discrepancyAwbKeys.has(currentAwbKey)) {
      for (let col = 1; col <= invoicesHeaders.length; col++) {
        invoicesSheet.getCell(i, col).fill = redFill;
      }
    }
  }

  // 4. CCA Sheet
  const ccaSheet = workbook.addWorksheet('CCA');
  const ccaDataForSheet = data.ccaData || [];

  const ccaHeaders = [
    { header: 'AWB Prefix', key: 'awbPrefix', width: 15 },
    { header: 'AWB Serial', key: 'awbSerial', width: 15 },
    { header: 'CCA Ref. No', key: 'ccaRefNo', width: 15 },
    { header: 'CCA Issue Date', key: 'ccaIssueDate', width: 15, style: { numFmt: 'dd/mmm' } }, // Assuming format like 25MAR
    { header: 'Origin', key: 'origin', width: 10 },
    { header: 'Destination', key: 'destination', width: 15 },
    { header: 'MOP Freight Charge', key: 'mopFreightCharge', width: 20 },
    { header: 'MOP Other Charge', key: 'mopOtherCharge', width: 20 },
    { header: 'Freight Charge', key: 'freightCharge', width: 18, style: { numFmt: '#,##0.00' } },
    { header: 'Due Airline', key: 'dueAirline', width: 18, style: { numFmt: '#,##0.00' } },
    { header: 'Due Agent', key: 'dueAgent', width: 18, style: { numFmt: '#,##0.00' } },
    { header: 'Disc.', key: 'disc', width: 12, style: { numFmt: '#,##0.00' } },
    { header: 'Agency Comm.', key: 'agencyComm', width: 18, style: { numFmt: '#,##0.00' } },
    { header: 'Taxes', key: 'taxes', width: 12, style: { numFmt: '#,##0.00' } },
    { header: 'Others', key: 'others', width: 12, style: { numFmt: '#,##0.00' } },
    { header: 'Net Due for AWB (Sale Currency)', key: 'netDueForAwbSaleCurrency', width: 30, style: { numFmt: '#,##0.00' } },
  ];
  ccaSheet.columns = ccaHeaders;

  // Process CCA data for the sheet, ensuring numeric types where appropriate
  const processedCcaData = ccaDataForSheet.map(cca => {
    const attemptParseFloat = (val: string | number | undefined): number => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
            const num = parseFloat(val.replace(/[(,)]/g, m => (m === '(' || m === ')' ? (m === '(' ? '-' : '') : ''))); // Handle (123) as -123
            return isNaN(num) ? 0 : num; // Return 0 if val was non-numeric string like 'PP'
        }
        return 0;
    };
    return {
        ...cca,
        freightCharge: attemptParseFloat(cca.freightCharge),
        dueAirline: attemptParseFloat(cca.dueAirline),
        dueAgent: attemptParseFloat(cca.dueAgent),
        disc: attemptParseFloat(cca.disc),
        agencyComm: attemptParseFloat(cca.agencyComm),
        taxes: attemptParseFloat(cca.taxes),
        others: attemptParseFloat(cca.others),
        netDueForAwbSaleCurrency: attemptParseFloat(cca.netDueForAwbSaleCurrency),
    };
  });

  processedCcaData.forEach(cca => {
    ccaSheet.addRow(cca);
  });

  // Add 'Total' row for CCA sheet
  if (processedCcaData.length > 0) {
    const totalsRowCca: any = { ccaRefNo: 'Total' }; // Label in CCA Ref No column
    const ccaColsToSum = [
      'freightCharge', 'dueAirline', 'dueAgent', 'disc', 'agencyComm',
      'taxes', 'others', 'netDueForAwbSaleCurrency'
    ];
    ccaColsToSum.forEach(key => {
      totalsRowCca[key] = { formula: `SUM(${ccaSheet.getColumn(key).letter}2:${ccaSheet.getColumn(key).letter}${processedCcaData.length + 1})`, result: undefined };
    });
    ccaSheet.addRow(totalsRowCca);
  }

  autofitColumns(ccaSheet);

  // Table Style for CCA
  if (ccaSheet.rowCount > 0) {
    const ccaTableHeaders = ccaHeaders.map(h => ({ name: h.header, filterButton: true }));
    const ccaTableRows = processedCcaData.map((row: any) => ccaHeaders.map(h => row[h.key]));

    ccaSheet.addTable({
      name: 'CCATable',
      ref: `A1:${ccaSheet.getColumn(ccaHeaders.length).letter}${ccaSheet.rowCount}`,
      headerRow: true,
      totalsRow: processedCcaData.length > 0 && ccaSheet.getRow(ccaSheet.rowCount).getCell(ccaHeaders.findIndex(h => h.key === 'ccaRefNo') + 1).value === 'Total',
      style: {
        theme: 'TableStyleMedium10',
        showRowStripes: true,
      },
      columns: ccaTableHeaders,
      rows: ccaTableRows,
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer; // No cast needed now
}

// Helper function for adding tables and styling (can be expanded)
// async function addTableWithStyling(
//   worksheet: ExcelJS.Worksheet,
//   tableName: string,
//   ref: string,
//   styleName: string
// ) {
//   worksheet.addTable({
//     name: tableName,
//     ref: ref,
//     headerRow: true,
//     totalsRow: false, // Totals are usually manually added or part of the data
//     style: {
//       theme: styleName, // e.g., 'TableStyleMedium9'
//       showRowStripes: true,
//     },
//     // columns definition might be needed for specific formatting
//   });
// }

// Helper for autofitting columns
function autofitColumns(worksheet: ExcelJS.Worksheet) {
  worksheet.columns.forEach(column => {
    if (!column) return; // Skip if column is undefined

    let maxLength = 0;
    const headerValue = column.header;
    // Ensure headerValue is treated as a string or an array of strings
    const headerText = Array.isArray(headerValue) 
      ? headerValue.join(', ') 
      : (typeof headerValue === 'string' ? headerValue : '');
    maxLength = headerText.length;

    if (typeof column.eachCell === 'function') { // Check if eachCell is a function
      column.eachCell({ includeEmpty: true }, cell => {
        let cellLength = 0;
        if (cell.value) {
          if (cell.numFmt && typeof cell.value === 'number') {
            cellLength = cell.value.toString().length;
          } else {
            cellLength = cell.value.toString().length;
          }
        }
        
        if (cellLength > maxLength) {
          maxLength = cellLength;
        }
      });
    }
    // Add some padding, and ensure a minimum width
    column.width = Math.max(10, maxLength + 4);
  });
}

// Example usage (for testing, remove later)
// async function testReport() {
//   const dummyData: FlyDubaiReportData = {
//     awbData: [],
//     ccaData: [],
//     reconciledData: [],
//     summaryMetrics: {},
//   };
//   try {
//     const reportBuffer = await generateFlyDubaiReport(dummyData);
//     console.log('Report generated, buffer length:', reportBuffer.length);
//     // Here you would typically save the buffer to a file or send it in a response
//     // import fs from 'fs';
//     // fs.writeFileSync('flydubai_report.xlsx', reportBuffer);
//   } catch (error) {
//     console.error('Error generating report:', error);
//   }
// }

// testReport(); 