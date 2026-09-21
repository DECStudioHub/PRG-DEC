export interface InventoryItem {
  id: string;
  locator: string;
  sku: string;
  upcNo: string;
  description: string;
  barcode: string;
  count: number | string;
  counter: string;
  scanner: string;
  validator: string;
  isSelected?: boolean;
  rawRowIndex?: number;
}

export type IssueSeverity = 'error' | 'warning';

export interface ValidationIssue {
  id: string;
  itemId: string;
  row: number;
  field: keyof InventoryItem;
  fieldName: string;
  severity: IssueSeverity;
  message: string;
  value?: any;
}

export interface ValidationSummary {
  totalRows: number;
  validItems: number;
  warningItems: number;
  errorItems: number;
  issues: ValidationIssue[];
  missingRequiredColumns: string[];
  duplicateSKUs: string[];
  duplicateUPCs: string[];
}

export type BarcodeType = 'CODE128' | 'CODE39' | 'EAN13' | 'UPCA';

export type PaperSize = 'A4' | 'LETTER' | 'SHORT_BOND' | 'LONG_BOND' | 'LEGAL' | 'CUSTOM';

export interface PaperDimensions {
  widthMm: number;
  heightMm: number;
  label: string;
}

export interface LayoutConfig {
  paperSize: PaperSize;
  customWidthMm: number;
  customHeightMm: number;
  orientation: 'portrait' | 'landscape';
  columns: number;
  tagWidthMm: number;
  tagHeightMm: number;
  marginTopMm: number;
  marginBottomMm: number;
  marginLeftMm: number;
  marginRightMm: number;
  gapRowMm: number;
  gapColMm: number;
  barcodeType: BarcodeType;
  barcodeHeightMm: number;
  fontSizeDesc: number;
  fontSizeSku: number;
  fontSizeLocator: number;
  fontSizeFields: number;
  printBlankCountFields: boolean;
  showCutGuides: boolean;
  showBorders: boolean;
  showSessionHeader: boolean;
  headerStyle: 'filled' | 'bordered' | 'minimal';
  showLogo?: boolean;
  logoUrl?: string;
  logoHeightMm?: number;
  showTagNumber?: boolean;
  countBoxHeightMm?: number;
  countBoxWidthPercent?: number;
  countBoxGapTopMm?: number;
  countBoxFontSize?: number;
  countBoxBorderWidth?: number;
  barcodeWidthMm?: number;
  showBarcodeText?: boolean;
  // Locator Barcode Settings (v2.0.4)
  locatorBarcodeEnabled?: boolean;
  locatorBarcodeWidthMm?: number;
  locatorBarcodeHeightMm?: number;
  showLocatorText?: boolean;
}

export interface InventorySession {
  branch: string;
  store: string;
  inventoryDate: string;
  preparedBy: string;
  sessionNotes: string;
}

export type AppStep = 'import' | 'validate' | 'configure' | 'preview' | 'settings' | 'count_sheet';

export type AppModuleId = 'count_tag' | 'shelftag_pp';

export type ShelfTagStyle = 'white' | 'yellow';

export interface ShelfTagItem {
  id: string;
  tagStyle: ShelfTagStyle;
  description: string;
  promoHeader?: string;
  promoSubtext?: string;
  promoValidity?: string;
  sku: string;
  barcode: string;
  regularPrice: number;
  promoPrice?: number | null;
  unit: string;
  locator: string;
  category?: string;
  isSelected?: boolean;
  copies?: number;
  buyPerAndUp?: string;
  buyPer?: string | number;
  up?: string | number;
  tagDate?: string;
}

/**
 * Clean Separate Data Model for Module 2 Yellow Tag (Layout 2 reference)
 */
export interface YellowTagItem {
  id: string;
  upc: string;
  description: string;
  qty: number;
  price: number;
  copies: number;
  buy?: string; // system default: "BUY"
  uom?: string; // system default: "PCS AND UP"
  per?: string; // system default: "/PC"
  isSelected?: boolean;
}

/**
 * Clean Separate Data Model for Module 2 White Tag (Layout 2 reference)
 */
export interface WhiteTagItem {
  id: string;
  upc: string;
  description: string;
  price: number;
  sku: string;
  date: string;
  copies: number;
  isSelected?: boolean;
}

export type Module2ActiveTagType = 'yellow' | 'white';

export type Module2PresetId = 'standard' | 'compact' | 'medium' | 'large' | string;

export type YellowPaletteId = 'golden' | 'canary' | 'amber' | 'lemon';

export type Module2TagType = 'shelftag' | 'pp_tag';

