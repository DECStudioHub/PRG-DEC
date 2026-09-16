import * as XLSX from 'xlsx';
import { ShelfTagItem } from '../types';

export const REQUIRED_LAYOUT2_COLUMNS = [
  'DESCRIPTION',
  'BARCODE',
  'BUY_PER_AND_UP',
  'PRICE',
  'UNIT',
] as const;

export const YELLOW_LAYOUT2_COLUMNS = REQUIRED_LAYOUT2_COLUMNS;

export interface Layout2ParseResult {
  success: boolean;
  items: ShelfTagItem[];
  missingColumns: string[];
  error?: string;
  skippedSampleRows?: number;
}

/**
 * Generates and downloads the official DEC Layout Option 2 Yellow Tag Excel template (.xlsx)
 * Filename: DEC-Layout-2-Yellow-Tag-Template.xlsx
 * Exactly 5 columns: DESCRIPTION, BARCODE, BUY_PER_AND_UP, PRICE, UNIT
 */
export function downloadLayout2Template(): void {
  const wb = XLSX.utils.book_new();

  // Template Headers: Exactly 5 fields
  const headers = [
    'DESCRIPTION',
    'BARCODE',
    'BUY_PER_AND_UP',
    'PRICE',
    'UNIT',
  ];

  // Verified Sample Rows based on reference design
  const sampleRows = [
    [
      'ROLD HVN HBMONO MSLPRA STD 11',
      '396758268186',
      'BUY 3 PR1 AND UP',
      64.00,
      'PR1',
    ],
    [
      'SAMPLE PRODUCT',
      '0123456789012',
      'BUY 2 AND UP',
      99.00,
      'PC',
    ],
  ];

  const wsData = [headers, ...sampleRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set explicit column widths for clean readability
  ws['!cols'] = [
    { wch: 34 }, // DESCRIPTION
    { wch: 20 }, // BARCODE
    { wch: 22 }, // BUY_PER_AND_UP
    { wch: 12 }, // PRICE
    { wch: 12 }, // UNIT
  ];

  // Explicitly mark BARCODE cells as text format ('@') with string type to guarantee leading zeros preservation
  for (let r = 1; r <= sampleRows.length; r++) {
    const barcodeCell = XLSX.utils.encode_cell({ r, c: 1 });
    if (ws[barcodeCell]) {
      ws[barcodeCell].t = 's';
      ws[barcodeCell].z = '@';
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Yellow_Tags');

  // Trigger download with the required filename
  const filename = 'DEC-Layout-2-Yellow-Tag-Template.xlsx';
  XLSX.writeFile(wb, filename);
}

/**
 * Normalizes header names for case-insensitive and whitespace-flexible matching
 */
function normalizeHeaderName(header: string): string {
  return String(header || '')
    .trim()
    .toUpperCase()
    .replace(/[\s_-]+/g, '_');
}

/**
 * Safely extracts a cell value as a string while preserving leading zeros
 */
function getCellString(row: Record<string, any>, keys: string[]): string {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) {
      const val = String(row[key]).trim();
      if (val.length > 0) return val;
    }
  }
  return '';
}

/**
 * Safely extracts a numeric price without corrupting decimals
 */
function getCellNumber(row: Record<string, any>, keys: string[]): number {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) {
      const raw = String(row[key]).replace(/[₱$,\s]/g, '').trim();
      const num = parseFloat(raw);
      if (!isNaN(num)) return num;
    }
  }
  return 0;
}

/**
 * Parses and validates an Excel file uploaded for Layout Option 2
 */
