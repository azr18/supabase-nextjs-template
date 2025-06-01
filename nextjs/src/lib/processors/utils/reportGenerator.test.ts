import ExcelJS from 'exceljs';
import { generateFlyDubaiReport } from './reportGenerator';
import { AwbData, CcaData } from '../types';

// Mock data based on app(1).py structure and generateFlyDubaiReport expectations
const mockAwbData: AwbData[] = [
  {
    awbNumber: '141 1234567 8',
    awbSerialPart1: '141',
    awbSerialPart2: '12345678',
    flightDate: '01/01/2023',
    origin: 'TLV',
    destination: 'DXB',
    chargeWeight: '100.50',
    netYieldRate: '1.5',
    ppFreightCharge: '150.75',
    ppDueAirline: '140.00',
    ccFreightCharge: '0',
    ccDueAgent: '0',
    ccDueAirline: '0',
    disc: '10.00',
    agencyComm: '5.00',
    taxes: '2.50',
    others: '1.00',
    netDueForAwb: '124.25', // 150.75 - 10 - 5 + 2.5 + 1 - (150.75 - 140) = 124.25 (assuming pp due airline diff is not part of this)
    exchangeRate: '1.00000000',
  },
  {
    awbNumber: '141 8765432 1',
    awbSerialPart1: '141',
    awbSerialPart2: '87654321',
    flightDate: '02/01/2023',
    origin: 'TLV',
    destination: 'JFK',
    chargeWeight: '200.00',
    netYieldRate: '2.0',
    ppFreightCharge: '400.00',
    ppDueAirline: '380.00',
    ccFreightCharge: '0',
    ccDueAgent: '0',
    ccDueAirline: '0',
    disc: '20.00',
    agencyComm: '10.00',
    taxes: '5.00',
    others: '2.00',
    netDueForAwb: '357.00', // 400 - 20 - 10 + 5 + 2 = 377, let's assume this is the value after other calcs
    exchangeRate: '1.00000000',
  },
];

const mockCcaData: CcaData[] = [
  {
    ccaRefNo: 'CCA001',
    awbPrefix: '141',
    awbSerial: '12345678',
    ccaIssueDate: '05/JAN',
    origin: 'TLV',
    destination: 'DXB',
    mopFreightCharge: 'PP',
    mopOtherCharge: 'CC',
    freightCharge: -10.00,
    dueAirline: -8.00,
    dueAgent: 0,
    disc: -1.00,
    agencyComm: 0,
    taxes: -0.50,
    others: 0,
    netDueForAwbSaleCurrency: -7.50,
  },
];

const mockReconciledData = [
  {
    awbPrefix: '141',
    awbSerial: '12345678',
    chargeWeightInvoice: 100.50,
    chargeWeightReport: 100.50,
    netYieldRateInvoice: 1.5,
    netYieldRateReport: 1.5,
    netDueInvoice: 124.25,
    netDueReport: 120.00, // Discrepancy
    diffNetDue: -4.25,
    discrepancyFound: true,
  },
  {
    awbPrefix: '141',
    awbSerial: '87654321',
    chargeWeightInvoice: 200.00,
    chargeWeightReport: 200.00,
    netYieldRateInvoice: 2.0,
    netYieldRateReport: 2.0,
    netDueInvoice: 357.00,
    netDueReport: 357.00,
    diffNetDue: 0.00,
    discrepancyFound: false,
  },
];

const mockSummaryMetrics = {
  'Invoice AWB Count': 2,
  'Total Invoice Amount (Net Due)': 124.25 + 357.00,
  'Total Invoice Charge Weight': 100.50 + 200.00,
  'Average Net Yield Rate': (124.25 + 357.00) / (100.50 + 200.00),
  'Total Report Amount (for Matched AWBs)': 120.00 + 357.00,
  'Difference (Report - Invoice)': (120.00 + 357.00) - (124.25 + 357.00),
};

