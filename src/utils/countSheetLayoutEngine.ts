import {
  CountSheetColumnId,
  CountSheetColumnWidths,
  CountSheetConfig,
  CountSheetPageData,
  CountSheetPreset,
  CountSheetSortField,
  CountSheetSortOrder,
  CountSheetSummary,
  InventoryItem,
  PaperSize,
} from '../types';
import { PAPER_SPECS } from './shelftagLayoutEngine';

export const DEFAULT_COUNT_SHEET_COLUMN_ORDER: CountSheetColumnId[] = [
  'sku',
  'barcode',
  'description',
  'count',
];

export const DEFAULT_COUNT_SHEET_COLUMN_VISIBILITY: Record<CountSheetColumnId, boolean> = {
  locator: true,
  sku: true,
  barcode: true,
  description: true,
  precount: true,
  count: true,
};

export const DEFAULT_CYCLE_COUNT_SHEET_COLUMN_ORDER: CountSheetColumnId[] = [
  'locator',
  'sku',
  'barcode',
  'description',
  'precount',
  'count',
];

export const DEFAULT_CYCLE_COUNT_SHEET_COLUMN_VISIBILITY: Record<CountSheetColumnId, boolean> = {
  locator: true,
  sku: true,
  barcode: true,
  description: true,
  precount: true,
  count: true,
};

export const DEFAULT_COUNT_SHEET_CONFIG: CountSheetConfig = {
  paperSize: 'A4',
  customWidthMm: 210,
  customHeightMm: 297,
  orientation: 'portrait',
  rowsPerPage: 15, // Default 15 rows as requested
  marginTopMm: 8,
  marginBottomMm: 8,
  marginLeftMm: 8,
  marginRightMm: 8,
  rowHeightMm: 12, // Default 12 mm height as requested
  tableWidthPercent: 100,
  columnWidths: {
    locatorMm: 26,
    skuMm: 28,
    barcodeMm: 42,
    descMm: 88,
    countMm: 34,
  },
  sortField: 'description',
  sortOrder: 'asc',
  columnOrder: [...DEFAULT_COUNT_SHEET_COLUMN_ORDER],
  columnVisibility: { ...DEFAULT_COUNT_SHEET_COLUMN_VISIBILITY },

  // Typography
  headerFontFamily: 'sans-serif',
  headerFontSizePt: 9,
  headerFontWeight: 'bold',

  bodyFontFamily: 'sans-serif',
  bodyFontSizePt: 8.5,

  skuFontSizePt: 8.5,
  barcodeTextFontSizePt: 7,
  descFontSizePt: 8.5,
  countHeaderFontSizePt: 9,

  // Description text wrapping
  wrapDescription: true,
  descMaxLines: 2,
  descLineHeight: 1.25,

  // Barcode Column
  showBarcodeGraphic: true,
  barcodeHeightMm: 7.5,
  barcodeWidthMm: 36,
  barcodeFormat: 'CODE128',
  showBarcodeValueText: true,
  barcodeAlign: 'center',

  // Locator Barcode (Upper-Right) - Scanner Optimized Defaults
  showLocatorBarcode: true,
  showLocatorText: true,
  locatorBarcodeHeightMm: 11,
  locatorBarcodeWidthScale: 1.5,
  locatorBarcodeFormat: 'CODE128',
  showLocatorBarcodeText: true,
  locatorBarcodeTextSizePt: 8,
  locatorBarcodeAlign: 'right',

  // Table Border & Line Settings (Dedicated TABLE SETTINGS)
  tableBorderEnabled: true,
  tableBorderWidthPx: 1.5,
  tableBorderStyle: 'solid',
  tableBorderColor: '#27272a',
  tableOuterBorder: true,
  tableInnerHorizontalLines: true,
  tableInnerVerticalLines: true,
  tableHorizontalLineWidthPx: 1,
  tableVerticalLineWidthPx: 1,

  // Header Settings
  tableHeaderBorder: true,
  tableHeaderBorderWidthPx: 2,
  tableHeaderAlign: 'left',

  // Body Settings
  tableBodyBorder: true,
  tableBodyBorderWidthPx: 1,
  tableBodyAlign: 'left',

  // Layout & Table Features
  showGridLines: true,
  borderWidthPx: 1.5,
  showRowNumbers: true,
  showSignatures: true,
  showStoreHeader: true,
  showPageNumbers: true,
  emptyRowsToFillPage: false,
  mixLocators: false,
};