export function parseLayout2Excel(data: ArrayBuffer): Layout2ParseResult {
  try {
    const wb = XLSX.read(data, {
      type: 'array',
      cellDates: true,
      raw: false, // Ensures formatted string text (including leading zeroes) is preserved
    });

    const sheetName = wb.SheetNames[0];
    if (!sheetName) {
      return {
        success: false,
        items: [],
        missingColumns: [...REQUIRED_LAYOUT2_COLUMNS],
        error: 'The uploaded Excel file contains no readable sheets.',
      };
    }

    const ws = wb.Sheets[sheetName];
    // Read raw 2D array of rows to locate header row accurately
    const rawMatrix: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });

    if (!rawMatrix || rawMatrix.length === 0) {
      return {
        success: false,
        items: [],
        missingColumns: [...REQUIRED_LAYOUT2_COLUMNS],
        error: 'The uploaded sheet is completely empty.',
      };
    }

    // Find header row: look for row containing DESCRIPTION, BARCODE, PRICE, UNIT, etc.
    let headerRowIdx = -1;
    let headerMap: Record<string, number> = {};

    for (let r = 0; r < Math.min(rawMatrix.length, 10); r++) {
      const row = rawMatrix[r];
      if (!row || !Array.isArray(row)) continue;

      const currentMap: Record<string, number> = {};
      row.forEach((cellVal, colIdx) => {
        const norm = normalizeHeaderName(String(cellVal));
        if (norm) {
          currentMap[norm] = colIdx;
        }
      });

      // Count matched required columns
      const hasDesc = currentMap['DESCRIPTION'] !== undefined;
      const hasBarcode = currentMap['BARCODE'] !== undefined;
      const hasPrice = currentMap['PRICE'] !== undefined;
      const hasUnit = currentMap['UNIT'] !== undefined;
      const hasBuyPerAndUp = currentMap['BUY_PER_AND_UP'] !== undefined || currentMap['BUY_PER'] !== undefined;

      if (hasDesc && (hasBarcode || hasPrice)) {
        headerRowIdx = r;
        headerMap = currentMap;
        break;
      }
    }

    if (headerRowIdx === -1) {
      return {
        success: false,
        items: [],
        missingColumns: ['DESCRIPTION', 'BARCODE', 'BUY_PER_AND_UP', 'PRICE', 'UNIT'],
        error: `Invalid Layout Option 2 template. Please use the Layout Option 2 Download Template.\nMissing columns:\n* DESCRIPTION\n* BARCODE\n* BUY_PER_AND_UP\n* PRICE\n* UNIT`,
      };
    }

    // Check essential columns
    const missingColumns: string[] = [];
    if (headerMap['DESCRIPTION'] === undefined) missingColumns.push('DESCRIPTION');
    if (headerMap['BARCODE'] === undefined) missingColumns.push('BARCODE');
    if (headerMap['PRICE'] === undefined) missingColumns.push('PRICE');
    if (headerMap['UNIT'] === undefined) missingColumns.push('UNIT');
    if (headerMap['BUY_PER_AND_UP'] === undefined && headerMap['BUY_PER'] === undefined) {
      missingColumns.push('BUY_PER_AND_UP');
    }

    if (missingColumns.length > 0) {
      return {
        success: false,
        items: [],
        missingColumns,
        error: `Invalid Layout Option 2 template. Missing columns:\n* ${missingColumns.join('\n* ')}`,
      };
    }

    // Process data rows
    const items: ShelfTagItem[] = [];
    let skippedSampleRows = 0;

    for (let r = headerRowIdx + 1; r < rawMatrix.length; r++) {
      const rowArr = rawMatrix[r];
      if (!rowArr || rowArr.every(c => String(c).trim() === '')) {
        continue; // Skip empty rows
      }

      const getCol = (colName: string): string => {
        const colIdx = headerMap[colName];
        if (colIdx !== undefined && rowArr[colIdx] !== undefined) {
          return String(rowArr[colIdx]).trim();
        }
        return '';
      };

      const desc = getCol('DESCRIPTION').toUpperCase();
      // Ensure barcode is preserved strictly as a string without dropping leading zeros
      const barcode = String(getCol('BARCODE')).trim();
      const sku = getCol('SKU');
      const priceRaw = getCol('PRICE');
      const unit = getCol('UNIT') || 'PR1';
      const date = getCol('DATE');
      const buyPerAndUp = getCol('BUY_PER_AND_UP');
      const buyPer = getCol('BUY_PER');
      const up = getCol('UP');
      const copyQtyRaw = getCol('COPY_QTY');

      // Detect if row is the untouched sample row:
      const isUntouchedSample =
        (desc === 'SAMPLE PRODUCT' || desc.includes('[EXAMPLE') || desc.includes('INSTRUCTION')) &&
        (barcode === '0123456789012' || barcode === '1234567890123');

      if (isUntouchedSample) {
        skippedSampleRows++;
        continue;
      }

      if (!desc && !barcode && !sku) {
        continue; // Skip useless empty entries
      }

      // Safe price parsing
      const cleanedPrice = priceRaw.replace(/[₱$,\s]/g, '');
      const regularPrice = parseFloat(cleanedPrice) || 0;

      // Safe COPY_QTY normalization:
      // If blank: 1, If invalid: 1, If zero or negative: 1, If decimal: Math.floor
      let copies = 1;
      if (copyQtyRaw) {
        const parsed = parseInt(copyQtyRaw, 10);
        if (!isNaN(parsed) && parsed > 0) {
          copies = Math.min(parsed, 99);
        }
      }

      // Detect if row has Buy Per / Up data indicating Yellow PP Tag
      const hasBuyInfo = buyPerAndUp.length > 0 || buyPer.length > 0;
      const tagStyle = hasBuyInfo ? 'yellow' : 'white';

      const finalBuyPerAndUp = buyPerAndUp || (buyPer ? `BUY ${buyPer} ${unit} ${up || 'AND UP'}` : undefined);

      const item: ShelfTagItem = {
        id: `l2-imp-${Date.now()}-${r}`,
        tagStyle,
        description: desc || 'UNTITLED ITEM',
        sku: sku || (barcode ? `SKU-${barcode.slice(-6)}` : `SKU-${r}`),
        barcode: barcode || sku,
        regularPrice,
        promoPrice: regularPrice, // Set promoPrice equal to regularPrice so formatting is consistent in all views
        unit: unit.toUpperCase(),
        locator: 'REFERENCE',
        isSelected: true,
        copies,
        buyPerAndUp: finalBuyPerAndUp,
        buyPer: buyPer || undefined,
        up: up || undefined,
        tagDate: date || undefined,
        promoHeader: tagStyle === 'yellow' ? 'SPECIAL BUY' : undefined,
        promoSubtext: tagStyle === 'yellow' ? 'SPECIAL PROMO PERIOD' : undefined,
        promoValidity: tagStyle === 'yellow' ? 'Special Promo Period' : undefined,
      };

      items.push(item);
    }

    return {
      success: true,
      items,
      missingColumns: [],
      skippedSampleRows,
    };
  } catch (err: any) {
    return {
      success: false,
      items: [],
      missingColumns: [],
      error: `Failed to parse Layout Option 2 Excel file: ${err?.message || 'Unknown format'}`,
    };
  }
}
