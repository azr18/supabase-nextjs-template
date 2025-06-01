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
  [key: string]: any; // Allows for flexible column names from the Excel report
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
  reconciledData?: any[]; // Will be more specific once reconciliation logic is defined
  generatedReportBuffer?: Buffer;
  error?: string;
} 