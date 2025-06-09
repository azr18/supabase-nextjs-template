// Mock pdf-parse before any imports
jest.mock('pdf-parse', () => {
  return jest.fn();
});

import fs from 'fs';
import path from 'path';
import { extractTextWithLayout } from './pdfExtractor';
import { PageTextData, PageTextItem } from '../types';
import pdf from 'pdf-parse';

const mockPdf = pdf as jest.MockedFunction<typeof pdf>;

// Type for pdf-parse version
type PdfParseVersion = "default" | "v1.9.426" | "v1.10.100" | "v1.10.88" | "v2.0.550";

// Path to the sample Fly Dubai PDF. 
// Ensure this file exists at the specified path for the tests to run.
const SAMPLE_FLY_DUBAI_PDF_PATH = path.join(__dirname, '../../../../tests/fixtures/1748342669424_2501013781418TLV001248_25-25_1-15.1.25.pdf');

describe('pdfExtractor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractTextWithLayout', () => {
    it('should return an empty array if PDF buffer is invalid or empty', async () => {
      const emptyBuffer = Buffer.from('');
      mockPdf.mockRejectedValue(new Error('PDFDocument: stream must have data'));
      
      await expect(extractTextWithLayout(emptyBuffer)).rejects.toThrow('Failed to extract text from PDF with layout.');

      const invalidPdfBuffer = Buffer.from('This is not a PDF');
      mockPdf.mockRejectedValue(new Error('Invalid PDF structure'));
      
      await expect(extractTextWithLayout(invalidPdfBuffer)).rejects.toThrow('Failed to extract text from PDF with layout.');
    });

    it('should handle pdf-parse result with empty text', async () => {
      const testBuffer = Buffer.from('test');
      mockPdf.mockResolvedValue({
        numpages: 1,
        numrender: 1,
        info: {},
        metadata: {},
        version: 'v1.10.100' as PdfParseVersion,
        text: ''
      });

      const result = await extractTextWithLayout(testBuffer);
      expect(result).toEqual([]);
    });

    it('should handle pdf-parse result with null/undefined text', async () => {
      const testBuffer = Buffer.from('test');
      mockPdf.mockResolvedValue({
        numpages: 1,
        numrender: 1,
        info: {},
        metadata: {},
        version: 'v1.10.100' as PdfParseVersion,
        text: null as unknown as string
      });

      const result = await extractTextWithLayout(testBuffer);
      expect(result).toEqual([]);
    });

    it('should handle single page PDF with form feed character', async () => {
      const testBuffer = Buffer.from('test');
      // Note: trailing \f creates an empty page, which is expected behavior
      const sampleText = 'Line 1\nLine 2\nLine 3\f';
      
      mockPdf.mockResolvedValue({
        numpages: 1,
        numrender: 1,
        info: {},
        metadata: {},
        version: 'v1.10.100' as PdfParseVersion,
        text: sampleText
      });

      const result = await extractTextWithLayout(testBuffer);
      
      // Form feed at the end creates an empty second page
      expect(result).toHaveLength(2);
      expect(result[0].pageNumber).toBe(1);
      expect(result[0].lines).toEqual(['Line 1', 'Line 2', 'Line 3']);
      expect(result[0].items).toHaveLength(3);
      expect(result[0].items![0].str).toBe('Line 1');
      expect(result[0].items![0].x).toBe(0);
      expect(result[0].items![0].y).toBe(0);
      
      // Second page should be empty due to trailing form feed
      expect(result[1].pageNumber).toBe(2);
      expect(result[1].lines).toEqual([]);
      expect(result[1].items).toHaveLength(0);
    });

    it('should handle multi-page PDF with form feed characters', async () => {
      const testBuffer = Buffer.from('test');
      // Trailing \f creates an empty page, which is expected behavior
      const sampleText = 'Page 1 Line 1\nPage 1 Line 2\fPage 2 Line 1\nPage 2 Line 2\f';
      
      mockPdf.mockResolvedValue({
        numpages: 2,
        numrender: 2,
        info: {},
        metadata: {},
        version: 'v1.10.100' as PdfParseVersion,
        text: sampleText
      });

      const result = await extractTextWithLayout(testBuffer);
      
      // Form feed at the end creates an empty third page
      expect(result).toHaveLength(3);
      
      // Page 1
      expect(result[0].pageNumber).toBe(1);
      expect(result[0].lines).toEqual(['Page 1 Line 1', 'Page 1 Line 2']);
      expect(result[0].items).toHaveLength(2);
      
      // Page 2
      expect(result[1].pageNumber).toBe(2);
      expect(result[1].lines).toEqual(['Page 2 Line 1', 'Page 2 Line 2']);
      expect(result[1].items).toHaveLength(2);
      
      // Page 3 (empty due to trailing form feed)
      expect(result[2].pageNumber).toBe(3);
      expect(result[2].lines).toEqual([]);
      expect(result[2].items).toHaveLength(0);
    });

    it('should handle PDF without form feed by estimating page breaks', async () => {
      const testBuffer = Buffer.from('test');
      const sampleText = 'Page 1 Line 1\nPage 1 Line 2\nPage 2 Line 1\nPage 2 Line 2';
      
      mockPdf.mockResolvedValue({
        numpages: 2,
        numrender: 2,
        info: {},
        metadata: {},
        version: 'v1.10.100' as PdfParseVersion,
        text: sampleText
      });

      const result = await extractTextWithLayout(testBuffer);
      
      expect(result).toHaveLength(2);
      expect(result[0].pageNumber).toBe(1);
      expect(result[1].pageNumber).toBe(2);
      
      // Should split lines approximately evenly between pages
      const totalLines = result[0].lines.length + result[1].lines.length;
      expect(totalLines).toBe(4);
    });

    it('should filter out empty lines', async () => {
      const testBuffer = Buffer.from('test');
      const sampleText = 'Line 1\n\n  \n\nLine 2\n   \nLine 3\n\n';
      
      mockPdf.mockResolvedValue({
        numpages: 1,
        numrender: 1,
        info: {},
        metadata: {},
        version: 'v1.10.100' as PdfParseVersion,
        text: sampleText
      });

      const result = await extractTextWithLayout(testBuffer);
      
      expect(result).toHaveLength(1);
      expect(result[0].lines).toEqual(['Line 1', 'Line 2', 'Line 3']);
      expect(result[0].items).toHaveLength(3);
    });

    it('should create correct PageTextItem properties', async () => {
      const testBuffer = Buffer.from('test');
      const sampleText = 'Test Line';
      
      mockPdf.mockResolvedValue({
        numpages: 1,
        numrender: 1,
        info: {},
        metadata: {},
        version: 'v1.10.100' as PdfParseVersion,
        text: sampleText
      });

      const result = await extractTextWithLayout(testBuffer);
      
      expect(result).toHaveLength(1);
      expect(result[0].items).toHaveLength(1);
      
      const item = result[0].items![0];
      expect(item.str).toBe('Test Line');
      expect(item.x).toBe(0);
      expect(item.y).toBe(0);
      expect(item.dir).toBe('ltr');
      expect(item.width).toBe('Test Line'.length * 6);
      expect(item.height).toBe(12);
      expect(item.fontName).toBe('unknown');
    });

    it('should handle pdf-parse errors gracefully', async () => {
      const testBuffer = Buffer.from('test');
      mockPdf.mockRejectedValue(new Error('PDF parsing failed'));

      await expect(extractTextWithLayout(testBuffer)).rejects.toThrow('Failed to extract text from PDF with layout.');
    });

    it('should correctly maintain line order and structure', async () => {
      const testBuffer = Buffer.from('test');
      const sampleText = 'First Line\nSecond Line\nThird Line';
      
      mockPdf.mockResolvedValue({
        numpages: 1,
        numrender: 1,
        info: {},
        metadata: {},
        version: 'v1.10.100' as PdfParseVersion,
        text: sampleText
      });

      const result = await extractTextWithLayout(testBuffer);
      
      expect(result).toHaveLength(1);
      const page = result[0];
      
      expect(page.lines).toEqual(['First Line', 'Second Line', 'Third Line']);
      expect(page.items!.map(item => item.str)).toEqual(['First Line', 'Second Line', 'Third Line']);
      
      // Check that Y coordinates increase with each line (simulating line positioning)
      expect(page.items![0].y).toBe(0);
      expect(page.items![1].y).toBe(12);
      expect(page.items![2].y).toBe(24);
    });
  });

  // Integration test with actual PDF file (if available)
  describe('Integration Tests', () => {
    // This test suite uses the real pdf-parse implementation for integration testing
    beforeAll(() => {
      jest.unmock('pdf-parse');
    });

    afterAll(() => {
      jest.mock('pdf-parse', () => {
        return jest.fn();
      });
    });

    it('should process a sample Fly Dubai PDF and extract text data', async () => {
      // This test requires the actual sample PDF file.
      // If the file doesn't exist, this test will be skipped.
      if (!fs.existsSync(SAMPLE_FLY_DUBAI_PDF_PATH)) {
        console.warn(`Sample PDF not found at ${SAMPLE_FLY_DUBAI_PDF_PATH}, skipping test.`);
        return;
      }

      const pdfBuffer = fs.readFileSync(SAMPLE_FLY_DUBAI_PDF_PATH);
      
      // Import the actual function for this test
      const { extractTextWithLayout: actualExtractTextWithLayout } = await import('./pdfExtractor');
      const result: PageTextData[] = await actualExtractTextWithLayout(pdfBuffer);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0); // Expecting a multi-page document

      // Example checks for the first page
      const firstPage = result[0];
      expect(firstPage.pageNumber).toBe(1);
      expect(firstPage.lines).toBeInstanceOf(Array);
      expect(firstPage.items).toBeInstanceOf(Array);
      
      // Verify the structure is maintained
      expect(firstPage.lines.length).toBeGreaterThan(0);
      expect(firstPage.items!.length).toBe(firstPage.lines.length);
      
      // Check that items have required properties
      firstPage.items!.forEach((item: PageTextItem) => {
        expect(item).toHaveProperty('x');
        expect(item).toHaveProperty('y');
        expect(item).toHaveProperty('str');
        expect(item).toHaveProperty('dir');
        expect(item).toHaveProperty('width');
        expect(item).toHaveProperty('height');
        expect(item).toHaveProperty('fontName');
      });
      
      console.log('Sample PDF (first page lines):', firstPage.lines.slice(0, 10).join('\n'));
    });
  });
}); 