export const DEFAULT_CYCLE_COUNT_SHEET_CONFIG: CountSheetConfig = {
  ...DEFAULT_COUNT_SHEET_CONFIG,
  mixLocators: true,
  showLocatorBarcode: false, // User requested: Remove upper-right locator barcode on CYCLE COUNT Countsheet
  showLocatorText: false,    // User requested: Remove upper-right human-readable locator text
  showLocatorBarcodeText: false,
  columnOrder: [...DEFAULT_CYCLE_COUNT_SHEET_COLUMN_ORDER], // User requested: Add Column for Locator
  columnVisibility: { ...DEFAULT_CYCLE_COUNT_SHEET_COLUMN_VISIBILITY },
  columnWidths: {
    locatorMm: 28,
    skuMm: 22,
    barcodeMm: 36,
    descMm: 55,
    precountMm: 23,
    countMm: 23,
  },
};

export const DEFAULT_COUNT_SHEET_PRESETS: CountSheetPreset[] = [
  {
    id: 'standard_15',
    name: 'Standard Count Sheet (15 Rows)',
    description: 'Default 15 item rows per page on A4 paper with 12mm handwriting height & locator barcode.',
    isDefault: true,
    config: { ...DEFAULT_COUNT_SHEET_CONFIG },
  },
  {
    id: 'large_writing_15',
    name: 'Large Writing Area (15 Rows)',
    description: 'Generous 14.5mm row height with 15 rows/page for fast manual handwriting in selling area.',
    config: {
      ...DEFAULT_COUNT_SHEET_CONFIG,
      rowsPerPage: 15,
      rowHeightMm: 14.5,
      columnWidths: {
        skuMm: 28,
        barcodeMm: 42,
        descMm: 82,
        countMm: 40,
      },
      bodyFontSizePt: 9,
      descFontSizePt: 9,
    },
  },
  {
    id: 'compact_25',
    name: 'Compact Count Sheet (25 Rows)',
    description: 'Paper saver with 25 rows per page, ideal for large inventory audits.',
    config: {
      ...DEFAULT_COUNT_SHEET_CONFIG,
      rowsPerPage: 25,
      rowHeightMm: 8.8,
      bodyFontSizePt: 7.8,
      skuFontSizePt: 7.8,
      descFontSizePt: 7.8,
      barcodeHeightMm: 6,
    },
  },
  {
    id: 'letter_20',
    name: 'Letter Size (20 Rows)',
    description: 'Standard 20 rows on US Letter paper (8.5 × 11 in / 216 × 279 mm).',
    config: {
      ...DEFAULT_COUNT_SHEET_CONFIG,
      paperSize: 'LETTER',
      rowsPerPage: 20,
      rowHeightMm: 10.2,
      columnWidths: {
        skuMm: 30,
        barcodeMm: 44,
        descMm: 88,
        countMm: 34,
      },
    },
  },
  {
    id: 'long_bond_25',
    name: 'Long Bond (25 Rows)',
    description: 'Optimized for 8.5 × 13 in Long Bond paper with 25 rows per sheet.',
    config: {
      ...DEFAULT_COUNT_SHEET_CONFIG,
      paperSize: 'LONG_BOND',
      rowsPerPage: 25,
      rowHeightMm: 10.8,
      columnWidths: {
        skuMm: 30,
        barcodeMm: 44,
        descMm: 88,
        countMm: 34,
      },
    },
  },
];

export function getCountSheetPaperDimensions(
  paperSize: PaperSize,
  customWidthMm: number,
  customHeightMm: number,
  orientation: 'portrait' | 'landscape'
) {
  let width = 210;
  let height = 297;

  if (paperSize === 'CUSTOM') {
    width = customWidthMm || 210;
    height = customHeightMm || 297;
  } else if (PAPER_SPECS[paperSize]) {
    width = PAPER_SPECS[paperSize].widthMm;
    height = PAPER_SPECS[paperSize].heightMm;
  }

  if (orientation === 'landscape') {
    return {
      widthMm: Math.max(width, height),
      heightMm: Math.min(width, height),
    };
  }

  return {
    widthMm: Math.min(width, height),
    heightMm: Math.max(width, height),
  };
}

/**
 * Data validation for Count Sheet items.
 * Strictly validates that an item contains at least one non-empty SKU, UPC, barcode,
 * or description to avoid phantom row generation from empty records.
 */
