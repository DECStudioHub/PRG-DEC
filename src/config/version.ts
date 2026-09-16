/**
 * Authoritative DEC System Version & Release History Configuration
 * 
 * This file serves as the single source of truth for application versioning,
 * release dates, update notes, and historical milestones.
 * 
 * To release a new version in the future:
 * Simply prepend a new SystemRelease object to the DEC_RELEASES array.
 * The system automatically sets CURRENT_VERSION, DISPLAY_VERSION, and the
 * Latest Update notes from the first entry.
 */

export type ReleaseType = 'major' | 'minor' | 'patch';

export interface ReleaseChangeItem {
  type: 'feature' | 'improvement' | 'fix';
  text: string;
}

export interface SystemRelease {
  version: string;
  releaseDate: string;
  releaseType: ReleaseType;
  title: string;
  summary: string;
  highlights: string[];
  changes?: ReleaseChangeItem[];
}

export const SYSTEM_PREFIX = 'DEC';
export const SYSTEM_FULL_NAME = 'Digital Efficiency & Continuity System';
export const SYSTEM_SUBTITLE = 'Backup • Continuity • Alternative Process • Process Improvement';

export const DEC_RELEASES: SystemRelease[] = [
  {
    version: '2.0.3',
    releaseDate: 'September 15, 2026',
    releaseType: 'minor',
    title: 'DEC System Branding, Module 2 Workflow Separation & Physical Copy Expansion',
    summary:
      'Official DEC v2.0.3 release branding the system as DEC (Digital Efficiency & Continuity System), renaming Module 1 to PCOUNT W2W, separating Yellow Tag and White Tag workflows with dedicated Excel templates and validation, updating Yellow Tag column header to BUY, fixing physical per-item copy expansion, setting Layout Option 2 as permanent default, and integrating the human-imagination disclaimer.',
    highlights: [
      'Official branding as DEC (Digital Efficiency & Continuity System) with creator attribution to DECStudioAiCreation.',
      'Added human imagination disclaimer to Welcome UI modal and guidance views.',
      'Renamed Module 1 visible navigation to PCOUNT W2W while preserving all core inventory counting features.',
      'Refactored Module 2 into a 5-step clean retail workflow with dedicated Yellow Tag and White Tag pathways.',
      'Yellow Tag Table: updated visible column header from QTY to BUY reflecting promotional bulk thresholds.',
      'Fixed physical copy expansion: each item\'s COPIES count physically renders distinct tag instances in preview, browser print, and PDF.',
      'Established Layout Option 2 as the permanent default layout with physical millimeter coordinates.',
      'Isolated Yellow and White tag import logic, data structures, validation rules, and templates.',
      'Ensured robust row delete operations with zero UI freezing or stale state references.',
    ],
    changes: [
      { type: 'feature', text: 'System rebranded to DEC with tagline and creator DECStudioAiCreation' },
      { type: 'feature', text: 'Added creator disclaimer: "I’m not a programmer. I’m a human with a bold imagination—and AI is the tool that brings my ideas to life."' },
      { type: 'feature', text: 'Renamed Module 1 visible navigation to PCOUNT W2W' },
      { type: 'improvement', text: 'Updated Yellow Tag table visible column header to BUY' },
      { type: 'fix', text: 'Fixed physical copies expansion to duplicate tags across preview, print, and PDF' },
      { type: 'fix', text: 'Fixed Yellow and White tag delete actions to prevent stale state issues' },
      { type: 'improvement', text: 'Layout Option 2 established as permanent active default' },
    ],
  },
  {
    version: '2.0.2',
    releaseDate: 'September 14, 2026',
    releaseType: 'minor',
    title: 'Complete Module 2 Restructure & Redesign, PCOUNT W2W Parity',
    summary:
      'Official DEC v2.0.2 release introducing full architectural consolidation of Module 2 (ShelfTag / PP Tag), separate Yellow and White tag import workflows and templates, physical millimeter-accurate Tag Field Editor, unified renderer across Preview, Print, and PDF, and Module 1 renaming to PCOUNT W2W.',
    highlights: [
      'Renamed Module 1 visible navigation to PCOUNT W2W while preserving all core inventory counting features.',
      'Completely restructured Module 2 into a 5-step clean retail workflow.',
      'Dedicated Yellow Tag & White Tag selection with isolated Excel templates, data models, validation, and tables.',
      'Yellow Tag: UPC, Description, QTY, Price, Copies with system default BUY, UOM (PCS AND UP), PER (/PC).',
      'White Tag: UPC/Barcode, Description, Price, SKU, Date (today\'s date if empty), Copies, and Store Logo.',
      'Redesigned Layout Option 2 as the permanent default with physical millimeter coordinates.',
      'Fixed Piso sign (₱) alignment and print preview baseline stability.',
      'Eliminated duplicate editors, buttons, and redundant configurations.',
      'Unified single TagRenderer engine ensuring 100% exact parity across Editor, Sheet Preview, Print, and PDF.',
    ],
    changes: [
      { type: 'feature', text: 'Renamed visible Module 1 title to PCOUNT W2W' },
      { type: 'feature', text: 'Separated Yellow Tag and White Tag imports, data models, and Excel templates' },
      { type: 'feature', text: 'Established Layout Option 2 as the permanent default layout for Module 2' },
      { type: 'improvement', text: 'Unified visual tag field editor with millimeter-accurate drag, resize, zoom, and live data rendering' },
      { type: 'fix', text: 'Fixed Yellow Tag and White Tag Piso currency symbol alignment for screen and browser print output' },
    ],
  },
  {
    version: '2.0.1',
    releaseDate: 'September 12, 2026',
    releaseType: 'patch',
    title: 'Module 2 Layout Option 2 (Reference Layout) & Per-SKU Copy Quantity',
    summary:
      'Official DEC v2.0.1 release introducing ShelfTag / PP Tag Layout Option 2 based on physical reference standards, per-SKU print copy quantities, and Count Sheet ink-saving print parity.',
    highlights: [
      'Added Layout Option 2 for ShelfTag / PP Tag.',
      'Added reference-based Yellow Tag layout.',
      'Added reference-based White Tag layout.',
      'Yellow Tag includes Description, Barcode, customizable Buy Per and Up, Price and Unit.',
      'White Tag includes Description, Date, Price, Prince Retail Logo, Barcode and SKU.',
      'Added independent Layout Option 2 configuration while preserving existing Layout Option 1.',
      'Added preset compatibility for the new layout.',
      'Added print/PDF support for the new layout.',
      'Added per-SKU / Item Copy Quantity for Layout Option 2.',
      'Users can specify how many physical copies of an individual item should be printed.',
      'Copy Quantity applies to both Yellow Tag and White Tag.',
      'Added total physical tag quantity calculation.',
      'Copy quantities are applied during print generation without modifying the original Excel data.',
      'Print, Preview and PDF use the same copy-generation logic.',
    ],
    changes: [
      { type: 'feature', text: 'Added Layout Option 2 (Reference Layout) alongside existing Layout Option 1 for ShelfTag / PP Tag' },
      { type: 'feature', text: 'Implemented Reference Yellow Tag layout with Description, Barcode, Buy Per and Up, Price, and Unit' },
      { type: 'feature', text: 'Implemented Reference White Tag layout with Description, Date, Price, Prince Retail Logo, Barcode, and SKU' },
      { type: 'feature', text: 'Added per-SKU / Item Copy Quantity for Layout Option 2 with automatic physical sheet and tag calculations' },
      { type: 'improvement', text: 'Preserved original imported Excel data while dynamically expanding copies during print and PDF generation' },
      { type: 'fix', text: 'Maintained parity across screen preview, browser print, and vector PDF rendering for all copy counts' },
    ],
  },
  {
    version: '2.0.0',
    releaseDate: 'September 12, 2026',
    releaseType: 'major',
    title: 'Platform Consolidation & Intelligent Paper-Saving Engine',
    summary:
      'Official DEC v2.0.0 milestone consolidating dual-module inventory workflows, paper-saving slot packing, theme customization, and validated system backup.',
    highlights: [
      'Filter Locator for Count Tags: Filter and print specific locators with Select All, Clear All, Invert, and live tag count tracking without altering original Excel data',
      'Count Tag Printed Indicator: Dynamic tracking of printed locators across browser print and PDF export with full reprint support and print status reset',
      'Optimized Count Sheet Rows: Rows per page is now treated as a maximum, eliminating forced empty rows and tightening table borders to actual items',
      'Independent Barcode Width: Precision barcode width control in millimeters, rendered consistently across screen preview, browser print, and PDF',
      'Production Print Fix for GitHub Pages: Correctly resolved stylesheet links and base URLs for reliable printing under repository subpath deployments',
      'Guaranteed Logo Rendering: Vector Prince Retail logo fallback and custom data URL support ensures logos never go missing during printing or export',
      'Intelligent Count Tag Packing: Eliminates wasted tag slots by grouping items by locator and packing sheets efficiently',
      'Dual-Module Operations: Seamless switching between Physical Inventory Count Tags/Sheets and Retail ShelfTag / Promo PP Tags',
    ],
    changes: [
      { type: 'feature', text: 'Added Filter Locator panel to Count Tags with checkboxes, select all/clear, and real-time page count' },
      { type: 'feature', text: 'Added Printed Indicator badge system for Count Tags with reprint ability and reset option' },
      { type: 'feature', text: 'Added independent Barcode Width setting (in mm) for Count Tags with PDF and print parity' },
      { type: 'improvement', text: 'Removed forced empty row rendering on Count Sheets, respecting rows per page as a maximum' },
      { type: 'fix', text: 'Fixed GitHub Pages production print layout by fully qualifying stylesheet links and document base URI' },
      { type: 'fix', text: 'Fixed store logo display during print and PDF generation with inline vector SVG fallback' },
    ],
  },
  {
    version: '1.4.0',
    releaseDate: 'August 2026',
    releaseType: 'minor',
    title: 'System Settings, Color Palettes & JSON Backup',
    summary:
      'Introduced centralized system settings, dynamic color themes, custom logo management, and complete JSON system backup.',
    highlights: [
      'Settings Hub with live theme color palette switching (Emerald, Sapphire, Indigo, Crimson, Amber, Violet, Slate)',
      'Custom logo upload with URL input, presets, and safe SVG inline fallback',
      'Full JSON backup and restore with schemaVersion 2.0 validation',
      'Welcome guide dialog with persistent dismissal option',
    ],
  },
  {
    version: '1.3.0',
    releaseDate: 'July 2026',
    releaseType: 'minor',
    title: 'Tabular Count Sheet Subsystem & Barcode Sorting',
    summary:
      'Added dedicated Count Sheet generator with movable columns, locator-based sheet splitting, and summary barcodes.',
    highlights: [
      'Movable and toggleable table columns (SKU, Barcode, Description, Count)',
      'Automatic sheet splitting by store locator with header summary barcodes',
      'Alphabetical and SKU-based inventory sorting with asc/desc toggle',
      'Customizable table grid lines, row heights, and font scaling',
    ],
  },
  {
    version: '1.2.0',
    releaseDate: 'June 2026',
    releaseType: 'minor',
    title: 'Retail ShelfTag & Promo PP Tag Visual Designer',
    summary:
      'Introduced visual drag-and-drop coordinate editor for regular White Tags and promotional Yellow PP Tags.',
    highlights: [
      'Interactive coordinate field editor with millimeter precision (X, Y, W, H)',
      'White Tag regular pricing and Yellow Tag promotional formats with validity dates',
      'Multi-tag side-by-side comparison view and customizable layout presets',
      'Dedicated Module 2 PDF generation and print layouts',
    ],
  },
  {
    version: '1.0.0',
    releaseDate: 'May 2026',
    releaseType: 'major',
    title: 'Foundational PRG ShelfTag & Barcode Generator',
    summary:
      'Initial release featuring Excel spreadsheet import, barcode generation, validation, and PDF export.',
    highlights: [
      'Excel spreadsheet import (.xlsx, .xls) with multi-column auto-detection',
      'Real-time data validation for duplicate SKUs, missing UPCs, and required fields',
      '4-step wizard workflow (Import, Validate, Configure, Preview)',
      'Standard barcode rendering using CODE128 and EAN13 symbologies',
    ],
  },
];

// Single authoritative derived exports
export const CURRENT_RELEASE = DEC_RELEASES[0];
export const CURRENT_VERSION = CURRENT_RELEASE.version;
export const DISPLAY_VERSION = `${SYSTEM_PREFIX} v${CURRENT_VERSION}`;
export const SHORT_VERSION = `v${CURRENT_VERSION}`;
export const PREVIOUS_RELEASES = DEC_RELEASES.slice(1);
