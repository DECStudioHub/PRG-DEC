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

export interface FeatureCredit {
  feature: string;
  description?: string;
  suggestedBy: string;
  purpose?: string;
}

export interface SystemRelease {
  version: string;
  releaseDate: string;
  releaseType: ReleaseType;
  title: string;
  summary: string;
  highlights: string[];
  changes?: ReleaseChangeItem[];
  credit?: FeatureCredit;
}

export const SYSTEM_PREFIX = 'DEC';
export const SYSTEM_FULL_NAME = 'Digital Efficiency & Continuity System';
export const SYSTEM_SUBTITLE = 'Backup • Continuity • Alternative Process • Process Improvement';

export const DEC_RELEASES: SystemRelease[] = [
  {
    version: '2.0.7',
    releaseDate: 'September 29, 2026',
    releaseType: 'minor',
    title: 'CYCLE COUNT Module & Count Sheet Workflow Enhancements',
    summary:
      'Official DEC v2.0.7 release introducing the dedicated CYCLE COUNT primary module with continuous multi-locator page-filling optimization, unified central Excel dataset sharing, and major Count Sheet workflow enhancements credited to Richard Banquillo: scannable locator barcode column, dedicated PRE COUNT column, FINAL COUNT write-in, removal of upper-right locator clutter, and clean unmixed SKU columns.',
    highlights: [
      'Added third primary navigation module: CYCLE COUNT alongside PCOUNT W2W and SHELFTAG / PP TAG.',
      'Count Sheet Sequence standardized to: # | LOCATOR | SKU | BARCODE | DESCRIPTION | PRE COUNT | FINAL COUNT.',
      'Scannable Barcode Line in LOCATOR table column: handheld scanners can scan bin/shelf locators directly from the physical count sheet.',
      'Removed Upper-Right Locator Barcode and Human-Readable Locator Text on Cycle Count countsheets to prevent confusion across multi-locator pages.',
      'Unmixed SKU Column: strictly renders product SKU without mixing locator tags into the SKU cell.',
      'Added PRE COUNT Column: dedicated write-in field for initial pre-counts alongside FINAL COUNT.',
      'Changed COUNT Column header to FINAL COUNT for clear audit demarcation.',
      'Continuous Page-Filling (Multi-Locator Packing) for Cycle Count Sheets to eliminate blank bond paper waste.',
      'Centralized Excel Import: single authoritative dataset shared across PCOUNT W2W and CYCLE COUNT without duplicate uploads.',
      'Independent Layout & Print configurations for PCOUNT W2W and CYCLE COUNT with dedicated localStorage persistence.',
      'All changes under version v2.0.7 officially credited to Richard Banquillo.',
    ],
    changes: [
      { type: 'feature', text: 'Added dedicated CYCLE COUNT primary module with continuous fill' },
      { type: 'feature', text: 'Added Scannable Barcode Line to Count Sheet LOCATOR column' },
      { type: 'feature', text: 'Added PRE COUNT write-in column to Count Sheet' },
      { type: 'improvement', text: 'Renamed COUNT Column to FINAL COUNT' },
      { type: 'improvement', text: 'Standardized Count Sheet column sequence (# | LOCATOR | SKU | BARCODE | DESCRIPTION | PRE COUNT | FINAL COUNT)' },
      { type: 'improvement', text: 'Removed Upper-Right Locator Barcode & Human-Readable Locator Text on Cycle Count countsheets' },
      { type: 'fix', text: 'Separated SKU and Locator text (strictly unmixed under SKU column)' },
      { type: 'feature', text: 'Implemented Central Shared Excel Import architecture' },
      { type: 'improvement', text: 'Independent configuration persistence for PCOUNT W2W and CYCLE COUNT' },
    ],
    credit: {
      feature: 'CYCLE COUNT Module & Count Sheet Workflow Enhancements',
      description:
        'Proposed and guided the dedicated CYCLE COUNT Module and Count Sheet workflow enhancements under DEC v2.0.7: continuous multi-locator page filling, dedicated LOCATOR table column with scannable barcode lines, removal of upper-right locator clutter, addition of PRE COUNT column, renaming COUNT to FINAL COUNT, standardizing sequence (# | LOCATOR | SKU | BARCODE | DESCRIPTION | PRE COUNT | FINAL COUNT), and separating SKU from locator text.',
      suggestedBy: 'Richard Banquillo',
      purpose: 'Optimize store cycle counting audits, eliminate bond paper waste, enable direct locator barcode scanning from sheets, and provide dedicated PRE COUNT and FINAL COUNT recording columns.',
    },
  },
  {
    version: '2.0.6',
    releaseDate: 'September 28, 2026',
    releaseType: 'minor',
    title: 'PCOUNT W2W Count Tag DEPT CODE Enhancement',
    summary:
      'Official DEC v2.0.6 release upgrading PCOUNT W2W Count Tags with DEPT CODE support, including downloadable 5-column Excel template (LOCATOR, SKU, UPC, DESCRIPTION, DEPT CODE), visual DEPT CODE rendering directly below the Sequential Tag Number, and a dedicated Show DEPT CODE ON/OFF toggle setting.',
    highlights: [
      'Added DEPT CODE support to PCOUNT W2W Count Tag data model and Excel importer.',
      'Updated downloadable Count Tag Excel Template to exactly 5 columns: LOCATOR, SKU, UPC, DESCRIPTION, DEPT CODE.',
      'Added DEPT CODE display directly below Sequential Tag Number on Count Tags.',
      'Added Show DEPT CODE ON/OFF setting (Default: ON) in Step 3 Count Tag Layout & Display Settings.',
      'Default DEPT CODE display is ON, with instantaneous Live Preview, Native Print, and Vector PDF reactivity.',
      'Preserved all existing PCOUNT W2W Count Tag features (Locator Barcodes, 9 tags/page optimization, sorting, COPIES, filtering).',
      'Credited feature enhancement to John Lord Sarte in Credit & Contribution.',
    ],
    changes: [
      { type: 'feature', text: 'Added DEPT CODE to PCOUNT W2W Count Tag data model and Excel importer' },
      { type: 'feature', text: 'Updated downloadable Count Tag Excel Template to 5 columns: LOCATOR, SKU, UPC, DESCRIPTION, DEPT CODE' },
      { type: 'feature', text: 'Added DEPT CODE display directly below Sequential Tag Number' },
      { type: 'feature', text: 'Added Show DEPT CODE ON/OFF setting (Default: ON)' },
      { type: 'improvement', text: 'Maintained 100% visual parity across Live Preview, Native Browser Print, and Vector PDF' },
      { type: 'improvement', text: 'Backward compatibility for legacy 4-column templates and blank department codes' },
    ],
    credit: {
      feature: 'PCOUNT W2W Count Tag — DEPT CODE',
      description:
        'Added DEPT CODE support to Count Tags, including downloadable Excel template support, Count Tag display below the Sequential Tag Number, and a Show/Hide display control.',
      suggestedBy: 'John Lord Sarte',
      purpose: 'Allow store users to identify product departments on printed Count Tags directly beneath the sequential tag number.',
    },
  },
  {
    version: '2.0.5',
    releaseDate: 'September 22, 2026',
    releaseType: 'minor',
    title: 'Count Tag Page Optimization (9 Count Tags / Page) & Bond Paper Saving',
    summary:
      'DEC v2.0.5 introduces intelligent Count Tag page packing optimization to maximize bond paper utilization by filling up to 9 physical Count Tags per page, utilizing remaining space with Count Tags from the next Locator when necessary, and honoring expanded tag quantities after COPIES are applied.',
    highlights: [
      'Optimized Count Tag printing to maximize the use of available Bond Paper by packing up to 9 physical Count Tags per page.',
      'Count Tags now populate up to 9 tags per page across pages, utilizing remaining space with Count Tags from the next sequential Locator when required.',
      'Preserves Locator grouping integrity and A-to-Z item Description sorting within each Locator.',
      'Seamlessly supports the COPIES field: pagination accurately utilizes the physical Count Tag instances after copies expansion.',
      'Maintains 100% visual and structural parity across Preview, Browser Print, and Vector PDF generation.',
      'Maintains individual tag Locators, barcodes, SKUs, UPCs, and descriptions without disruption.',
      'Introduced feature credit acknowledgment system for user-suggested enhancements.',
    ],
    changes: [
      { type: 'feature', text: '9 Count Tags Per Page Print Optimization maximizing bond paper usage' },
      { type: 'improvement', text: 'Consecutive locator filling: remaining page slots populated from next sequential locator' },
      { type: 'improvement', text: 'Full integration with physical COPIES expansion and locator filtering' },
      { type: 'improvement', text: 'Unified pagination engine across Preview, Standalone Print, and Vector PDF' },
    ],
    credit: {
      feature: '9 Count Tags Per Page Print Optimization',
      purpose: 'Maximize Bond Paper usage by filling up to 9 Count Tags per page.',
      description:
        'Optimized Count Tag pagination to use available Bond Paper space more efficiently by filling up to 9 physical Count Tags per page, including remaining space with Count Tags from the next Locator when required.',
      suggestedBy: 'Diodito De Los Santos Jr.',
    },
  },
  {
    version: '2.0.4',
    releaseDate: 'September 21, 2026',
    releaseType: 'minor',
    title: 'PCOUNT W2W Scanner-Readable Locator Barcode & Simplified 4-Column Template',
    summary:
      'Official DEC v2.0.4 release upgrading PCOUNT W2W Count Tags with scanner-readable optical Locator Barcodes (Code 128), independent Locator Barcode width and height layout controls, human-readable locator text toggle, optical quiet zones, and a simplified 4-column Excel import template (LOCATOR, SKU, UPC, DESCRIPTION).',
    highlights: [
      'Implemented scanner-readable optical Locator Barcode (Code 128) replacing plain text badges in Count Tag headers.',
      'Added independent Locator Barcode width (mm) and height (mm) configuration controls with quick +/- adjusters in Step 3.',
      'Added Show Human-Readable Locator Text toggle (Default: ON) displaying locator text directly beneath the barcode lines.',
      'Added Show Human-Readable Text toggle (Default: ON) for Item Barcode numbers in Step 3 Barcode Format & Font Sizes.',
      'Maintained 100% full visual parity across live configuration preview, layout preview, browser print, and vector PDF.',
      'Simplified downloadable sample Excel template to exactly four fields: LOCATOR, SKU, UPC, and DESCRIPTION.',
      'Enhanced Excel parser to seamlessly accept the simplified 4-column format with full backward compatibility for legacy columns.',
      'Protected Module 1 and Module 2 core workflows and existing features with zero breaking changes.',
    ],
    changes: [
      { type: 'feature', text: 'Scanner-readable Locator Barcode (Code 128) for PCOUNT W2W Count Tags' },
      { type: 'feature', text: 'Independent Locator Barcode width (mm) and height (mm) controls' },
      { type: 'feature', text: 'Show Human-Readable Locator Text toggle (Default: ON)' },
      { type: 'feature', text: 'Show Human-Readable Text toggle (Default: ON) for main item barcode' },
      { type: 'improvement', text: 'Simplified downloadable Excel template to 4 fields: LOCATOR, SKU, UPC, DESCRIPTION' },
      { type: 'improvement', text: 'Backward compatible import parser for both new 4-column and legacy schemas' },
      { type: 'improvement', text: 'Optical quiet zones and balanced tag header integration for handheld scanners' },
    ],
    credit: {
      feature: 'Conversion of Count Tag Locator Label from text to barcode lines',
      description:
        'Converted the Count Tag Locator Label from plain text to a scanner-readable Locator Barcode with configurable human-readable text, dimensions, and barcode settings.',
      suggestedBy: 'John Lord Sarte',
    },
  },
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