export function isValidCountSheetItem(item: InventoryItem | undefined | null): boolean {
  if (!item) return false;
  const sku = String(item.sku || '').trim();
  const upc = String(item.upcNo || '').trim();
  const barcode = String(item.barcode || '').trim();
  const desc = String(item.description || '').trim();
  return Boolean(sku || upc || barcode || desc);
}

/**
 * Group inventory items by locator
 */
export function groupItemsByLocator(items: InventoryItem[]): Record<string, InventoryItem[]> {
  const groups: Record<string, InventoryItem[]> = {};

  items.forEach(item => {
    const loc = String(item.locator || '').trim().toUpperCase() || 'UNASSIGNED';
    if (!groups[loc]) {
      groups[loc] = [];
    }
    if (isValidCountSheetItem(item)) {
      groups[loc].push(item);
    }
  });

  // Sort groups alphabetically by locator name, putting UNASSIGNED last if present
  const sortedLocators = Object.keys(groups).sort((a, b) => {
    if (a === 'UNASSIGNED') return 1;
    if (b === 'UNASSIGNED') return -1;
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  });

  const sortedGroups: Record<string, InventoryItem[]> = {};
  sortedLocators.forEach(loc => {
    sortedGroups[loc] = groups[loc];
  });

  return sortedGroups;
}

/**
 * Natural/alphanumeric sorting comparator for Count Sheet items.
 *
 * Rules:
 * - Supports sorting by SKU, DESCRIPTION, or BARCODE. (COUNT is excluded).
 * - Ascending: A -> Z (1 -> 9). Descending: Z -> A (9 -> 1).
 * - For SKU and Barcode, uses natural alphanumeric ordering so SKU-2 precedes SKU-10.
 * - Does NOT modify the source array. Returns a new shallow array.
 * - If field is 'original' or empty, returns original Excel sequence intact.
 */
export function sortInventoryItemsForCountSheet(
  items: InventoryItem[],
  field: CountSheetSortField = 'original',
  order: CountSheetSortOrder = 'asc'
): InventoryItem[] {
  if (!field || field === 'original') {
    return [...items];
  }

  const factor = order === 'desc' ? -1 : 1;

  return [...items].sort((a, b) => {
    let valA = '';
    let valB = '';

    if (field === 'sku') {
      valA = String(a.sku || a.id || '').trim();
      valB = String(b.sku || b.id || '').trim();
    } else if (field === 'description') {
      valA = String(a.description || '').trim();
      valB = String(b.description || '').trim();
    } else if (field === 'barcode') {
      valA = String(a.barcode || a.upcNo || '').trim();
      valB = String(b.barcode || b.upcNo || '').trim();
    }

    // Keep items with empty values at the very bottom
    if (!valA && !valB) return 0;
    if (!valA) return 1;
    if (!valB) return -1;

    return factor * valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
  });
}

/**
 * Paginate items by locator and rowsPerPage, with optional locator grouping, sorting,
 * and continuous page filling (mixLocators) for CYCLE COUNT / paper saving.
 */
