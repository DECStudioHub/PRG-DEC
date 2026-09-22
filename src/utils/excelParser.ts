import * as XLSX from 'xlsx';
import { InventoryItem, ValidationIssue, ValidationSummary } from '../types';

export const REQUIRED_COLUMNS = [
  'LOCATOR',
  'SKU',
  'UPC',
  'DESCRIPTION',
] as const;

// Column aliases for fuzzy matching
const COLUMN_ALIASES: Record<string, string[]> = {
  locator: ['locator', 'location', 'shelf', 'rack', 'bin', 'loc', 'aisle'],
  sku: ['sku', 'item code', 'product code', 'item no', 'item_no', 'part no', 'sku code'],
  upcNo: ['upc', 'upc no', 'ean', 'upc_no', 'upc code', 'barcode no', 'upc/ean'],
  description: ['description', 'desc', 'item description', 'product name', 'item name', 'name', 'title'],
  barcode: ['barcode', 'bar code', 'barcode value', 'code'],
  count: ['count', 'qty', 'quantity', 'actual count', 'physical count', 'counted qty', 'stock'],
  counter: ['counter', 'counted by', 'counter name', 'counted_by', 'counter id', 'auditor'],
  scanner: ['scanner', 'scanner name', 'scanned by', 'scanner personnel', 'scanner staff', 'scanner id', 'scanner status', 'scan status', 'scanner result', 'scan result'],
  validator: ['validator', 'validated by', 'checker', 'validator name', 'verified by', 'checked by'],
  copies: ['copies', 'copy', 'tag copies', 'qty copies', 'print copies', 'tags count', 'print count', 'no of copies', 'no. of copies'],
};

