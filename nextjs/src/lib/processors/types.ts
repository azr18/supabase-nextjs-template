export interface AwbData {
  awbNumber: string;
  awbSerialPart1: string;
  awbSerialPart2: string;
  flightDate: string;
  origin: string;
  destination: string;
  chargeWeight: string; // e.g., "560.00K"
  netYieldRate: string; // e.g., "1.23"
  ppFreightCharge: string;
  ppDueAirline: string;
  ccFreightCharge: string;
  ccDueAgent: string;
  ccDueAirline: string;
  disc: string;
  agencyComm: string;
  taxes: string;
  others: string;
  netDueForAwb: string;
  exchangeRate: string;
}

export interface PageTextItem {
  x: number;
  y: number;
  str: string;
  dir: string;
  width: number;
  height: number;
  fontName: string;
}

export interface PageTextData {
  pageNumber: number;
  lines: string[];
  items?: PageTextItem[];
}

export interface CcaData {
  ccaRefNo: string;
  awbPrefix: string;
  awbSerial: string;
  ccaIssueDate: string;
  origin: string;
  destination: string;
  mopFreightCharge: string;
  mopOtherCharge: string;
  freightCharge: string | number; // Can be string like "PP" or numeric after cleaning
  dueAirline: string | number;
  dueAgent: string | number;
  disc: string | number;
  agencyComm: string | number;
  taxes: string | number;
  others: string | number;
  netDueForAwbSaleCurrency: string | number;
}

export interface ProcessedReportData {
  [key: string]: string | number | undefined; // Allows for flexible column names from the Excel report
}

export type AirlineType = 'flydubai' | 'tap' | 'philippines' | 'airindia' | 'elal';

export interface ReconciliationInput {
  invoiceFileBuffer: Buffer;
  reportFileBuffer: Buffer;
  airlineType: AirlineType;
}

export interface ReconciliationResult {
  success: boolean;
  processedInvoiceData?: {
    awb: AwbData[];
    cca: CcaData[];
  };
  processedReportData?: ProcessedReportData[];
  reconciledData?: ReconciledDataEntry[];
  generatedReportBuffer?: Buffer;
  error?: string;
}

export interface ReconciledDataEntry {
  'AWB Prefix': string;
  'AWB Serial': string;
  'Charge Weight (Invoice)': number | undefined;
  'Charge Weight (Report)': number | undefined;
  'Net Yield Rate (Invoice)': number | undefined;
  'Net Yield Rate (Report)': number | undefined;
  'Net Due (Invoice)': number | undefined;
  'Net Due (Report)': number | null | undefined;
  'Diff Net Due': number | null | undefined;
  'Discrepancy Found': boolean;
  // Legacy field names for backward compatibility
  awbPrefix: string;
  awbSerial: string;
  chargeWeightInvoice: number | undefined;
  chargeWeightReport: number | undefined;
  netYieldRateInvoice: number | undefined;
  netYieldRateReport: number | undefined;
  netDueInvoice: number | undefined;
  netDueReport: number | undefined;
  diffNetDue: number | undefined;
  discrepancyFound: boolean;
}

export interface SummaryMetrics {
  [key: string]: number;
} 