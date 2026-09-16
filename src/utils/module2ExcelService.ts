import * as XLSX from 'xlsx';
import { YellowTagItem, WhiteTagItem } from '../types';

/**
 * Returns today's date formatted concisely (e.g. "M/D/YY" like "2/14/26")
 */
export function getFormattedTodayDate(): string {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const yearShort = now.getFullYear().toString().slice(-2);
  return `${month}/${day}/${yearShort}`;
}

/**
 * Generates and triggers download of DEC-Yellow-Tag-Import-Template.xlsx
 * Exactly 5 columns: UPC, DESCRIPTION, QTY, PRICE, COPIES
 */
export function downloadYellowTagTemplate(): void {
  const wb = XLSX.utils.book_new();

  const headers = ['UPC', 'DESCRIPTION', 'QTY', 'PRICE', 'COPIES'];

  const sampleRows = [
    ['396758268186', 'ROLD HVN HBMONO MSLPRA STD 11', 3, 64.00, 1],
    ['048000166442', 'NESTLE CHUCKIE CHOCO MILK 250ML', 2, 32.50, 2],
    ['049000000443', 'COCA COLA REGULAR CAN 330ML', 6, 45.00, 1],
    ['480001601002', 'BEAR BRAND FORTIFIED POWDER 320G', 3, 99.00, 1],
    ['480009212001', 'SAN MIGUEL PALE PILSEN 330ML', 4, 58.50, 3],
  ];

  const wsData = [headers, ...sampleRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 18 }, // UPC
    { wch: 36 }, // DESCRIPTION
    { wch: 10 }, // QTY
    { wch: 12 }, // PRICE
    { wch: 10 }, // COPIES
  ];

  // Mark UPC as text format '@' to preserve leading zeros
  for (let r = 1; r <= sampleRows.length; r++) {
    const upcCell = XLSX.utils.encode_cell({ r, c: 0 });
    if (ws[upcCell]) {
      ws[upcCell].t = 's';
      ws[upcCell].z = '@';
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Yellow_Tags');
  XLSX.writeFile(wb, 'DEC-Yellow-Tag-Import-Template.xlsx');
}

/**
 * Generates and triggers download of DEC-White-Tag-Import-Template.xlsx
 * Exactly 6 columns: UPC, DESCRIPTION, PRICE, SKU, DATE, COPIES
 */
export function downloadWhiteTagTemplate(): void {
  const wb = XLSX.utils.book_new();

  const headers = ['UPC', 'DESCRIPTION', 'PRICE', 'SKU', 'DATE', 'COPIES'];
  const today = getFormattedTodayDate();

  const sampleRows = [
    ['396758268186', 'ROLD HVN HBMONO MSLPRA STD 11', 69.00, '634509', today, 1],
    ['048000166442', 'NESTLE CHUCKIE CHOCO MILK 250ML', 35.00, '102948', today, 2],
    ['049000000443', 'COCA COLA REGULAR CAN 330ML', 48.00, '554019', '', 1],
    ['480001601002', 'BEAR BRAND FORTIFIED POWDER 320G', 105.00, '882103', today, 1],
    ['480009212001', 'SAN MIGUEL PALE PILSEN 330ML', 62.00, '339102', '', 2],
  ];

  const wsData = [headers, ...sampleRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 18 }, // UPC
    { wch: 36 }, // DESCRIPTION
    { wch: 12 }, // PRICE
    { wch: 14 }, // SKU
    { wch: 12 }, // DATE
    { wch: 10 }, // COPIES
  ];

  for (let r = 1; r <= sampleRows.length; r++) {
    const upcCell = XLSX.utils.encode_cell({ r, c: 0 });
    if (ws[upcCell]) {
      ws[upcCell].t = 's';
      ws[upcCell].z = '@';
    }
    const skuCell = XLSX.utils.encode_cell({ r, c: 3 });
    if (ws[skuCell]) {
      ws[skuCell].t = 's';
      ws[skuCell].z = '@';
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, 'White_Tags');
  XLSX.writeFile(wb, 'DEC-White-Tag-Import-Template.xlsx');
}

/**
 * Cleans and converts UPC/barcode identifiers to strict string representation
 * Preserves leading zeroes and fixes scientific notation (e.g. 4.80002E+11)
 */
export function cleanUpcString(val: any): string {
  if (val === null || val === undefined) return '';
  const s = String(val).trim();
  if (!s) return '';
  if (/^\d+\.?\d*e\+\d+$/i.test(s)) {
    try {
      return BigInt(Math.round(Number(s))).toString();
    } catch {
      return s;
    }
  }
  return s;
}

/**
 * Normalizes header string
 */
function normalizeHeader(h: any): string {
  return String(h || '')
    .trim()
    .toUpperCase()
    .replace(/[\s_-]+/g, '');
}

export interface ParseResult<T> {
  success: boolean;
  items: T[];
  error?: string;
  warnings?: string[];
  mismatchedTemplate?: 'yellow' | 'white';
}

/**
 * Parses Yellow Tag Excel File
 * Columns required: UPC, DESCRIPTION, QTY, PRICE. (COPIES optional, defaults to 1)
 * System defaults: BUY = "BUY", UOM = "PCS AND UP", PER = "/PC"
 */
export async function parseYellowTagExcel(file: File): Promise<ParseResult<YellowTagItem>> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return { success: false, items: [], error: 'The uploaded Excel file contains no worksheets.' };
    }

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    // raw: false ensures formatted text (.w) is read to preserve leading zeros
    const rawRows = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1, defval: '', raw: false });

    if (!rawRows || rawRows.length === 0) {
      return { success: false, items: [], error: 'The worksheet is completely empty.' };
    }

    // Identify header row
    let headerRowIdx = -1;
    let upcCol = -1;
    let descCol = -1;
    let qtyCol = -1;
    let priceCol = -1;
    let copiesCol = -1;
    let skuCol = -1;

    for (let r = 0; r < Math.min(10, rawRows.length); r++) {
      const row = rawRows[r];
      if (!Array.isArray(row)) continue;

      const normalized = row.map(normalizeHeader);
      const hasUpc = normalized.some(h => h.includes('UPC') || h.includes('BARCODE') || h.includes('ITEMCODE') || h.includes('EAN') || h === 'CODE');
      const hasDesc = normalized.some(h => h.includes('DESC') || h.includes('PRODUCT') || h.includes('ITEMNAME'));

      if (hasUpc && hasDesc) {
        headerRowIdx = r;
        normalized.forEach((h, idx) => {
          if (h.includes('UPC') || h.includes('BARCODE') || h.includes('ITEMCODE') || h.includes('EAN') || h === 'CODE') upcCol = idx;
          else if (h.includes('DESC') || h.includes('PRODUCT') || h.includes('ITEMNAME')) descCol = idx;
          else if (h === 'QTY' || h.includes('QUANTITY') || h.includes('PACKQTY')) qtyCol = idx;
          else if (h.includes('PRICE') || h.includes('SRP') || h.includes('RETAIL')) priceCol = idx;
          else if (h.includes('COP') || h.includes('PRINT') || h.includes('COUNT')) copiesCol = idx;
          else if (h === 'SKU' || h.includes('STOCK')) skuCol = idx;
        });
        break;
      }
    }

    if (headerRowIdx === -1) {
      return {
        success: false,
        items: [],
        error: 'Could not find required header columns. Expected UPC/Barcode and Description columns.',
      };
    }

    const items: YellowTagItem[] = [];
    const warnings: string[] = [];

    // Inform user if sku found without qty
    if (skuCol !== -1 && qtyCol === -1) {
      warnings.push('This file contains an SKU column. If you meant to print Shelftags (White Tags), switch to the White Tag tab.');
    }

    for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!Array.isArray(row) || row.every(cell => String(cell).trim() === '')) {
        continue; // Skip blank rows
      }

      const upcRaw = upcCol !== -1 ? cleanUpcString(row[upcCol]) : '';
      const descRaw = descCol !== -1 ? String(row[descCol] ?? '').trim() : '';
      const qtyRaw = qtyCol !== -1 ? row[qtyCol] : 3;
      const priceRaw = priceCol !== -1 ? row[priceCol] : 0;
      const copiesRaw = copiesCol !== -1 ? row[copiesCol] : 1;

      if (!descRaw && !upcRaw) continue;

      // Parse QTY (defaults to 3 for promo bulk purchase)
      let qty = parseInt(String(qtyRaw).replace(/[^0-9]/g, ''), 10);
      if (isNaN(qty) || qty < 1) qty = 3;

      // Parse PRICE
      let price = parseFloat(String(priceRaw).replace(/[^0-9.]/g, ''));
      if (isNaN(price)) price = 0;

      // Parse COPIES
      let copies = parseInt(String(copiesRaw).replace(/[^0-9]/g, ''), 10);
      if (isNaN(copies) || copies < 1) copies = 1;

      items.push({
        id: `yt-${Date.now()}-${r}-${Math.random().toString(36).substring(2, 7)}`,
        upc: upcRaw,
        description: descRaw,
        qty,
        price,
        copies,
        buy: 'BUY',
        uom: 'PCS AND UP',
        per: '/PC',
        isSelected: true,
      });
    }

    if (items.length === 0) {
      return {
        success: false,
        items: [],
        error: 'No valid data rows found in the uploaded Yellow Tag Excel file.',
      };
    }

    // Default sorting: DESCRIPTION sorted A -> Z case-insensitively upon import
    items.sort((a, b) =>
      a.description.localeCompare(b.description, undefined, { sensitivity: 'base', numeric: true })
    );

    return { success: true, items, warnings };
  } catch (err: any) {
    return {
      success: false,
      items: [],
      error: `Failed to read Excel file: ${err?.message || 'Unknown parsing error'}`,
    };
  }
}

