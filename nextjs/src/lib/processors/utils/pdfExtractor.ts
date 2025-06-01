import { PDFExtract, PDFExtractOptions, PDFExtractPage, PDFExtractText } from 'pdf.js-extract';
import { PageTextData, PageTextItem } from '../types'; // Import from types.ts

// Remove local definitions of PageTextItem and PageTextData
// interface PageTextItem { ... }
// interface PageTextData { ... }

// Heuristic to group text items into lines based on Y-coordinate
// This is a simplified approach. pdfplumber's layout=True is more sophisticated.
function reconstructLinesFromItems(items: PageTextItem[], yTolerance: number = 2): string[] {
  if (!items || items.length === 0) {
    return [];
  }

  // Sort items primarily by Y, then by X to maintain reading order
  const sortedItems = [...items].sort((a, b) => {
    if (Math.abs(a.y - b.y) > yTolerance) {
      return a.y - b.y;
    }
    return a.x - b.x;
  });

  const lines: PageTextItem[][] = [];
  let currentLineItems: PageTextItem[] = [];

  if (sortedItems.length > 0) {
    currentLineItems.push(sortedItems[0]);
  }

  for (let i = 1; i < sortedItems.length; i++) {
    const prevItem = sortedItems[i - 1];
    const currentItem = sortedItems[i];

    // If current item is on a new line (Y difference > tolerance)
    // or if it's too far to the left of the previous item (suggesting a new line in some layouts)
    if (Math.abs(currentItem.y - prevItem.y) > yTolerance) {
      lines.push(currentLineItems);
      currentLineItems = [currentItem];
    } else {
      // Item is on the same line
      currentLineItems.push(currentItem);
    }
  }
  if (currentLineItems.length > 0) {
    lines.push(currentLineItems);
  }

  // Join items in each line
  return lines.map(lineItemGroup => lineItemGroup.map(item => item.str).join(' '));
}


export async function extractTextWithLayout(pdfBuffer: Buffer): Promise<PageTextData[]> {
  const pdfExtract = new PDFExtract();
  const options: PDFExtractOptions = {
    normalizeWhitespace: false, // Try to preserve original spacing as much as possible
    disableCombineTextItems: true, // Get individual items to reconstruct lines better
  };

  try {
    const data = await pdfExtract.extractBuffer(pdfBuffer, options);
    if (!data || !data.pages) {
      return [];
    }

    return data.pages.map((page: PDFExtractPage) => {
      const pageItems: PageTextItem[] = page.content
        .filter((item): item is PDFExtractText => 'str' in item && typeof item.str === 'string')
        .map(item => ({
          x: item.x,
          y: item.y,
          str: item.str,
          dir: item.dir,
          width: item.width,
          height: item.height,
          fontName: item.fontName,
        }));
      
      // Using a small yTolerance, similar to pdfplumber's x_tolerance for character spacing
      // This tolerance is for grouping items into the same line based on their Y coordinate.
      const lines = reconstructLinesFromItems(pageItems, 2); 

      return {
        pageNumber: page.pageInfo.num,
        lines: lines,
        items: pageItems,
      };
    });
  } catch (error) {
    console.error('Error extracting text with layout:', error);
    // It might be better to throw the error or return an object indicating failure
    throw new Error('Failed to extract text from PDF with layout.');
  }
} 