export type TagFieldId =
  // Yellow Tag visual fields
  | 'upc'
  | 'description'
  | 'buy'
  | 'qty'
  | 'uom'
  | 'price'
  | 'per'
  // White Tag visual fields
  | 'barcode'
  | 'sku'
  | 'date'
  | 'logo'
  // Legacy field identifiers for backwards compatibility
  | 'regularPrice'
  | 'promoPrice'
  | 'priceUnit'
  | 'locator'
  | 'promoHeader'
  | 'buyPerAndUp'
  | 'tagDate';

export type TextTransformMode = 'none' | 'uppercase' | 'lowercase' | 'capitalize';

export interface TagFieldConfig {
  id: TagFieldId;
  name: string;
  visible: boolean;
  // Position & Dimensions in mm
  x: number;
  y: number;
  width: number;
  height: number;

  // Typography
  fontFamily: string;
  fontSizePt: number;
  fontWeight: 'normal' | 'medium' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  textColor?: string;

  // Alignment
  textAlign: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'middle' | 'bottom';

  // Text Transform & Wrapping
  textTransform: TextTransformMode;
  textWrap: boolean;
  maxLines: number;
  lineHeightPt?: number;

  // Border & Appearance
  borderStyle: 'none' | 'solid' | 'dashed' | 'dotted';
  borderWidthPx: number;
  borderRadiusMm: number;
  borderColor?: string;
  backgroundColor?: string;

  // Padding in mm
  paddingTopMm: number;
  paddingBottomMm: number;
  paddingLeftMm: number;
  paddingRightMm: number;

  // Specialized Settings
  barcodeFormat?: BarcodeType;
  showBarcodeLines?: boolean;
  showBarcodeText?: boolean;
  barcodeTextSizePt?: number;
  barcodeAlign?: 'left' | 'center' | 'right';

  currencySymbol?: string;
  showCurrencySymbol?: boolean;
  decimalPlaces?: number;
  strikeThrough?: boolean;
  prefixText?: string;

  locatorBadge?: boolean;
}

export interface TagLayoutPreset {
  id: string;
  name: string;
  tagType: Module2TagType;
  description?: string;
  isBuiltIn?: boolean;

  // Tag Dimensions
  tagWidthMm: number;
  tagHeightMm: number;

  // Sheet Layout Settings
  paperSize: PaperSize;
  orientation: 'portrait' | 'landscape';
  columns: number;
  rowGapMm: number;
  colGapMm: number;
  topMarginMm: number;
  sideMarginMm: number;
  customWidthMm?: number;
  customHeightMm?: number;

  // Style Settings
  yellowPalette: YellowPaletteId;
  currencySymbol: string;
  showBorder: boolean;
  showCutGuides: boolean;
  showLogo: boolean;
  promoHeader?: string;
  layoutOption?: 1 | 2;

  // Individual Field Configurations
  fields: Record<string, TagFieldConfig>;
}

export interface Module2Config {
  layoutOption?: 1 | 2; // 1 = Standard / Existing, 2 = Reference Layout
  presetId: Module2PresetId;
  tagWidthMm: number;
  tagHeightMm: number;
  columns: number;
  rows?: number;
  paperSize: PaperSize;
  orientation?: 'portrait' | 'landscape';
  customWidthMm: number;
  customHeightMm: number;
  rowGapMm: number;
  colGapMm: number;
  topMarginMm: number;
  bottomMarginMm?: number;
  sideMarginMm: number;
  leftMarginMm?: number;
  rightMarginMm?: number;
  centerColumns?: boolean;
  yellowPalette: YellowPaletteId;
  currencySymbol: string;
  barcodeFormat: BarcodeType;
  showStrikeThroughRegular: boolean;
  showCutGuides: boolean;
  showBorder: boolean;
  showLogo: boolean;

  // Added: Field Layout & Preset System
  activeTagType?: Module2TagType;
  shelftagConfig?: TagLayoutPreset;
  ppTagConfig?: TagLayoutPreset;
  shelftagPresets?: TagLayoutPreset[];
  ppTagPresets?: TagLayoutPreset[];
}

// Keep legacy Module2LayoutConfig alias for backwards compatibility
export type Module2LayoutConfig = Module2Config & {
  tagType?: 'shelftag' | 'pp_tag';
  orientation?: 'portrait' | 'landscape';
  marginTopMm?: number;
  marginBottomMm?: number;
  marginLeftMm?: number;
  marginRightMm?: number;
  gapRowMm?: number;
  gapColMm?: number;
  barcodeType?: BarcodeType;
  barcodeHeightMm?: number;
  fontSizeTitle?: number;
  fontSizeSku?: number;
  fontSizeUpc?: number;
  fontSizePrice?: number;
  fontSizeLocator?: number;
  defaultCopies?: number;
  itemCopies?: Record<string, number>;
  logoUrl?: string;
};

