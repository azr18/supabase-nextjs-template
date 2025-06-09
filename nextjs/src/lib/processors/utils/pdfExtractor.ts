import { PageTextData, PageTextItem } from '../types'; // Import from types.ts
import * as pdfParseModule from 'pdf-parse';

// Interface for pdf-parse output
interface PdfParseResult {
  numpages: number;
  numrender: number;
  info: Record<string, unknown>;
  metadata: Record<string, unknown>;
  version: string;
  text: string;
}

// Type definition for pdf-parse function
type PdfParseFunction = (buffer: Buffer) => Promise<PdfParseResult>;

// Get the correct pdf-parse function from the module
const pdfParse: PdfParseFunction = (pdfParseModule as any).default || pdfParseModule as any;

// Remove local definitions of PageTextItem and PageTextData
// interface PageTextItem { ... }
// interface PageTextData { ... }

// Simplified function to convert pdf-parse output to our PageTextData structure
function convertPdfParseToPageTextData(pdfData: PdfParseResult): PageTextData[] {
  const text = pdfData.text;
  const numPages = pdfData.numpages;
  
  if (!text || numPages === 0) {
    return [];
  }

  // pdf-parse returns all text as a single string
  // We need to split it into pages and then into lines
  
  // Common page break indicators
  const pageBreakPatterns = [
    /\f/g,                    // Form feed character (most common)
    /\n\s*Page\s+\d+\s*\n/gi, // "Page X" patterns
    /\n\s*-\s*\d+\s*-\s*\n/g, // "- X -" patterns
  ];
  
  let pages = [text]; // Start with whole text as single page
  
  // Try to split by form feed first (most reliable)
  if (text.includes('\f')) {
    pages = text.split('\f');
  } else {
    // If no form feed, try other patterns
    for (const pattern of pageBreakPatterns) {
      const splits = text.split(pattern);
      if (splits.length > 1 && splits.length <= numPages * 2) {
        // Only use this split if it seems reasonable
        pages = splits;
        break;
      }
    }
  }
  
  // If we still have only one page but PDF has multiple pages,
  // try to estimate page breaks by line count
  if (pages.length === 1 && numPages > 1) {
    const allLines = text.split('\n');
    const linesPerPage = Math.ceil(allLines.length / numPages);
    pages = [];
    
    for (let i = 0; i < numPages; i++) {
      const startIdx = i * linesPerPage;
      const endIdx = Math.min((i + 1) * linesPerPage, allLines.length);
      const pageLines = allLines.slice(startIdx, endIdx);
      pages.push(pageLines.join('\n'));
    }
  }
  
  // Convert pages to PageTextData format
  return pages.map((pageText: string, index: number) => {
    const lines = pageText
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0); // Remove empty lines
    
    // Create simplified PageTextItem objects for each line
    // Since pdf-parse doesn't provide detailed positioning, we'll create basic items
    const items: PageTextItem[] = lines.map((line: string, lineIndex: number) => ({
      x: 0, // pdf-parse doesn't provide positioning
      y: lineIndex * 12, // Approximate line height
      str: line,
      dir: 'ltr', // Assume left-to-right
      width: line.length * 6, // Approximate character width
      height: 12, // Approximate line height
      fontName: 'unknown', // pdf-parse doesn't provide font info
    }));
    
    return {
      pageNumber: index + 1,
      lines: lines,
      items: items,
    };
  });
}

export async function extractTextWithLayout(pdfBuffer: Buffer): Promise<PageTextData[]> {
  try {
    const pdfData = await pdfParse(pdfBuffer);
    
    if (!pdfData || !pdfData.text) {
      return [];
    }

    return convertPdfParseToPageTextData(pdfData);
  } catch (error) {
    console.error('Error extracting text with pdf-parse:', error);
    throw new Error('Failed to extract text from PDF with layout.');
  }
} 