/**
 * Parses White Tag Excel File
 * Columns required: UPC, DESCRIPTION, PRICE. (SKU, DATE, COPIES optional)
 * If DATE is blank, automatically uses today's date
 */
export async function parseWhiteTagExcel(file: File): Promise<ParseResult<WhiteTagItem>> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return { success: false, items: [], error: 'The uploaded Excel file contains no worksheets.' };
    }

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    // raw: false ensures formatted text (.w) is read to preserve leading zeros
    const rawRows = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1, defval: '', raw: false });

    if (!rawRows || rawRows.length === 0) {
      return { success: false, items: [], error: 'The worksheet is completely empty.' };
    }

    let headerRowIdx = -1;
    let upcCol = -1;
    let descCol = -1;
    let priceCol = -1;
    let skuCol = -1;
    let dateCol = -1;
    let copiesCol = -1;
    let qtyCol = -1;

    for (let r = 0; r < Math.min(10, rawRows.length); r++) {
      const row = rawRows[r];
      if (!Array.isArray(row)) continue;

      const normalized = row.map(normalizeHeader);
      const hasUpc = normalized.some(h => h.includes('UPC') || h.includes('BARCODE') || h.includes('ITEMCODE') || h.includes('EAN') || h === 'CODE');
      const hasDesc = normalized.some(h => h.includes('DESC') || h.includes('PRODUCT') || h.includes('ITEMNAME'));

      if (hasUpc && hasDesc) {
        headerRowIdx = r;
        normalized.forEach((h, idx) => {
          if (h.includes('UPC') || h.includes('BARCODE') || h.includes('ITEMCODE') || h.includes('EAN') || h === 'CODE') upcCol = idx;
          else if (h.includes('DESC') || h.includes('PRODUCT') || h.includes('ITEMNAME')) descCol = idx;
          else if (h.includes('PRICE') || h.includes('SRP') || h.includes('RETAIL')) priceCol = idx;
          else if (h === 'SKU' || h.includes('STOCK')) skuCol = idx;
          else if (h.includes('DATE')) dateCol = idx;
          else if (h.includes('COP') || h.includes('PRINT') || h.includes('COUNT')) copiesCol = idx;
          else if (h === 'QTY' || h.includes('QUANTITY') || h.includes('PACKQTY')) qtyCol = idx;
        });
        break;
      }
    }

    if (headerRowIdx === -1) {
      return {
        success: false,
        items: [],
        error: 'Could not find required header columns. Expected UPC/Barcode and Description columns.',
      };
    }

    const todayStr = getFormattedTodayDate();
    const items: WhiteTagItem[] = [];
    const warnings: string[] = [];

    // Inform user if qty found without sku
    if (qtyCol !== -1 && skuCol === -1) {
      warnings.push('This file contains a QTY column. If you meant to print PP Tags (Yellow Tags), switch to the Yellow Tag tab.');
    }

    for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!Array.isArray(row) || row.every(cell => String(cell).trim() === '')) {
        continue;
      }

      const upcRaw = upcCol !== -1 ? cleanUpcString(row[upcCol]) : '';
      const descRaw = descCol !== -1 ? String(row[descCol] ?? '').trim() : '';
      const priceRaw = priceCol !== -1 ? row[priceCol] : 0;
      const skuRaw = skuCol !== -1 ? String(row[skuCol] ?? '').trim() : '';
      const dateRaw = dateCol !== -1 ? String(row[dateCol] ?? '').trim() : '';
      const copiesRaw = copiesCol !== -1 ? row[copiesCol] : 1;

      if (!descRaw && !upcRaw) continue;

      let price = parseFloat(String(priceRaw).replace(/[^0-9.]/g, ''));
      if (isNaN(price)) price = 0;

      let copies = parseInt(String(copiesRaw).replace(/[^0-9]/g, ''), 10);
      if (isNaN(copies) || copies < 1) copies = 1;

      // Date resolution: if blank, automatically use today's date dynamically
      let finalDate = dateRaw;
      if (!finalDate || finalDate.toLowerCase() === 'today') {
        finalDate = todayStr;
      }

      items.push({
        id: `wt-${Date.now()}-${r}-${Math.random().toString(36).substring(2, 7)}`,
        upc: upcRaw,
        description: descRaw,
        price,
        sku: skuRaw || (upcRaw.length >= 6 ? upcRaw.slice(-6) : upcRaw),
        date: finalDate,
        copies,
        isSelected: true,
      });
    }

    if (items.length === 0) {
      return {
        success: false,
        items: [],
        error: 'No valid data rows found in the uploaded White Tag Excel file.',
      };
    }

    // Default sorting: DESCRIPTION sorted A -> Z case-insensitively upon import
    items.sort((a, b) =>
      a.description.localeCompare(b.description, undefined, { sensitivity: 'base', numeric: true })
    );

    return { success: true, items, warnings };
  } catch (err: any) {
    return {
      success: false,
      items: [],
      error: `Failed to read Excel file: ${err?.message || 'Unknown parsing error'}`,
    };
  }
}

