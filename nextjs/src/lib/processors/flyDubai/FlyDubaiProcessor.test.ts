import { FlyDubaiProcessor } from './FlyDubaiProcessor';
import { PageTextData, AwbData, CcaData, ReconciliationInput, ProcessedReportData, ReconciliationResult } from '../types';
import * as pdfExtractor from '../utils/pdfExtractor';
import * as excelExtractor from '../utils/excelExtractor';

// Mock the utility functions
jest.mock('../utils/pdfExtractor');
jest.mock('../utils/excelExtractor');

const mockedExtractTextWithLayout = pdfExtractor.extractTextWithLayout as jest.MockedFunction<typeof pdfExtractor.extractTextWithLayout>;
const mockedExtractDataFromExcel = excelExtractor.extractDataFromExcel as jest.MockedFunction<typeof excelExtractor.extractDataFromExcel>;

describe('FlyDubaiProcessor', () => {
  let processor: FlyDubaiProcessor;

  beforeEach(() => {
    // FlyDubaiProcessor has no constructor args and its methods use static regexes
    // or process passed-in data. Instantiation is simple.
    processor = new FlyDubaiProcessor();
  });

  describe('_extractAwbDataFromFlyDubaiPdf', () => {
    it('should correctly extract a single AWB entry', () => {
      const samplePageText: PageTextData[] = [
        {
          pageNumber: 1,
          lines: [
            'Invoice Header etc.',
            '141 1234567 8 TLV DXB 100.00K 10.00 20.00 0.00 0.00 30.00 0.00 0.00 5.00 0.00 55.00 1.00000000 55.00',
            '01JAN22 DXB FZ 1234 1.23',
            'Some other irrelevant line'
          ]
        }
      ];
      const expectedAwbData: AwbData[] = [
        {
          awbNumber: '141 1234567 8',
          awbSerialPart1: '1234567',
          awbSerialPart2: '8',
          flightDate: '01JAN22',
          origin: 'TLV',
          destination: 'DXB',
          chargeWeight: '100.00K',
          netYieldRate: '1.23',
          ppFreightCharge: '10.00',
          ppDueAirline: '20.00',
          ccFreightCharge: '0.00',
          ccDueAgent: '0.00',
          ccDueAirline: '30.00',
          disc: '0.00',
          agencyComm: '0.00',
          taxes: '5.00',
          others: '0.00',
          netDueForAwb: '55.00',
          exchangeRate: '1.00000000',
        }
      ];
      expect((processor as any)._extractAwbDataFromFlyDubaiPdf(samplePageText)).toEqual(expectedAwbData);
    });

    it('should correctly extract multiple AWB entries across multiple pages', () => {
      const samplePageText: PageTextData[] = [
        {
          pageNumber: 1,
          lines: [
            '141 1111111 1 TLV AAA 50.00K 5.00 10.00 0.00 0.00 15.00 0.00 0.00 2.00 0.00 27.00 1.00000000 27.00',
            '02FEB22 AAA FZ 5678 0.50'
          ]
        },
        {
          pageNumber: 2,
          lines: [
            'Some random line on page 2',
            '141 2222222 2 TLV BBB 75.00K 7.00 12.00 0.00 0.00 17.00 0.00 0.00 3.00 0.00 32.00 1.00000000 32.00',
            '03MAR22 BBB FZ 9012 0.75',
          ]
        }
      ];
      const expectedAwbData: AwbData[] = [
        {
          awbNumber: '141 1111111 1',
          awbSerialPart1: '1111111',
          awbSerialPart2: '1',
          flightDate: '02FEB22',
          origin: 'TLV',
          destination: 'AAA',
          chargeWeight: '50.00K',
          netYieldRate: '0.50',
          ppFreightCharge: '5.00',
          ppDueAirline: '10.00',
          ccFreightCharge: '0.00',
          ccDueAgent: '0.00',
          ccDueAirline: '15.00',
          disc: '0.00',
          agencyComm: '0.00',
          taxes: '2.00',
          others: '0.00',
          netDueForAwb: '27.00',
          exchangeRate: '1.00000000',
        },
        {
          awbNumber: '141 2222222 2',
          awbSerialPart1: '2222222',
          awbSerialPart2: '2',
          flightDate: '03MAR22',
          origin: 'TLV',
          destination: 'BBB',
          chargeWeight: '75.00K',
          netYieldRate: '0.75',
          ppFreightCharge: '7.00',
          ppDueAirline: '12.00',
          ccFreightCharge: '0.00',
          ccDueAgent: '0.00',
          ccDueAirline: '17.00',
          disc: '0.00',
          agencyComm: '0.00',
          taxes: '3.00',
          others: '0.00',
          netDueForAwb: '32.00',
          exchangeRate: '1.00000000',
        }
      ];
      expect((processor as any)._extractAwbDataFromFlyDubaiPdf(samplePageText)).toEqual(expectedAwbData);
    });

    it('should stop processing AWB data when CCA section header is found', () => {
      const samplePageText: PageTextData[] = [
        {
          pageNumber: 1, // AWB data expected
          lines: [
            '141 3333333 3 TLV CCC 20.00K 2.00 4.00 0.00 0.00 6.00 0.00 0.00 1.00 0.00 9.00 1.00000000 9.00',
            '04APR22 CCC FZ 1122 0.20'
          ]
        },
        {
          pageNumber: 2, // CCA header page, AWB data on this page and after should be ignored
          lines: [
            'Some line before header',
            'Section B: CCA Details',
            '141 4444444 4 TLV DDD 30.00K 3.00 5.00 0.00 0.00 7.00 0.00 0.00 1.00 0.00 10.00 1.00000000 10.00',
            '05MAY22 DDD FZ 3344 0.30' 
          ]
        },
        {
            pageNumber: 3, // AWB data on this page should be ignored
            lines: [
              '141 5555555 5 TLV EEE 40.00K 4.00 6.00 0.00 0.00 8.00 0.00 0.00 1.00 0.00 11.00 1.00000000 11.00',
              '06JUN22 EEE FZ 5566 0.40'
            ]
        }
      ];
      const expectedAwbData: AwbData[] = [
        {
          awbNumber: '141 3333333 3',
          awbSerialPart1: '3333333',
          awbSerialPart2: '3',
          flightDate: '04APR22',
          origin: 'TLV',
          destination: 'CCC',
          chargeWeight: '20.00K',
          netYieldRate: '0.20',
          ppFreightCharge: '2.00',
          ppDueAirline: '4.00',
          ccFreightCharge: '0.00',
          ccDueAgent: '0.00',
          ccDueAirline: '6.00',
          disc: '0.00',
          agencyComm: '0.00',
          taxes: '1.00',
          others: '0.00',
          netDueForAwb: '9.00',
          exchangeRate: '1.00000000',
        }
      ];
      expect((processor as any)._extractAwbDataFromFlyDubaiPdf(samplePageText)).toEqual(expectedAwbData);
    });

    it('should skip lines not matching AWB pattern and handle missing date/rate line', () => {
      const samplePageText: PageTextData[] = [
        {
          pageNumber: 1,
          lines: [
            'This is not an AWB line.',
            '141 6666666 6 TLV FFF 10.00K 1.00 2.00 0.00 0.00 3.00 0.00 0.00 0.50 0.00 5.50 1.00000000 5.50',
            // Missing date/rate line here, so the above AWB should not be extracted
            'Another non-AWB line.',
            '141 7777777 7 TLV GGG 25.00K 2.50 3.50 0.00 0.00 4.50 0.00 0.00 0.75 0.00 6.75 1.00000000 6.75',
            '07JUL22 GGG FZ 7788 0.25' // This AWB is valid
          ]
        }
      ];
      const expectedAwbData: AwbData[] = [
        {
          awbNumber: '141 7777777 7',
          awbSerialPart1: '7777777',
          awbSerialPart2: '7',
          flightDate: '07JUL22',
          origin: 'TLV',
          destination: 'GGG',
          chargeWeight: '25.00K',
          netYieldRate: '0.25',
          ppFreightCharge: '2.50',
          ppDueAirline: '3.50',
          ccFreightCharge: '0.00',
          ccDueAgent: '0.00',
          ccDueAirline: '4.50',
          disc: '0.00',
          agencyComm: '0.00',
          taxes: '0.75',
          others: '0.00',
          netDueForAwb: '6.75',
          exchangeRate: '1.00000000',
        }
      ];
      expect((processor as any)._extractAwbDataFromFlyDubaiPdf(samplePageText)).toEqual(expectedAwbData);
    });

     it('should handle AWB line with no subsequent line for date/rate', () => {
      const samplePageText: PageTextData[] = [
        {
          pageNumber: 1,
          lines: [
            '141 8888888 8 TLV HHH 10.00K 1.00 2.00 0.00 0.00 3.00 0.00 0.00 0.50 0.00 5.50 1.00000000 5.50'
            // No second line at all
          ]
        }
      ];
      const expectedAwbData: AwbData[] = []; // Should not extract anything
      expect((processor as any)._extractAwbDataFromFlyDubaiPdf(samplePageText)).toEqual(expectedAwbData);
    });

    it('should correctly parse values with commas as decimal separators (and clean them)', () => {
        const samplePageText: PageTextData[] = [
          {
            pageNumber: 1,
            lines: [
              '141 9999999 9 TLV III 150,50K 10,50 20,75 0,00 0,00 30,25 0,00 0,00 5,10 0,00 55,85 1.00000000 55,85',
              '08AUG22 III FZ 1234 1,80',
            ]
          }
        ];
        const expectedAwbData: AwbData[] = [
          {
            awbNumber: '141 9999999 9',
            awbSerialPart1: '9999999',
            awbSerialPart2: '9',
            flightDate: '08AUG22',
            origin: 'TLV',
            destination: 'III',
            chargeWeight: '150.50K', // Stored as string, but regex captures it correctly, cleaning happens later
            netYieldRate: '1.80',
            ppFreightCharge: '10.50',
            ppDueAirline: '20.75',
            ccFreightCharge: '0.00',
            ccDueAgent: '0.00',
            ccDueAirline: '30.25',
            disc: '0.00',
            agencyComm: '0.00',
            taxes: '5.10',
            others: '0.00',
            netDueForAwb: '55.85',
            exchangeRate: '1.00000000',
          }
        ];
        // Note: The _extractAwbDataFromFlyDubaiPdf method itself does the .replace(/,/g, '.') for matched groups.
        expect((processor as any)._extractAwbDataFromFlyDubaiPdf(samplePageText)).toEqual(expectedAwbData);
      });

  });

  describe('_extractCcaDataFromFlyDubaiPdf', () => {
    it('should correctly extract a single CCA entry', () => {
      const samplePageText: PageTextData[] = [
        {
          pageNumber: 1, lines: ['Some AWB data page'] 
        },
        {
          pageNumber: 2, 
          lines: [
            'Page Header',
            'Section B: CCA Details',
            'Some introductory text for CCA section.',
            '12345 141 1234567 8 TLV PP CC (100.00) (20.00) (0.00) (5.00) (0.00) (3.00) (0.00) (128.00) 1.00 (128.00)',
            '01JAN DXB Other text after values'
          ]
        }
      ];
      const expectedCcaData: CcaData[] = [
        {
          ccaRefNo: '12345',
          awbPrefix: '141',
          awbSerial: '12345678',
          ccaIssueDate: '01JAN',
          origin: 'TLV',
          destination: 'DXB',
          mopFreightCharge: 'PP',
          mopOtherCharge: 'CC',
          freightCharge: -100.00,
          dueAirline: -20.00,
          dueAgent: 0.00,
          disc: -5.00,
          agencyComm: 0.00,
          taxes: -3.00,
          others: 0.00,
          netDueForAwbSaleCurrency: -128.00,
        }
      ];
      expect((processor as any)._extractCcaDataFromFlyDubaiPdf(samplePageText)).toEqual(expectedCcaData);
    });

    it('should correctly extract multiple CCA entries', () => {
      const samplePageText: PageTextData[] = [
        {
          pageNumber: 1, 
          lines: [
            'Section B: CCA Details',
            'First entry: 54321 141 9876543 2 JFK CC PP 50.00 10.00 0.00 2.00 0.00 1.00 0.00 63.00 1.00 63.00',
            '15FEB MIA Details for first',
            'Followed by: 11223 141 1122334 5 LAX PP PP (25.00) (5.00) 0.00 0.00 0.00 0.00 0.00 (30.00) 1.00 (30.00)',
            '20MAR SFO Details for second'
          ]
        }
      ];
      const expectedCcaData: CcaData[] = [
        {
          ccaRefNo: '54321',
          awbPrefix: '141',
          awbSerial: '98765432',
          ccaIssueDate: '15FEB',
          origin: 'JFK',
          destination: 'MIA',
          mopFreightCharge: 'CC',
          mopOtherCharge: 'PP',
          freightCharge: 50.00,
          dueAirline: 10.00,
          dueAgent: 0.00,
          disc: 2.00,
          agencyComm: 0.00,
          taxes: 1.00,
          others: 0.00,
          netDueForAwbSaleCurrency: 63.00,
        },
        {
          ccaRefNo: '11223',
          awbPrefix: '141',
          awbSerial: '11223345',
          ccaIssueDate: '20MAR',
          origin: 'LAX',
          destination: 'SFO',
          mopFreightCharge: 'PP',
          mopOtherCharge: 'PP',
          freightCharge: -25.00,
          dueAirline: -5.00,
          dueAgent: 0.00,
          disc: 0.00,
          agencyComm: 0.00,
          taxes: 0.00,
          others: 0.00,
          netDueForAwbSaleCurrency: -30.00,
        }
      ];
      expect((processor as any)._extractCcaDataFromFlyDubaiPdf(samplePageText)).toEqual(expectedCcaData);
    });

    it('should return empty array if CCA section header is not found', () => {
      const samplePageText: PageTextData[] = [
        {
          pageNumber: 1, 
          lines: [
            'No CCA Header here',
            '12345 141 1234567 8 TLV PP CC (100.00) (20.00) (0.00) (5.00) (0.00) (3.00) (0.00) (128.00) 1.00 (128.00)',
            '01JAN DXB Other text after values'
          ]
        }
      ];
      expect((processor as any)._extractCcaDataFromFlyDubaiPdf(samplePageText)).toEqual([]);
    });

    it('should return empty array if CCA section exists but no lines match CCA pattern', () => {
      const samplePageText: PageTextData[] = [
        {
          pageNumber: 1, 
          lines: [
            'Section B: CCA Details',
            'This line does not match the CCA block pattern.',
            'Neither does this one.'
          ]
        }
      ];
      expect((processor as any)._extractCcaDataFromFlyDubaiPdf(samplePageText)).toEqual([]);
    });

    it('should correctly parse CCA with mixed positive and parenthesized negative values', () => {
        const samplePageText: PageTextData[] = [
          {
            pageNumber: 1, 
            lines: [
              'Section B: CCA Details',
              'REGULAR 67890 141 6789012 3 ORD PP PP 200.00 (50.25) 10.10 (5.05) 0.00 15.00 2.50 162.30 1.00 162.30',
              '10OCT JFK Comments here'
            ]
          }
        ];
        const expectedCcaData: CcaData[] = [
          {
            ccaRefNo: '67890',
            awbPrefix: '141',
            awbSerial: '67890123',
            ccaIssueDate: '10OCT',
            origin: 'ORD',
            destination: 'JFK',
            mopFreightCharge: 'PP',
            mopOtherCharge: 'PP',
            freightCharge: 200.00,
            dueAirline: -50.25,
            dueAgent: 10.10,
            disc: -5.05,
            agencyComm: 0.00,
            taxes: 15.00,
            others: 2.50,
            netDueForAwbSaleCurrency: 162.30,
          }
        ];
        expect((processor as any)._extractCcaDataFromFlyDubaiPdf(samplePageText)).toEqual(expectedCcaData);
      });

  });

  describe('_cleanCurrencyValue', () => {
    // Test cases for the currency cleaning utility
    it('should handle positive numbers', () => {
      expect((processor as any)._cleanCurrencyValue('123.45')).toBe(123.45);
      expect((processor as any)._cleanCurrencyValue('1,234.56')).toBe(1234.56);
    });

    it('should handle negative numbers in parentheses', () => {
      expect((processor as any)._cleanCurrencyValue('(123.45)')).toBe(-123.45);
      expect((processor as any)._cleanCurrencyValue('(1,234.56)')).toBe(-1234.56);
    });
    
    it('should handle negative numbers with missing closing parenthesis', () => {
      expect((processor as any)._cleanCurrencyValue('(123.45')).toBe(-123.45);
    });

    it('should return 0.0 for "()" or empty string after cleaning', () => {
      expect((processor as any)._cleanCurrencyValue('()')).toBe(0.0);
      expect((processor as any)._cleanCurrencyValue(' ')).toBe(0.0); // Empty string after trim
    });

    it('should return original string for non-numeric text like PP/CC', () => {
      expect((processor as any)._cleanCurrencyValue('PP')).toBe('PP');
      expect((processor as any)._cleanCurrencyValue('CC')).toBe('CC');
    });

    it('should return empty string if input is undefined or not a string and not numeric-like', () => {
      expect((processor as any)._cleanCurrencyValue(undefined)).toBe('');
    });
  });

  describe('process', () => {
    const mockInvoiceBuffer = Buffer.from('mock-invoice-pdf-content');
    const mockReportBuffer = Buffer.from('mock-report-excel-content');

    const basicInput: ReconciliationInput = {
      invoiceFileBuffer: mockInvoiceBuffer,
      reportFileBuffer: mockReportBuffer,
      airlineType: 'flydubai',
    };

    // Reset mocks before each test in this suite
    beforeEach(() => {
      mockedExtractTextWithLayout.mockReset();
      mockedExtractDataFromExcel.mockReset();
    });

    it('should correctly clean AWB data and report data, and perform basic reconciliation', async () => {
      // Mock extracted data
      const rawPdfPages: PageTextData[] = [
        {
          pageNumber: 1,
          lines: [
            '141 1234567 8 TLV DXB 100.50K 10.50 20.00 0.00 0.00 30.00 0.00 0.00 5.00 0.00 55.50 1.00000000 55.50',
            '01JAN22 DXB FZ 1234 1.2345',
          ]
        }
      ];
      mockedExtractTextWithLayout.mockResolvedValue(rawPdfPages);

      const rawExcelData: ProcessedReportData[] = [
        { 'awbprefix': '141', 'awbsuffix': '12345678', 'chargewt': '100.5', 'frt_cost_rate': '1.2345', 'total_cost': '55.50' },
      ];
      mockedExtractDataFromExcel.mockResolvedValue(rawExcelData);

      const result = await processor.process(basicInput);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();

      // Test AWB Cleaning
      expect(result.processedInvoiceData?.awb).toHaveLength(1);
      const cleanedAwb = result.processedInvoiceData!.awb[0];
      expect(cleanedAwb.flightDate).toBe('2022-01-01'); // from 01JAN22
      expect(cleanedAwb.chargeWeight).toBe('100.5'); // K removed, to string
      expect(cleanedAwb.netYieldRate).toBe('1.2345');
      expect(cleanedAwb.netDueForAwb).toBe('55.5');

      // Test Report Data Cleaning
      expect(result.processedReportData).toHaveLength(1);
      const cleanedReport = result.processedReportData![0];
      expect(cleanedReport['awbprefix']).toBe('141');
      expect(cleanedReport['awbsuffix']).toBe('12345678');
      expect(cleanedReport['chargewt']).toBe(100.5);
      expect(cleanedReport['frt_cost_rate']).toBe(1.2345);
      expect(cleanedReport['total_cost']).toBe(55.50);
      
      // Test Reconciliation (Basic Match)
      expect(result.reconciledData).toHaveLength(1);
      const reconciledEntry = result.reconciledData![0];
      expect(reconciledEntry['AWB Prefix']).toBe('141');
      expect(reconciledEntry['AWB Serial']).toBe('12345678');
      expect(reconciledEntry['Net Due (Invoice)']).toBe(55.50);
      expect(reconciledEntry['Net Due (Report)']).toBe(55.50);
      expect(reconciledEntry['Diff Net Due']).toBeCloseTo(0, 5);
      expect(reconciledEntry['Discrepancy Found']).toBe(false);
    });

    it('should handle AWB with no matching report data and flag discrepancy', async () => {
      const rawPdfPages: PageTextData[] = [
        {
          pageNumber: 1,
          lines: [
            '141 9876543 2 TLV JFK 200.00K 20.00 40.00 0.00 0.00 0.00 0.00 0.00 10.00 0.00 70.00 1.00000000 70.00',
            '02FEB23 JFK FZ 5678 0.35' 
          ]
        }
      ];
      mockedExtractTextWithLayout.mockResolvedValue(rawPdfPages);
      mockedExtractDataFromExcel.mockResolvedValue([]); // Empty report data

      const result = await processor.process(basicInput);

      expect(result.success).toBe(true);
      expect(result.reconciledData).toHaveLength(1);
      const reconciledEntry = result.reconciledData![0];
      expect(reconciledEntry['AWB Prefix']).toBe('141');
      expect(reconciledEntry['AWB Serial']).toBe('98765432');
      expect(reconciledEntry['Net Due (Invoice)']).toBe(70.00);
      expect(reconciledEntry['Net Due (Report)']).toBeNull();
      expect(reconciledEntry['Diff Net Due']).toBeNull();
      expect(reconciledEntry['Discrepancy Found']).toBe(true);
    });

    it('should flag discrepancy for mismatch in Net Due amount', async () => {
      const rawPdfPages: PageTextData[] = [
        {
          pageNumber: 1,
          lines: [
            '141 1122334 4 TLV LHR 150.00K 15.00 25.00 0.00 0.00 0.00 0.00 0.00 5.00 0.00 45.00 1.00000000 45.00',
            '03MAR23 LHR FZ 9012 0.30'
          ]
        }
      ];
      mockedExtractTextWithLayout.mockResolvedValue(rawPdfPages);
      const rawExcelData: ProcessedReportData[] = [
        { 'awbprefix': '141', 'awbsuffix': '11223344', 'chargewt': '150', 'frt_cost_rate': '0.30', 'total_cost': '45.50' }, // Differs in total_cost
      ];
      mockedExtractDataFromExcel.mockResolvedValue(rawExcelData);

      const result = await processor.process(basicInput);
      expect(result.success).toBe(true);
      expect(result.reconciledData).toHaveLength(1);
      const reconciledEntry = result.reconciledData![0];
      expect(reconciledEntry['Net Due (Invoice)']).toBe(45.00);
      expect(reconciledEntry['Net Due (Report)']).toBe(45.50);
      expect(reconciledEntry['Diff Net Due']).toBeCloseTo(0.50, 5);
      expect(reconciledEntry['Discrepancy Found']).toBe(true);
    });

    it('should flag discrepancy for mismatch in Charge Weight', async () => {
      const rawPdfPages: PageTextData[] = [
        {
          pageNumber: 1,
          lines: [
            '141 4455667 7 TLV CDG 120.50K 12.00 22.00 0.00 0.00 0.00 0.00 0.00 3.00 0.00 37.00 1.00000000 37.00',
            '04APR23 CDG FZ 1212 0.28'
          ]
        }
      ];
      mockedExtractTextWithLayout.mockResolvedValue(rawPdfPages);
      const rawExcelData: ProcessedReportData[] = [
        { 'awbprefix': '141', 'awbsuffix': '44556677', 'chargewt': '120.00', 'frt_cost_rate': '0.28', 'total_cost': '37.00' }, // Differs in chargewt
      ];
      mockedExtractDataFromExcel.mockResolvedValue(rawExcelData);

      const result = await processor.process(basicInput);
      expect(result.success).toBe(true);
      expect(result.reconciledData).toHaveLength(1);
      const reconciledEntry = result.reconciledData![0];
      expect(reconciledEntry['Charge Weight (Invoice)']).toBe(120.50);
      expect(reconciledEntry['Charge Weight (Report)']).toBe(120.00);
      expect(reconciledEntry['Discrepancy Found']).toBe(true);
    });

    it('should flag discrepancy for mismatch in Net Yield Rate', async () => {
        const rawPdfPages: PageTextData[] = [
          {
            pageNumber: 1,
            lines: [
              '141 7788990 0 TLV AMS 110.00K 11.00 21.00 0.00 0.00 0.00 0.00 0.00 2.00 0.00 34.00 1.00000000 34.00',
              '05MAY23 AMS FZ 3434 0.31'
            ]
          }
        ];
        mockedExtractTextWithLayout.mockResolvedValue(rawPdfPages);
        const rawExcelData: ProcessedReportData[] = [
          { 'awbprefix': '141', 'awbsuffix': '77889900', 'chargewt': '110.00', 'frt_cost_rate': '0.32', 'total_cost': '34.00' }, // Differs in frt_cost_rate
        ];
        mockedExtractDataFromExcel.mockResolvedValue(rawExcelData);
  
        const result = await processor.process(basicInput);
        expect(result.success).toBe(true);
        expect(result.reconciledData).toHaveLength(1);
        const reconciledEntry = result.reconciledData![0];
        expect(reconciledEntry['Net Yield Rate (Invoice)']).toBe(0.31);
        expect(reconciledEntry['Net Yield Rate (Report)']).toBe(0.32);
        expect(reconciledEntry['Discrepancy Found']).toBe(true);
      });

    it('should return success false and an error message if pdf extraction fails', async () => {
      mockedExtractTextWithLayout.mockRejectedValue(new Error('PDF extraction error'));
      mockedExtractDataFromExcel.mockResolvedValue([]); // Provide some default for excel

      const result = await processor.process(basicInput);
      expect(result.success).toBe(false);
      expect(result.error).toBe('PDF extraction error');
      expect(result.processedInvoiceData).toBeUndefined();
      expect(result.reconciledData).toBeUndefined();
    });

    it('should return success false and an error message if excel extraction fails', async () => {
      mockedExtractTextWithLayout.mockResolvedValue([]); // Provide some default for pdf
      mockedExtractDataFromExcel.mockRejectedValue(new Error('Excel extraction error'));

      const result = await processor.process(basicInput);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Excel extraction error');
      expect(result.processedReportData).toBeUndefined();
      expect(result.reconciledData).toBeUndefined();
    });

    // Test for CCA data being passed through correctly
    it('should correctly process and pass through CCA data', async () => {
        const rawPdfPagesWithCca: PageTextData[] = [
          {
            pageNumber: 1, // AWB Page
            lines: [
              '141 1234567 8 TLV DXB 100.50K 10.50 20.00 0.00 0.00 30.00 0.00 0.00 5.00 0.00 55.50 1.00000000 55.50',
              '01JAN22 DXB FZ 1234 1.2345',
            ]
          },
          {
            pageNumber: 2, // CCA Page
            lines: [
              'Section B: CCA Details',
              '76543 141 1234567 8 DXB PP CC (10.00) (5.00) (0.00) (0.00) (0.00) (1.00) (0.50) (16.50) 1.00 (16.50)',
              '02JAN22 TLV' // CCA Issue Date, Destination
            ]
          }
        ];
        mockedExtractTextWithLayout.mockResolvedValue(rawPdfPagesWithCca);
        mockedExtractDataFromExcel.mockResolvedValue([]); // No report data needed for this specific test focus
  
        const result = await processor.process(basicInput);
  
        expect(result.success).toBe(true);
        expect(result.processedInvoiceData?.cca).toHaveLength(1);
        const cleanedCca = result.processedInvoiceData!.cca[0];
        expect(cleanedCca.ccaRefNo).toBe('76543');
        expect(cleanedCca.awbPrefix).toBe('141');
        expect(cleanedCca.awbSerial).toBe('12345678');
        expect(cleanedCca.ccaIssueDate).toBe('02JAN'); // As extracted by _extractCcaDataFromFlyDubaiPdf
        expect(cleanedCca.destination).toBe('TLV');
        expect(cleanedCca.freightCharge).toBe(-10.00);
      });

  });
}); 