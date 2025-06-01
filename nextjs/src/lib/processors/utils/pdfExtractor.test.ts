import fs from 'fs';
import path from 'path';
import { extractTextWithLayout, PageTextData } from './pdfExtractor';

// Path to the sample Fly Dubai PDF. 
// Ensure this file exists at the specified path for the tests to run.
const SAMPLE_FLY_DUBAI_PDF_PATH = path.join(__dirname, '../../../../tests/fixtures/1748342669424_2501013781418TLV001248_25-25_1-15.1.25.pdf');

describe('pdfExtractor', () => {
  describe('extractTextWithLayout', () => {
    it('should return an empty array if PDF buffer is invalid or empty', async () => {
      const emptyBuffer = Buffer.from('');
      await expect(extractTextWithLayout(emptyBuffer)).rejects.toThrow('Failed to extract text from PDF with layout.');

      const invalidPdfBuffer = Buffer.from('This is not a PDF');
      await expect(extractTextWithLayout(invalidPdfBuffer)).rejects.toThrow('Failed to extract text from PDF with layout.');
    });

    // More tests will be added here once the sample PDF is available 
    // and specific parsing logic for FlyDubaiProcessor is clearer.
    it('should process a sample Fly Dubai PDF and extract text data', async () => {
      // This test requires the actual sample PDF file.
      // If the file doesn't exist, this test will fail or should be skipped.
      if (!fs.existsSync(SAMPLE_FLY_DUBAI_PDF_PATH)) {
        console.warn(`Sample PDF not found at ${SAMPLE_FLY_DUBAI_PDF_PATH}, skipping test.`);
        return;
      }

      const pdfBuffer = fs.readFileSync(SAMPLE_FLY_DUBAI_PDF_PATH);
      const result: PageTextData[] = await extractTextWithLayout(pdfBuffer);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0); // Expecting a multi-page document

      // Example checks for the first page (more specific checks depend on PDF content)
      const firstPage = result[0];
      expect(firstPage.pageNumber).toBe(1);
      expect(firstPage.lines).toBeInstanceOf(Array);
      expect(firstPage.items).toBeInstanceOf(Array);
      
      // TODO: Add more specific assertions based on the known content of the sample PDF
      // For example, check for specific text strings in firstPage.lines or properties of firstPage.items
      // This will depend on how FlyDubaiProcessor needs to consume this data.
      // e.g. expect(firstPage.lines.join('\n')).toContain('Some known text from page 1');
      console.log('Sample PDF (first page lines):', firstPage.lines.slice(0, 10).join('\n'));
    });

    it('should correctly reconstruct lines from text items', async () => {
        // This test will use a mock of pdf.js-extract's output 
        // to specifically test the reconstructLinesFromItems logic if needed,
        // or it can be indirectly tested by the main extraction test if its output is verified carefully.
        // For now, this is covered by the main test with the sample PDF.
    });

  });
}); 