export const SAMPLE_YELLOW_TAGS: YellowTagItem[] = [
  {
    id: 'yt-4',
    upc: '480001601002',
    description: 'BEAR BRAND FORTIFIED POWDER 320G',
    buy: 'BUY',
    qty: 3,
    uom: 'PACKS AND UP',
    price: 99.0,
    per: '/PACK',
    copies: 2,
    isSelected: true,
  },
  {
    id: 'yt-3',
    upc: '049000000443',
    description: 'COCA COLA REGULAR CAN 330ML',
    buy: 'BUY',
    qty: 6,
    uom: 'CANS AND UP',
    price: 45.0,
    per: '/CAN',
    copies: 1,
    isSelected: true,
  },
  {
    id: 'yt-2',
    upc: '048000166442',
    description: 'NESTLE CHUCKIE CHOCO MILK 250ML',
    buy: 'BUY',
    qty: 2,
    uom: 'PCS AND UP',
    price: 32.5,
    per: '/PC',
    copies: 2,
    isSelected: true,
  },
  {
    id: 'yt-1',
    upc: '396758268186',
    description: 'ROLD HVN HBMONO MSLPRA STD 11',
    buy: 'BUY',
    qty: 3,
    uom: 'PCS AND UP',
    price: 64.0,
    per: '/PC',
    copies: 2,
    isSelected: true,
  },
  {
    id: 'yt-5',
    upc: '480009212001',
    description: 'SAN MIGUEL PALE PILSEN 330ML',
    buy: 'BUY',
    qty: 4,
    uom: 'BOTTLES AND UP',
    price: 58.5,
    per: '/BOTTLE',
    copies: 3,
    isSelected: true,
  },
];

