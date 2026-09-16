import { Module2Config, PaperSize } from '../types';

export interface PaperSpec {
  id: PaperSize;
  name: string;
  widthMm: number;
  heightMm: number;
  description: string;
}

export const PAPER_SPECS: Record<PaperSize, PaperSpec> = {
  A4: {
    id: 'A4',
    name: 'A4',
    widthMm: 210,
    heightMm: 297,
    description: '210 × 297 mm (Standard International)',
  },
  SHORT_BOND: {
    id: 'SHORT_BOND',
    name: 'Short Bond',
    widthMm: 215.9,
    heightMm: 279.4,
    description: '8.5 × 11 in / 216 × 279 mm (Short Bond)',
  },
  LETTER: {
    id: 'LETTER',
    name: 'Letter',
    widthMm: 215.9,
    heightMm: 279.4,
    description: '8.5 × 11 in / 216 × 279 mm (Letter)',
  },
  LONG_BOND: {
    id: 'LONG_BOND',
    name: 'Long Bond',
    widthMm: 215.9,
    heightMm: 330.2,
    description: '8.5 × 13 in / 216 × 330 mm (Folio / Long Bond)',
  },
  LEGAL: {
    id: 'LEGAL',
    name: 'Legal',
    widthMm: 215.9,
    heightMm: 355.6,
    description: '8.5 × 14 in / 216 × 356 mm (US Legal)',
  },
  CUSTOM: {
    id: 'CUSTOM',
    name: 'Custom',
    widthMm: 210,
    heightMm: 297,
    description: 'Custom Dimensions',
  },
};

export const PAPER_OPTIONS: PaperSpec[] = [
  PAPER_SPECS.A4,
  PAPER_SPECS.SHORT_BOND,
  PAPER_SPECS.LETTER,
  PAPER_SPECS.LONG_BOND,
  PAPER_SPECS.LEGAL,
  PAPER_SPECS.CUSTOM,
];

export interface ShelftagLayoutInputs {
  paperSize: PaperSize;
  orientation?: 'portrait' | 'landscape';
  customWidthMm?: number;
  customHeightMm?: number;
  tagWidthMm: number;
  tagHeightMm: number;
  columns?: number;
  rows?: number;
  colGapMm: number; // Horizontal gap
  rowGapMm: number; // Vertical gap
  topMarginMm: number;
  bottomMarginMm?: number;
  leftMarginMm?: number;
  rightMarginMm?: number;
  sideMarginMm?: number;
  centerColumns?: boolean;
  totalItems?: number;
}

export interface TagPlacementCoordinate {
  indexOnPage: number;
  col: number; // 0, 1, 2
  row: number; // 0, 1, ...
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
}

export interface ShelftagSheetLayout {
  paperName: string;
  paperWidthMm: number;
  paperHeightMm: number;
  orientation: 'portrait' | 'landscape';

  // Configured margins in mm
  topMarginMm: number;
  bottomMarginMm: number;
  leftMarginMm: number;
  rightMarginMm: number;

  // Available printable area
  availableWidthMm: number;
  availableHeightMm: number;

  // Tag dimensions & column configuration
  tagWidthMm: number;
  tagHeightMm: number;
  columns: number; // 3
  colGapMm: number; // Horizontal gap between columns
  rowGapMm: number; // Vertical gap between rows

  // Horizontal calculation & centering
  requiredWidthMm: number;
  fitsWidth: boolean;
  differenceMm: number;
  overflowAmountMm: number;
  extraHorizontalSpaceMm: number;
  effectiveLeftMarginMm: number;

  // Vertical calculation
  maxRows: number;
  requiredHeightMm: number;
  fitsHeight: boolean;

  // Tag capacity & pages
  tagsPerSheet: number;
  totalItems: number;
  totalPages: number;

  // Status & warning indicators
  status: 'fits' | 'overflow';
  statusBadgeText: string;
  statusBadgeType: 'success' | 'danger';
  warningMessage?: string;
  detailsMessage?: string;