export type ColorPaletteId = 'emerald' | 'blue' | 'indigo' | 'crimson' | 'amber' | 'violet' | 'slate' | 'custom';

export interface ColorPaletteTheme {
  id: ColorPaletteId;
  name: string;
  description: string;
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryBorder: string;
  primaryText: string;
  ringColor: string;
  hex: string;
}

export interface SystemSettings {
  systemName: string;
  systemTagline: string;
  systemSubtitle: string;
  paletteId: ColorPaletteId;
  customPrimaryColor?: string;
  customLogoUrl: string | null;
  applyLogoToShelfTags: boolean;
}

// ----------------------------------------------------
// MODULE 1: COUNT SHEET TYPES
// ----------------------------------------------------

export type CountSheetColumnId = 'sku' | 'barcode' | 'description' | 'count';

export interface CountSheetColumnWidths {
  skuMm: number;
  barcodeMm: number;
  descMm: number;
  countMm: number;
}

export type CountSheetSortField = 'sku' | 'description' | 'barcode' | 'original';
export type CountSheetSortOrder = 'asc' | 'desc';

export interface CountSheetConfig {
  paperSize: PaperSize;
  customWidthMm: number;
  customHeightMm: number;
  orientation: 'portrait' | 'landscape';
  rowsPerPage: number;
  marginTopMm: number;
  marginBottomMm: number;
  marginLeftMm: number;
  marginRightMm: number;
  rowHeightMm: number;
  tableWidthPercent: number;
  columnWidths: CountSheetColumnWidths;

  // Sorting
  sortField?: CountSheetSortField;
  sortOrder?: CountSheetSortOrder;

  // Movable column sequence & visibility
  columnOrder?: CountSheetColumnId[];
  columnVisibility?: Record<CountSheetColumnId, boolean>;

  // Typography
  headerFontFamily: string;
  headerFontSizePt: number;
  headerFontWeight: 'normal' | 'medium' | 'bold';

  bodyFontFamily: string;
  bodyFontSizePt: number;

  skuFontSizePt: number;
  barcodeTextFontSizePt: number;
  descFontSizePt: number;
  countHeaderFontSizePt: number;

  // Description text wrapping
  wrapDescription: boolean;
  descMaxLines: number;
  descLineHeight: number;

  // Barcode Column
  showBarcodeGraphic: boolean;
  barcodeHeightMm: number;
  barcodeWidthMm?: number;
  barcodeFormat: BarcodeType;
  showBarcodeValueText: boolean;
  barcodeAlign: 'left' | 'center' | 'right';

  // Locator Barcode (Upper Right)
  showLocatorBarcode: boolean;
  locatorBarcodeFormat: BarcodeType;
  locatorBarcodeHeightMm: number;
  locatorBarcodeWidthScale: number;
  locatorBarcodeTextSizePt?: number;
  showLocatorBarcodeText: boolean;
  locatorBarcodeAlign?: 'left' | 'center' | 'right';

  // Table Border & Line Settings (Dedicated TABLE SETTINGS)
  tableBorderEnabled?: boolean;
  tableBorderWidthPx?: number;
  tableBorderStyle?: 'solid' | 'dashed' | 'dotted';
  tableBorderColor?: string;
  tableOuterBorder?: boolean;
  tableInnerHorizontalLines?: boolean;
  tableInnerVerticalLines?: boolean;
  tableHorizontalLineWidthPx?: number;
  tableVerticalLineWidthPx?: number;

  // Header Settings
  tableHeaderBorder?: boolean;
  tableHeaderBorderWidthPx?: number;
  tableHeaderAlign?: 'left' | 'center' | 'right';

  // Body Settings
  tableBodyBorder?: boolean;
  tableBodyBorderWidthPx?: number;
  tableBodyAlign?: 'left' | 'center' | 'right';

  // Layout & Table Features
  showGridLines: boolean;
  borderWidthPx: number;
  showRowNumbers: boolean;
  showSignatures: boolean;
  showStoreHeader: boolean;
  showPageNumbers: boolean;
  emptyRowsToFillPage?: boolean;
}

export interface CountSheetPreset {
  id: string;
  name: string;
  description: string;
  isDefault?: boolean;
  config: CountSheetConfig;
}

export interface CountSheetPageData {
  pageNumber: number;
  totalPagesForLocator: number;
  globalPageIndex: number;
  totalGlobalPages: number;
  locator: string;
  items: InventoryItem[];
  startIndex: number;
  endIndex: number;
}

export interface CountSheetSummary {
  totalItems: number;
  totalLocators: number;
  rowsPerPage: number;
  estimatedPages: number;
  locatorCounts: { locator: string; count: number; pages: number }[];
}