describe('generateFlyDubaiReport', () => {
  it('should generate an Excel buffer with correct sheets, headers, and data', async () => {
    const reportBuffer = await generateFlyDubaiReport({
      awbData: mockAwbData,
      ccaData: mockCcaData,
      reconciledData: mockReconciledData,
      summaryMetrics: mockSummaryMetrics,
    });

    expect(reportBuffer).toBeInstanceOf(Buffer); // Or Uint8Array if ExcelJS.Buffer is Uint8Array

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(reportBuffer);

    // 1. Check Sheet Names
    expect(workbook.worksheets.map(ws => ws.name)).toEqual([
      'Summary',
      'Reconciliation',
      'Invoices',
      'CCA',
    ]);

    // 2. Summary Sheet Checks
    const summarySheet = workbook.getWorksheet('Summary');
    expect(summarySheet).toBeDefined();
    if (!summarySheet) return;

    const expectedSummaryHeaders = ['Metric', 'Value'];
    const actualSummaryHeaders = summarySheet.getRow(1).values as string[];
    // Note: ExcelJS might add an undefined first element to `values` array for rows
    expect(actualSummaryHeaders.filter(h => h)).toEqual(expectedSummaryHeaders);

    // Check some key metrics
    let invoiceAwbCount = 0;
    let totalInvoiceAmount = 0;
    summarySheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Skip header
        const metric = row.getCell(1).value as string;
        const value = row.getCell(2).value as number;
        if (metric === 'Invoice AWB Count') invoiceAwbCount = value;
        if (metric === 'Total Invoice Amount (Net Due)') totalInvoiceAmount = value;
      }
    });
    expect(invoiceAwbCount).toBe(mockSummaryMetrics['Invoice AWB Count']);
    expect(totalInvoiceAmount).toBeCloseTo(mockSummaryMetrics['Total Invoice Amount (Net Due)']);

    // 3. Reconciliation Sheet Checks
    const reconciliationSheet = workbook.getWorksheet('Reconciliation');
    expect(reconciliationSheet).toBeDefined();
    if (!reconciliationSheet) return;
    const expectedReconHeaders = [
        'AWB Prefix', 'AWB Serial', 'Charge Weight (Invoice)', 'Charge Weight (Report)',
        'Net Yield Rate (Invoice)', 'Net Yield Rate (Report)', 'Net Due (Invoice)',
        'Net Due (Report)', 'Diff Net Due', 'Discrepancy Found'
    ];
    const actualReconHeaders = reconciliationSheet.getRow(1).values as string[];
    expect(actualReconHeaders.filter(h => h)).toEqual(expectedReconHeaders);
    expect(reconciliationSheet.rowCount).toBe(mockReconciledData.length + 1 + 1); // data + header + total row
    expect(reconciliationSheet.getCell('J2').value).toBe(true); // First data row discrepancy
    expect(reconciliationSheet.getCell('J3').value).toBe(false); // Second data row no discrepancy


    // 4. Invoices Sheet Checks
    const invoicesSheet = workbook.getWorksheet('Invoices');
    expect(invoicesSheet).toBeDefined();
    if (!invoicesSheet) return;
    const expectedInvoiceHeaders = [
        'AWB Prefix', 'AWB Serial', 'Flight Date', 'Origin', 'Destination',
        'Charge Weight', 'Net Yield Rate', 'PP Freight Charge', 'PP Due Airline',
        'CC Freight Charge', 'CC Due Agent', 'CC Due Airline', 'Disc.',
        'Agency Comm.', 'Taxes', 'Others', 'Net Due for AWB'
    ];
    const actualInvoiceHeaders = invoicesSheet.getRow(1).values as string[];
    expect(actualInvoiceHeaders.filter(h => h)).toEqual(expectedInvoiceHeaders);
    expect(invoicesSheet.rowCount).toBe(mockAwbData.length + 1 + 1); // data + header + total
    expect(invoicesSheet.getCell('A2').value).toBe(mockAwbData[0].awbSerialPart1);
    expect(invoicesSheet.getCell('Q2').value).toBe(parseFloat(mockAwbData[0].netDueForAwb));
    // Check total for Net Due for AWB
    const totalNetDueInvoiceSheet = invoicesSheet.getCell(`Q${mockAwbData.length + 2}`).value;
    const expectedTotalNetDueInvoiceSheet = mockAwbData.reduce((sum, awb) => sum + parseFloat(awb.netDueForAwb), 0);
    expect(totalNetDueInvoiceSheet).toBeCloseTo(expectedTotalNetDueInvoiceSheet);


    // 5. CCA Sheet Checks
    const ccaSheet = workbook.getWorksheet('CCA');
    expect(ccaSheet).toBeDefined();
    if (!ccaSheet) return;
    const expectedCcaHeaders = [
        'AWB Prefix', 'AWB Serial', 'CCA Ref. No', 'CCA Issue Date', 'Origin', 'Destination',
        'MOP Freight Charge', 'MOP Other Charge', 'Freight Charge', 'Due Airline',
        'Due Agent', 'Disc.', 'Agency Comm.', 'Taxes', 'Others', 'Net Due for AWB (Sale Currency)'
    ];
    const actualCcaHeaders = ccaSheet.getRow(1).values as string[];
    expect(actualCcaHeaders.filter(h => h)).toEqual(expectedCcaHeaders);
    expect(ccaSheet.rowCount).toBe(mockCcaData.length + 1 + 1); // data + header + total
    expect(ccaSheet.getCell('C2').value).toBe(mockCcaData[0].ccaRefNo);
    expect(ccaSheet.getCell('P2').value).toBe(mockCcaData[0].netDueForAwbSaleCurrency);
    // Check total for Net Due for AWB (Sale Currency)
    const totalNetDueCcaSheet = ccaSheet.getCell(`P${mockCcaData.length + 2}`).value;
    const expectedTotalNetDueCcaSheet = mockCcaData.reduce((sum, cca) => sum + Number(cca.netDueForAwbSaleCurrency), 0);
    expect(totalNetDueCcaSheet).toBeCloseTo(expectedTotalNetDueCcaSheet);

    // TODO: Add more specific data checks, formatting checks (if feasible)
    // For example, check number formats, date formats, and potentially table styles if API allows.
    // Checking conditional formatting is tricky and might require visual inspection or more advanced parsing.
  });

  it('should handle empty data inputs gracefully', async () => {
    const reportBuffer = await generateFlyDubaiReport({
      awbData: [],
      ccaData: [],
      reconciledData: [],
      summaryMetrics: {
        'Invoice AWB Count': 0,
        'Total Invoice Amount (Net Due)': 0,
        'Total Invoice Charge Weight': 0,
        'Average Net Yield Rate': 0,
        'Total Report Amount (for Matched AWBs)': 0,
        'Difference (Report - Invoice)': 0,
      },
    });

    expect(reportBuffer).toBeInstanceOf(Buffer);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(reportBuffer);

    expect(workbook.worksheets.map(ws => ws.name)).toEqual([
      'Summary',
      'Reconciliation',
      'Invoices',
      'CCA',
    ]);

    const summarySheet = workbook.getWorksheet('Summary');
    if (!summarySheet) throw new Error("Summary sheet not found");
    expect(summarySheet.getCell('B2').value).toBe(0); // Invoice AWB Count

    const reconciliationSheet = workbook.getWorksheet('Reconciliation');
    if (!reconciliationSheet) throw new Error("Reconciliation sheet not found");
    expect(reconciliationSheet.rowCount).toBe(1); // Header only

    const invoicesSheet = workbook.getWorksheet('Invoices');
    if (!invoicesSheet) throw new Error("Invoices sheet not found");
    expect(invoicesSheet.rowCount).toBe(1); // Header only

    const ccaSheet = workbook.getWorksheet('CCA');
    if (!ccaSheet) throw new Error("CCA sheet not found");
    expect(ccaSheet.rowCount).toBe(1); // Header only
  });
}); 