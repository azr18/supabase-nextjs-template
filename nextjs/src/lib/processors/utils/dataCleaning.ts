/**
 * Safely converts a value to a number.
 * Handles potential errors during conversion and can return null or NaN for invalid inputs.
 * @param value The value to convert.
 * @returns A number, or null if conversion is not possible.
 */
export function safeToNumeric(value: any): number | null {
  if (value === null || value === undefined || String(value).trim() === '') {
    return null;
  }
  const num = Number(value);
  return isNaN(num) ? null : num;
}

/**
 * Formats a Fly Dubai date string (DDMMMYY, e.g., "01SEP23") to "YYYY-MM-DD".
 * Returns the original string if formatting fails.
 * @param dateStr The date string to format.
 * @returns Formatted date string or original string.
 */
export function formatFlyDubaiDateString(dateStr: string): string {
  if (!dateStr || typeof dateStr !== 'string') {
    return dateStr;
  }

  const match = dateStr.match(/^(\d{2})([A-Z]{3})(\d{2})$/i);
  if (!match) {
    return dateStr; // Return original if format doesn't match
  }

  const day = match[1];
  const monthStr = match[2].toUpperCase();
  const year = match[3];

  // Map month abbreviation to month number
  const monthMap: Record<string, string> = {
    JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
    JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12'
  };

  const month = monthMap[monthStr];
  if (!month) {
    return dateStr; // Return original if month abbreviation is invalid
  }

  // Assume 20xx for years less than 50, 19xx otherwise
  const fullYear = parseInt(year) < 50 ? `20${year}` : `19${year}`;

  return `${fullYear}-${month}-${day}`;
} 