  // Positioning helper
  getTagPlacement: (indexOnPage: number) => TagPlacementCoordinate;
}

/**
 * Shared Layout Calculation Engine for Module 2 ShelfTag & PP Tag
 * Used synchronously by:
 * 1. Live Sheet Preview Tab
 * 2. Standalone Browser Print CSS (@media print)
 * 3. jsPDF Generation Service (shelftagPdfService)
 */
export function computeShelftagSheetLayout(
  inputs: ShelftagLayoutInputs | Module2Config,
  totalItemsCount = 0
): ShelftagSheetLayout {
  const paperSize = inputs.paperSize || 'LETTER';
  const orientation = (inputs.orientation as 'portrait' | 'landscape') || 'portrait';

  // 1. Determine raw physical paper dimensions
  let baseWidthMm = 215.9;
  let baseHeightMm = 279.4;
  let paperName = 'Letter';

  const spec = PAPER_SPECS[paperSize] || PAPER_SPECS.LETTER;
  paperName = spec.name;

  if (paperSize === 'CUSTOM') {
    baseWidthMm = Math.max(50, Number(inputs.customWidthMm) || 215.9);
    baseHeightMm = Math.max(50, Number(inputs.customHeightMm) || 279.4);
  } else {
    baseWidthMm = spec.widthMm;
    baseHeightMm = spec.heightMm;
  }

  // 2. Adjust for Portrait vs Landscape
  const paperWidthMm = orientation === 'landscape' ? Math.max(baseWidthMm, baseHeightMm) : Math.min(baseWidthMm, baseHeightMm);
  const paperHeightMm = orientation === 'landscape' ? Math.min(baseWidthMm, baseHeightMm) : Math.max(baseWidthMm, baseHeightMm);

  // 3. Resolve Margins
  const topMarginMm = Math.max(0, Number(inputs.topMarginMm) || 8);
  const bottomMarginMm = Math.max(0, Number(inputs.bottomMarginMm ?? inputs.topMarginMm) || 8);
  const sideMarginFallback = Number(inputs.sideMarginMm) || 5;
  const leftMarginMm = Math.max(0, Number(inputs.leftMarginMm ?? sideMarginFallback) || 5);
  const rightMarginMm = Math.max(0, Number(inputs.rightMarginMm ?? sideMarginFallback) || 5);

  // 4. Resolve Tag Geometry (default target 3 columns)
  const columns = Math.max(1, Number(inputs.columns) || 3);
  const tagWidthMm = Math.max(20, Number(inputs.tagWidthMm) || 60);
  const tagHeightMm = Math.max(15, Number(inputs.tagHeightMm) || 42);
  const colGapMm = Math.max(0, Number(inputs.colGapMm) || 3);
  const rowGapMm = Math.max(0, Number(inputs.rowGapMm) || 3);

  // 5. Available Printable Space
  const availableWidthMm = Math.max(0, paperWidthMm - leftMarginMm - rightMarginMm);
  const availableHeightMm = Math.max(0, paperHeightMm - topMarginMm - bottomMarginMm);

  // 6. Horizontal Space Calculation
  // Required Width = columns * tagWidth + (columns - 1) * colGap
  const requiredWidthMm = columns * tagWidthMm + (columns - 1) * colGapMm;
  const roundedRequired = Number(requiredWidthMm.toFixed(2));
  const roundedAvailable = Number(availableWidthMm.toFixed(2));

  // 0.05mm float tolerance to avoid false positives on rounding
  const fitsWidth = roundedRequired <= roundedAvailable + 0.05;
  const differenceMm = Number((roundedRequired - roundedAvailable).toFixed(2));
  const overflowAmountMm = fitsWidth ? 0 : Math.max(0, differenceMm);

  // Centering: If space remains and centerColumns is enabled (default true)
  const shouldCenter = inputs.centerColumns !== false;
  const extraHorizontalSpaceMm = Math.max(0, roundedAvailable - roundedRequired);
  const effectiveLeftMarginMm = fitsWidth && shouldCenter
    ? leftMarginMm + extraHorizontalSpaceMm / 2
    : leftMarginMm;

  // 7. Automatic & Explicit Row Calculation
  // Available Height = Paper Height - Top Margin - Bottom Margin
  // Max Rows = floor((Available Height + rowGap) / (tagHeight + rowGap))
  const calculatedMaxRows = Math.max(
    1,
    Math.floor((availableHeightMm + rowGapMm) / (tagHeightMm + rowGapMm))
  );
  const explicitRows = Number((inputs as any).rows) || 0;
  // If rows is explicitly set (e.g. 5 for 3x5 or 6 for 3x6), respect it if it fits the printable area
  const maxRows = explicitRows > 0 ? Math.min(explicitRows, calculatedMaxRows) : calculatedMaxRows;
  const requiredHeightMm = maxRows * tagHeightMm + (maxRows - 1) * rowGapMm;
  const fitsHeight = requiredHeightMm <= availableHeightMm + 0.05;

  // 8. Capacity & Estimated Sheets (Columns * Rows = Tags Per Sheet, e.g. 3 x 6 = 18 tags/sheet)
  const tagsPerSheet = columns * maxRows;
  const totalItems = totalItemsCount || (inputs as any).totalItems || 0;
  const totalPages = Math.max(1, Math.ceil(Math.max(1, totalItems) / tagsPerSheet));

  // 9. Status Indicators
  const status: 'fits' | 'overflow' = fitsWidth ? 'fits' : 'overflow';
  const statusBadgeText = fitsWidth
    ? '✓ 3-Column Layout Fits'
    : '⚠️ 3-Column Layout Exceeds Printable Width';
  const statusBadgeType: 'success' | 'danger' = fitsWidth ? 'success' : 'danger';

  const warningMessage = !fitsWidth
    ? '⚠️ 3-column layout does not fit the selected paper size.'
    : undefined;

  const detailsMessage = !fitsWidth
    ? `Required Width: ${roundedRequired.toFixed(1)} mm | Available Width: ${roundedAvailable.toFixed(1)} mm | Difference: +${differenceMm.toFixed(1)} mm`
    : undefined;

  // 10. Placement Coordinate Resolver
  const getTagPlacement = (indexOnPage: number): TagPlacementCoordinate => {
    const col = indexOnPage % columns;
    const row = Math.floor(indexOnPage / columns);

    const xMm = effectiveLeftMarginMm + col * (tagWidthMm + colGapMm);
    const yMm = topMarginMm + row * (tagHeightMm + rowGapMm);

    return {
      indexOnPage,
      col,
      row,
      xMm: Number(xMm.toFixed(2)),
      yMm: Number(yMm.toFixed(2)),
      widthMm: tagWidthMm,
      heightMm: tagHeightMm,
    };
  };

  return {
    paperName,
    paperWidthMm,
    paperHeightMm,
    orientation,
    topMarginMm,
    bottomMarginMm,
    leftMarginMm,
    rightMarginMm,
    availableWidthMm: roundedAvailable,
    availableHeightMm: Number(availableHeightMm.toFixed(2)),
    tagWidthMm,
    tagHeightMm,
    columns,
    colGapMm,
    rowGapMm,
    requiredWidthMm: roundedRequired,
    fitsWidth,
    differenceMm,
    overflowAmountMm,
    extraHorizontalSpaceMm: Number(extraHorizontalSpaceMm.toFixed(2)),
    effectiveLeftMarginMm: Number(effectiveLeftMarginMm.toFixed(2)),
    maxRows,
    requiredHeightMm: Number(requiredHeightMm.toFixed(2)),
    fitsHeight,
    tagsPerSheet,
    totalItems,
    totalPages,
    status,
    statusBadgeText,
    statusBadgeType,
    warningMessage,
    detailsMessage,
    getTagPlacement,
  };
}