export const SAMPLE_WHITE_TAGS: WhiteTagItem[] = [
  {
    id: 'wt-3',
    upc: '4902430737487',
    description: 'ARIEL LIQUID DETERGENT SUNRISE 1000G',
    price: 189.0,
    sku: '201458',
    date: '2/14/26',
    copies: 1,
    isSelected: true,
  },
  {
    id: 'wt-4',
    upc: '480001660101',
    description: 'BEAR BRAND FORTIFIED MILK POWDER 320G',
    price: 105.0,
    sku: '304911',
    date: '2/14/26',
    copies: 2,
    isSelected: true,
  },
  {
    id: 'wt-2',
    upc: '480001664421',
    description: 'NESTLE CHUCKIE CHOCO MILK 250ML',
    price: 35.0,
    sku: '100889',
    date: '2/14/26',
    copies: 2,
    isSelected: true,
  },
  {
    id: 'wt-5',
    upc: '480088812345',
    description: 'PUREFOODS CORNED BEEF 150G CAN',
    price: 78.5,
    sku: '402195',
    date: '2/14/26',
    copies: 3,
    isSelected: true,
  },
  {
    id: 'wt-1',
    upc: '480001600123',
    description: 'SAN MIGUEL PALE PILSEN 330ML CAN',
    price: 69.0,
    sku: '100452',
    date: '2/14/26',
    copies: 2,
    isSelected: true,
  },
];