export function paginateCountSheetItems(
  items: InventoryItem[],
  rowsPerPage: number = 20,
  filterLocator?: string | string[],
  sortField?: CountSheetSortField,
  sortOrder?: CountSheetSortOrder,
  mixLocators: boolean = false
): CountSheetPageData[] {
  const selectedItems = items.filter(it => it.isSelected !== false);
  const grouped = groupItemsByLocator(selectedItems);
  const pages: CountSheetPageData[] = [];

  let targetLocators: string[] = [];

  if (Array.isArray(filterLocator)) {
    const selectedSet = new Set(filterLocator);
    targetLocators = Object.keys(grouped).filter(loc => selectedSet.has(loc));
  } else if (filterLocator && filterLocator !== 'ALL') {
    targetLocators = Object.keys(grouped).filter(loc => loc === filterLocator);
  } else {
    targetLocators = Object.keys(grouped);
  }

  // 1. CYCLE COUNT CONTINUOUS MULTI-LOCATOR PAGE FILLING MODE
  if (mixLocators) {
    const allContinuousItems: InventoryItem[] = [];
    targetLocators.forEach(loc => {
      let locItems = (grouped[loc] || []).filter(isValidCountSheetItem);
      if (sortField && sortField !== 'original') {
        locItems = sortInventoryItemsForCountSheet(locItems, sortField, sortOrder || 'asc');
      }
      allContinuousItems.push(...locItems);
    });

    if (allContinuousItems.length === 0) {
      pages.push({
        pageNumber: 1,
        totalPagesForLocator: 1,
        globalPageIndex: 1,
        totalGlobalPages: 1,
        locator: targetLocators.length > 0 ? targetLocators[0] : 'ALL LOCATORS',
        locators: targetLocators,
        items: [],
        startIndex: 0,
        endIndex: 0,
      });
      return pages;
    }

    const safeRowsPerPage = Math.max(1, rowsPerPage);
    const totalGlobalPages = Math.max(1, Math.ceil(allContinuousItems.length / safeRowsPerPage));

    for (let p = 0; p < totalGlobalPages; p++) {
      const start = p * safeRowsPerPage;
      const end = Math.min(start + safeRowsPerPage, allContinuousItems.length);
      const pageItems = allContinuousItems.slice(start, end);
      const pageLocators = Array.from(
        new Set(pageItems.map(it => String(it.locator || '').trim().toUpperCase() || 'UNASSIGNED'))
      );

      let pageLocatorLabel = pageLocators.join(', ');
      if (pageLocators.length > 2) {
        pageLocatorLabel = `${pageLocators[0]} → ${pageLocators[pageLocators.length - 1]} (${pageLocators.length} Locators)`;
      } else if (pageLocators.length === 0) {
        pageLocatorLabel = 'ALL';
      }

      pages.push({
        pageNumber: p + 1,
        totalPagesForLocator: totalGlobalPages,
        globalPageIndex: p + 1,
        totalGlobalPages,
        locator: pageLocatorLabel,
        locators: pageLocators,
        items: pageItems,
        startIndex: start,
        endIndex: end,
      });
    }

    return pages;
  }

  // 2. STANDARD PCOUNT W2W PAGE BREAK BY LOCATOR MODE
  let globalPageIndex = 1;
  let totalGlobalPages = 0;
  targetLocators.forEach(loc => {
    const locItems = grouped[loc] || [];
    const locPages = Math.max(1, Math.ceil(locItems.length / Math.max(1, rowsPerPage)));
    totalGlobalPages += locPages;
  });

  targetLocators.forEach(loc => {
    let locItems = grouped[loc] || [];
    // Apply sorting strictly within this locator group
    if (sortField && sortField !== 'original') {
      locItems = sortInventoryItemsForCountSheet(locItems, sortField, sortOrder || 'asc');
    }

    const totalPagesForLoc = Math.max(1, Math.ceil(locItems.length / Math.max(1, rowsPerPage)));

    if (locItems.length === 0) {
      // Empty page for locator
      pages.push({
        pageNumber: 1,
        totalPagesForLocator: 1,
        globalPageIndex: globalPageIndex++,
        totalGlobalPages,
        locator: loc,
        locators: [loc],
        items: [],
        startIndex: 0,
        endIndex: 0,
      });
      return;
    }

    for (let p = 0; p < totalPagesForLoc; p++) {
      const start = p * rowsPerPage;
      const end = Math.min(start + rowsPerPage, locItems.length);
      const pageItems = locItems.slice(start, end);

      pages.push({
        pageNumber: p + 1,
        totalPagesForLocator: totalPagesForLoc,
        globalPageIndex: globalPageIndex++,
        totalGlobalPages,
        locator: loc,
        locators: [loc],
        items: pageItems,
        startIndex: start,
        endIndex: end,
      });
    }
  });

  return pages;
}

/**
 * Calculate count sheet summary statistics
 */
export function calculateCountSheetSummary(
  items: InventoryItem[],
  rowsPerPage: number = 20,
  mixLocators: boolean = false
): CountSheetSummary {
  const selectedItems = items.filter(it => it.isSelected !== false);
  const grouped = groupItemsByLocator(selectedItems);
  const locatorKeys = Object.keys(grouped);

  let totalPages = 0;
  let totalValidItems = 0;
  const locatorCounts = locatorKeys.map(loc => {
    const locItems = grouped[loc] || [];
    const count = locItems.length;
    totalValidItems += count;
    const pages = Math.max(1, Math.ceil(count / Math.max(1, rowsPerPage)));
    totalPages += pages;
    return { locator: loc, count, pages };
  });

  if (mixLocators) {
    totalPages = Math.max(1, Math.ceil(totalValidItems / Math.max(1, rowsPerPage)));
  }

  return {
    totalItems: totalValidItems,
    totalLocators: locatorKeys.length,
    rowsPerPage: Math.max(1, rowsPerPage),
    estimatedPages: totalPages,
    locatorCounts,
  };
}