function normalizeHeader(header: string): string {
  return String(header || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ');
}

export function matchColumnKey(header: string): keyof InventoryItem | null {
  const norm = normalizeHeader(header);
  for (const [key, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (aliases.some(alias => norm === alias || norm.includes(alias))) {
      return key as keyof InventoryItem;
    }
  }
  return null;
}

export function parseExcelFile(
  data: ArrayBuffer
): { items: InventoryItem[]; detectedColumns: string[]; missingColumns: string[]; summary: ValidationSummary } {
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('The uploaded Excel file has no sheets.');
  }

  const worksheet = workbook.Sheets[sheetName];
  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('The selected sheet contains no data.');
  }

  // Find header row (usually first row with non-empty cells)
  let headerRowIndex = 0;
  for (let r = 0; r < Math.min(rawRows.length, 5); r++) {
    const row = rawRows[r];
    if (row && row.filter((c: any) => String(c).trim() !== '').length >= 3) {
      headerRowIndex = r;
      break;
    }
  }

  const rawHeaders: string[] = (rawRows[headerRowIndex] || []).map(h => String(h || '').trim());
  const columnMap: Partial<Record<keyof InventoryItem, number>> = {};

  rawHeaders.forEach((header, index) => {
    const matchedKey = matchColumnKey(header);
    if (matchedKey && columnMap[matchedKey] === undefined) {
      columnMap[matchedKey] = index;
    }
  });

  // Support both UPC and BARCODE interchangeability for backward compatibility
  if (columnMap['upcNo'] === undefined && columnMap['barcode'] !== undefined) {
    columnMap['upcNo'] = columnMap['barcode'];
  }
  if (columnMap['barcode'] === undefined && columnMap['upcNo'] !== undefined) {
    columnMap['barcode'] = columnMap['upcNo'];
  }

  // Check which standard required columns are missing (v2.0.4 4-column simplified format)
  const missingColumns: string[] = [];
  const requiredFieldMap: Record<string, keyof InventoryItem> = {
    'LOCATOR': 'locator',
    'SKU': 'sku',
    'UPC': 'upcNo',
    'DESCRIPTION': 'description',
  };

  for (const [reqName, fieldKey] of Object.entries(requiredFieldMap)) {
    if (columnMap[fieldKey] === undefined) {
      missingColumns.push(reqName);
    }
  }

  const items: InventoryItem[] = [];
  const issues: ValidationIssue[] = [];

  const skuCounts = new Map<string, number>();
  const upcCounts = new Map<string, number>();

  for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.every((c: any) => String(c).trim() === '')) {
      continue; // skip completely empty rows
    }

    const getItemVal = (key: keyof InventoryItem, defaultVal: any = ''): string => {
      const colIdx = columnMap[key];
      if (colIdx !== undefined && row[colIdx] !== undefined) {
        return String(row[colIdx]).trim();
      }
      return defaultVal;
    };

    const locator = getItemVal('locator');
    const sku = getItemVal('sku');
    let upcNo = getItemVal('upcNo');
    const description = getItemVal('description');
    let barcode = getItemVal('barcode');
    const rawCount = getItemVal('count', '0');
    const counter = getItemVal('counter');
    const scanner = getItemVal('scanner');
    const validator = getItemVal('validator');
    const rawCopies = getItemVal('copies');

    // If barcode is empty but upc is provided, fallback to upc
    if (!barcode && upcNo) {
      barcode = upcNo;
    }
    if (!upcNo && barcode) {
      upcNo = barcode;
    }

    const id = `item-${r}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    // Track duplicates
    if (sku) {
      skuCounts.set(sku, (skuCounts.get(sku) || 0) + 1);
    }
    if (upcNo) {
      upcCounts.set(upcNo, (upcCounts.get(upcNo) || 0) + 1);
    }

    // Parse count
    let parsedCount: number | string = 0;
    if (rawCount !== '') {
      const num = Number(rawCount);
      if (!isNaN(num)) {
        parsedCount = num;
      } else {
        parsedCount = rawCount;
      }
    }

    // Parse copies (optional positive integer)
    let parsedCopies: number | undefined = undefined;
    if (rawCopies !== '') {
      const num = parseInt(rawCopies, 10);
      if (!isNaN(num) && num >= 1) {
        parsedCopies = num;
      }
    }

    const item: InventoryItem = {
      id,
      locator,
      sku,
      upcNo,
      description,
      barcode,
      count: parsedCount,
      counter,
      scanner,
      validator,
      copies: parsedCopies,
      isSelected: true,
      rawRowIndex: r + 1,
    };

    items.push(item);
  }

  // Validate items
  const duplicateSKUs: string[] = [];
  const duplicateUPCs: string[] = [];

  for (const [sku, count] of skuCounts.entries()) {
    if (count > 1) duplicateSKUs.push(sku);
  }
  for (const [upc, count] of upcCounts.entries()) {
    if (count > 1) duplicateUPCs.push(upc);
  }

  items.forEach(item => {
    const rowNum = item.rawRowIndex || 1;

    // Check LOCATOR
    if (!item.locator) {
      issues.push({
        id: `err-loc-${item.id}`,
        itemId: item.id,
        row: rowNum,
        field: 'locator',
        fieldName: 'LOCATOR',
        severity: 'warning',
        message: 'Missing locator identifier (e.g. A01-01)',
        value: item.locator,
      });
    }

    // Check SKU
    if (!item.sku) {
      issues.push({
        id: `err-sku-${item.id}`,
        itemId: item.id,
        row: rowNum,
        field: 'sku',
        fieldName: 'SKU',
        severity: 'error',
        message: 'Empty SKU field is required for inventory tracking',
        value: item.sku,
      });
    } else if (skuCounts.get(item.sku)! > 1) {
      issues.push({
        id: `warn-sku-dup-${item.id}`,
        itemId: item.id,
        row: rowNum,
        field: 'sku',
        fieldName: 'SKU',
        severity: 'warning',
        message: `Duplicate SKU "${item.sku}" detected across multiple rows`,
        value: item.sku,
      });
    }

    // Check UPC
    if (!item.upcNo) {
      issues.push({
        id: `warn-upc-${item.id}`,
        itemId: item.id,
        row: rowNum,
        field: 'upcNo',
        fieldName: 'UPC NO',
        severity: 'warning',
        message: 'UPC number is missing',
        value: item.upcNo,
      });
    } else if (upcCounts.get(item.upcNo)! > 1) {
      issues.push({
        id: `warn-upc-dup-${item.id}`,
        itemId: item.id,
        row: rowNum,
        field: 'upcNo',
        fieldName: 'UPC NO',
        severity: 'warning',
        message: `Duplicate UPC "${item.upcNo}" detected`,
        value: item.upcNo,
      });
    }

    // Check DESCRIPTION
    if (!item.description) {
      issues.push({
        id: `err-desc-${item.id}`,
        itemId: item.id,
        row: rowNum,
        field: 'description',
        fieldName: 'DESCRIPTION',
        severity: 'error',
        message: 'Description is blank',
        value: item.description,
      });
    }

    // Check BARCODE
    if (!item.barcode) {
      issues.push({
        id: `err-bar-${item.id}`,
        itemId: item.id,
        row: rowNum,
        field: 'barcode',
        fieldName: 'BARCODE',
        severity: 'error',
        message: 'Barcode value is missing and required for tag generation',
        value: item.barcode,
      });
    } else {
      // Validate barcode characters
      const cleaned = item.barcode.trim();
      if (cleaned.length < 3) {
        issues.push({
          id: `warn-bar-len-${item.id}`,
          itemId: item.id,
          row: rowNum,
          field: 'barcode',
          fieldName: 'BARCODE',
          severity: 'warning',
          message: 'Barcode seems too short (< 3 characters)',
          value: item.barcode,
        });
      }
    }

    // Check COUNT
    const countNum = Number(item.count);
    if (isNaN(countNum)) {
      issues.push({
        id: `err-count-nan-${item.id}`,
        itemId: item.id,
        row: rowNum,
        field: 'count',
        fieldName: 'COUNT',
        severity: 'warning',
        message: `Count "${item.count}" is not a valid number`,
        value: item.count,
      });
    } else if (countNum < 0) {
      issues.push({
        id: `err-count-neg-${item.id}`,
        itemId: item.id,
        row: rowNum,
        field: 'count',
        fieldName: 'COUNT',
        severity: 'warning',
        message: `Negative count (${countNum}) detected`,
        value: item.count,
      });
    }
  });

  // Calculate summary
  const itemsWithErrors = new Set(issues.filter(i => i.severity === 'error').map(i => i.itemId));
  const itemsWithWarnings = new Set(issues.filter(i => i.severity === 'warning').map(i => i.itemId));

  const validItems = items.filter(it => !itemsWithErrors.has(it.id) && !itemsWithWarnings.has(it.id)).length;
  const warningItems = items.filter(it => !itemsWithErrors.has(it.id) && itemsWithWarnings.has(it.id)).length;
  const errorItems = itemsWithErrors.size;

  const summary: ValidationSummary = {
    totalRows: items.length,
    validItems,
    warningItems,
    errorItems,
    issues,
    missingRequiredColumns: missingColumns,
    duplicateSKUs,
    duplicateUPCs,
  };

  return {
    items,
    detectedColumns: rawHeaders,
    missingColumns,
    summary,
  };
}

export function revalidateItems(items: InventoryItem[]): ValidationSummary {
  const issues: ValidationIssue[] = [];
  const skuCounts = new Map<string, number>();
  const upcCounts = new Map<string, number>();

  items.forEach(item => {
    if (item.sku) skuCounts.set(item.sku, (skuCounts.get(item.sku) || 0) + 1);
    if (item.upcNo) upcCounts.set(item.upcNo, (upcCounts.get(item.upcNo) || 0) + 1);
  });

  const duplicateSKUs: string[] = [];
  const duplicateUPCs: string[] = [];
  for (const [sku, c] of skuCounts.entries()) if (c > 1) duplicateSKUs.push(sku);
  for (const [upc, c] of upcCounts.entries()) if (c > 1) duplicateUPCs.push(upc);

  items.forEach((item, index) => {
    const rowNum = item.rawRowIndex || index + 1;

    if (!item.locator) {
      issues.push({
        id: `err-loc-${item.id}`,
        itemId: item.id,
        row: rowNum,
        field: 'locator',
        fieldName: 'LOCATOR',
        severity: 'warning',
        message: 'Missing locator identifier',
        value: item.locator,
      });
    }

    if (!item.sku) {
      issues.push({
        id: `err-sku-${item.id}`,
        itemId: item.id,
        row: rowNum,
        field: 'sku',
        fieldName: 'SKU',
        severity: 'error',
        message: 'Empty SKU is required',
        value: item.sku,
      });
    } else if (skuCounts.get(item.sku)! > 1) {
      issues.push({
        id: `warn-sku-dup-${item.id}`,
        itemId: item.id,
        row: rowNum,
        field: 'sku',
        fieldName: 'SKU',
        severity: 'warning',
        message: `Duplicate SKU "${item.sku}"`,
        value: item.sku,
      });
    }

    if (!item.upcNo) {
      issues.push({
        id: `warn-upc-${item.id}`,
        itemId: item.id,
        row: rowNum,
        field: 'upcNo',
        fieldName: 'UPC NO',
        severity: 'warning',
        message: 'UPC is blank',
        value: item.upcNo,
      });
    } else if (upcCounts.get(item.upcNo)! > 1) {
      issues.push({
        id: `warn-upc-dup-${item.id}`,
        itemId: item.id,
        row: rowNum,
        field: 'upcNo',
        fieldName: 'UPC NO',
        severity: 'warning',
        message: `Duplicate UPC "${item.upcNo}"`,
        value: item.upcNo,
      });
    }

    if (!item.description) {
      issues.push({
        id: `err-desc-${item.id}`,
        itemId: item.id,
        row: rowNum,
        field: 'description',
        fieldName: 'DESCRIPTION',
        severity: 'error',
        message: 'Description is blank',
        value: item.description,
      });
    }

    if (!item.barcode) {
      issues.push({
        id: `err-bar-${item.id}`,
        itemId: item.id,
        row: rowNum,
        field: 'barcode',
        fieldName: 'BARCODE',
        severity: 'error',
        message: 'Barcode is missing',
        value: item.barcode,
      });
    }

    const countNum = Number(item.count);
    if (isNaN(countNum)) {
      issues.push({
        id: `err-count-nan-${item.id}`,
        itemId: item.id,
        row: rowNum,
        field: 'count',
        fieldName: 'COUNT',
        severity: 'warning',
        message: `Count is not a valid number`,
        value: item.count,
      });
    } else if (countNum < 0) {
      issues.push({
        id: `err-count-neg-${item.id}`,
        itemId: item.id,
        row: rowNum,
        field: 'count',
        fieldName: 'COUNT',
        severity: 'warning',
        message: `Negative count (${countNum})`,
        value: item.count,
      });
    }
  });

  const itemsWithErrors = new Set(issues.filter(i => i.severity === 'error').map(i => i.itemId));
  const itemsWithWarnings = new Set(issues.filter(i => i.severity === 'warning').map(i => i.itemId));

  return {
    totalRows: items.length,
    validItems: items.filter(it => !itemsWithErrors.has(it.id) && !itemsWithWarnings.has(it.id)).length,
    warningItems: items.filter(it => !itemsWithErrors.has(it.id) && itemsWithWarnings.has(it.id)).length,
    errorItems: itemsWithErrors.size,
    issues,
    missingRequiredColumns: [],
    duplicateSKUs,
    duplicateUPCs,
  };
}

export const DEMO_ITEMS: InventoryItem[] = [
  {
    id: 'demo-1',
    locator: 'A01-01',
    sku: 'SKU001',
    upcNo: '123456789012',
    description: 'Coca-Cola Classic 1.5L',
    barcode: '123456789012',
    count: 25,
    counter: 'Juan Santos',
    scanner: 'Maria Ramos',
    validator: 'Pedro Reyes',
    isSelected: true,
    rawRowIndex: 2,
  },
  {
    id: 'demo-2',
    locator: 'A01-02',
    sku: 'SKU002',
    upcNo: '987654321098',
    description: 'Pepsi Cola 1.5L Bottle',
    barcode: '987654321098',
    count: 18,
    counter: 'Juan Santos',
    scanner: 'Maria Ramos',
    validator: 'Pedro Reyes',
    isSelected: true,
    rawRowIndex: 3,
  },
  {
    id: 'demo-3',
    locator: 'A01-03',
    sku: 'SKU003',
    upcNo: '456789123456',
    description: 'Sprite Lemon-Lime 1.5L',
    barcode: '456789123456',
    count: 32,
    counter: 'Juan Santos',
    scanner: 'Maria Ramos',
    validator: 'Pedro Reyes',
    isSelected: true,
    rawRowIndex: 4,
  },
  {
    id: 'demo-4',
    locator: 'A01-04',
    sku: 'SKU004',
    upcNo: '789123456789',
    description: 'Mountain Dew 1.5L Pitch Black',
    barcode: '789123456789',
    count: 14,
    counter: 'Maria Gomez',
    scanner: 'Jose Perez',
    validator: 'Pedro Reyes',
    isSelected: true,
    rawRowIndex: 5,
  },
  {
    id: 'demo-5',
    locator: 'A02-01',
    sku: 'SKU005',
    upcNo: '321654987321',
    description: 'Royal Tru-Orange 1.5L Pet',
    barcode: '321654987321',
    count: 40,
    counter: 'Maria Gomez',
    scanner: 'Jose Perez',
    validator: 'Pedro Reyes',
    isSelected: true,
    rawRowIndex: 6,
  },
  {
    id: 'demo-6',
    locator: 'A02-02',
    sku: 'SKU006',
    upcNo: '654321789654',
    description: 'C2 Green Tea Apple 500ml',
    barcode: '654321789654',
    count: 55,
    counter: 'Maria Gomez',
    scanner: 'Jose Perez',
    validator: 'Pedro Reyes',
    isSelected: true,
    rawRowIndex: 7,
  },
  {
    id: 'demo-7',
    locator: 'B01-01',
    sku: 'SKU007',
    upcNo: '880104301483',
    description: 'Nongshim Shin Ramyun 120g',
    barcode: '880104301483',
    count: 72,
    counter: 'Juan Santos',
    scanner: 'Ana Lim',
    validator: 'Pedro Reyes',
    isSelected: true,
    rawRowIndex: 8,
  },
  {
    id: 'demo-8',
    locator: 'B01-02',
    sku: 'SKU008',
    upcNo: '480001664402',
    description: 'Lucky Me Pancit Canton Original 80g',
    barcode: '480001664402',
    count: 120,
    counter: 'Juan Santos',
    scanner: 'Ana Lim',
    validator: 'Pedro Reyes',
    isSelected: true,
    rawRowIndex: 9,
  },
  {
    id: 'demo-9',
    locator: 'B01-03',
    sku: 'SKU009',
    upcNo: '480001664403',
    description: 'Lucky Me Pancit Canton Chili Mansi 80g',
    barcode: '480001664403',
    count: 95,
    counter: 'Juan Santos',
    scanner: 'Ana Lim',
    validator: 'Pedro Reyes',
    isSelected: true,
    rawRowIndex: 10,
  },
  {
    id: 'demo-10',
    locator: 'B02-01',
    sku: 'SKU010',
    upcNo: '480001602488',
    description: 'Jack n Jill Piattos Cheese 85g',
    barcode: '480001602488',
    count: 48,
    counter: 'Carlos Dizon',
    scanner: 'Lito Cruz',
    validator: 'Elena Cruz',
    isSelected: true,
    rawRowIndex: 11,
  },
  {
    id: 'demo-11',
    locator: 'B02-02',
    sku: 'SKU011',
    upcNo: '480001602499',
    description: 'Jack n Jill Nova Cheddar 78g',
    barcode: '480001602499',
    count: 36,
    counter: 'Carlos Dizon',
    scanner: 'Lito Cruz',
    validator: 'Elena Cruz',
    isSelected: true,
    rawRowIndex: 12,
  },
  {
    id: 'demo-12',
    locator: 'C01-01',
    sku: 'SKU012',
    upcNo: '480009211333',
    description: 'San Miguel Pale Pilsen 330ml Can',
    barcode: '480009211333',
    count: 64,
    counter: 'Carlos Dizon',
    scanner: 'Lito Cruz',
    validator: 'Elena Cruz',
    isSelected: true,
    rawRowIndex: 13,
  },
];

export const SAMPLE_DEMO_ITEMS: InventoryItem[] = DEMO_ITEMS;

export function downloadSampleExcelTemplate(): void {
  const headers = ['LOCATOR', 'SKU', 'UPC', 'DESCRIPTION'];
  const sampleData = [
    headers,
    ['BA-A1-B21L', '14177', '1428503045', 'UFC BANANA CATSUP 1000G'],
    ['BA-A1-B21L', '14178', '1428503046', 'SAMPLE ITEM'],
    ['BA-A1-B22L', '14179', '1428503047', 'SAMPLE ITEM 2'],
    ['BA-A1-B22L', '14180', '1428503048', 'COCA-COLA CLASSIC 1.5L'],
    ['BA-A2-B01L', '14181', '1428503049', 'LUCKY ME PANCIT CANTON 80G'],
    ['BA-A2-B02L', '14182', '1428503050', 'SAN MIGUEL PALE PILSEN 330ML'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(sampleData);

  // Set column widths
  ws['!cols'] = [
    { wch: 16 }, // LOCATOR
    { wch: 14 }, // SKU
    { wch: 18 }, // UPC
    { wch: 38 }, // DESCRIPTION
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'PCOUNT Template');
  XLSX.writeFile(wb, 'pcount_w2w_template.xlsx');
}

export function exportInventoryToExcel(
  items: InventoryItem[],
  filename: string = 'inventory_counting_export.xlsx'
): void {
  const rows = items.map(item => ({
    'LOCATOR': item.locator,
    'SKU': item.sku,
    'UPC NO': item.upcNo,
    'DESCRIPTION': item.description,
    'BARCODE': item.barcode,
    'COUNT': item.count,
    'COUNTER': item.counter,
    'SCANNER': item.scanner,
    'VALIDATOR': item.validator,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 12 },
    { wch: 14 },
    { wch: 18 },
    { wch: 35 },
    { wch: 18 },
    { wch: 10 },
    { wch: 18 },
    { wch: 12 },
    { wch: 18 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Counted Inventory');
  XLSX.writeFile(wb, filename);
}
