import React, { useMemo } from 'react';
import {
  Sliders,
  FileText,
  Barcode,
  Layers,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Scissors,
  CheckCircle2,
  Grid,
  Type,
  Maximize2,
  Image as ImageIcon,
  Upload,
  RotateCcw,
  Plus,
  Minus,
  MoveVertical,
  BoxSelect,
} from 'lucide-react';
import { LayoutConfig, BarcodeType, PaperSize, InventoryItem } from '../types';
import { DEFAULT_PRINCE_LOGO } from '../utils/theme';
import { ShelfTag } from './ShelfTag';

interface Step3ConfigureProps {
  config: LayoutConfig;
  onUpdateConfig: (config: LayoutConfig) => void;
  selectedItems: InventoryItem[];
  onGenerateLayout: () => void;
  onBack: () => void;
}

export const Step3Configure: React.FC<Step3ConfigureProps> = ({
  config,
  onUpdateConfig,
  selectedItems,
  onGenerateLayout,
  onBack,
}) => {
  // Sample item to show in preview
  const previewItem: InventoryItem = useMemo(() => {
    return (
      selectedItems[0] || {
        id: 'preview-1',
        locator: 'BA-A1-B21L',
        sku: '14177',
        upcNo: '1428503045',
        description: 'UFC BANANA CATSUP 1000G',
        barcode: '1428503045',
        count: 25,
        counter: 'Carlos Dizon',
        scanner: 'Lito Cruz',
        validator: 'Elena Cruz',
      }
    );
  }, [selectedItems]);

  // Dimensions of the chosen paper in mm
  const paperDimensions = useMemo(() => {
    let width = 210;
    let height = 297;
    if (config.paperSize === 'LETTER') {
      width = 215.9;
      height = 279.4;
    } else if (config.paperSize === 'CUSTOM') {
      width = config.customWidthMm;
      height = config.customHeightMm;
    }

    if (config.orientation === 'landscape') {
      return { width: height, height: width };
    }
    return { width, height };
  }, [config.paperSize, config.customWidthMm, config.customHeightMm, config.orientation]);

  // Calculate layout fit: rows, columns, tags per page, and total pages needed
  const layoutCalculations = useMemo(() => {
    const availWidth = paperDimensions.width - config.marginLeftMm - config.marginRightMm;
    const availHeight = paperDimensions.height - config.marginTopMm - config.marginBottomMm;

    const cols = Math.max(1, config.columns);
    const tagW = config.tagWidthMm;
    const tagH = config.tagHeightMm;
    const gapX = config.gapColMm;
    const gapY = config.gapRowMm;

    // Maximum rows that can physically fit
    const rows = Math.max(1, Math.floor((availHeight + gapY) / (tagH + gapY)));
    const tagsPerPage = cols * rows;
    const totalSelected = selectedItems.length || 1;
    const totalPages = Math.ceil(totalSelected / tagsPerPage);

    const fitsHorizontally = cols * tagW + (cols - 1) * gapX <= availWidth;
    const fitsVertically = rows * tagH + (rows - 1) * gapY <= availHeight;

    return {
      availWidth,
      availHeight,
      cols,
      rows,
      tagsPerPage,
      totalPages,
      totalSelected,
      fitsHorizontally,
      fitsVertically,
    };
  }, [paperDimensions, config, selectedItems]);

  // Layout presets
  const applyPreset = (name: 'nine_tags_sheet' | 'standard_a4' | 'compact_letter' | 'large_tag' | 'single_wide') => {
    if (name === 'nine_tags_sheet') {
      onUpdateConfig({
        ...config,
        paperSize: config.paperSize === 'LETTER' ? 'LETTER' : 'A4',
        orientation: 'portrait',
        columns: 3,
        tagWidthMm: 64,
        tagHeightMm: 86,
        marginTopMm: 6,
        marginBottomMm: 6,
        marginLeftMm: 6,
        marginRightMm: 6,
        gapRowMm: 3,
        gapColMm: 3.5,
        fontSizeDesc: 10,
        fontSizeSku: 8.5,
        fontSizeLocator: 10.5,
        fontSizeFields: 7.5,
        showBorders: true,
        showCutGuides: true,
      });
    } else if (name === 'standard_a4') {
      onUpdateConfig({
        ...config,
        paperSize: 'A4',
        orientation: 'portrait',
        columns: 2,
        tagWidthMm: 98,
        tagHeightMm: 85,
        marginTopMm: 8,
        marginBottomMm: 8,
        marginLeftMm: 7,
        marginRightMm: 7,
        gapRowMm: 4,
        gapColMm: 4,
        fontSizeDesc: 13,
        fontSizeSku: 9.5,
        fontSizeLocator: 12,
        fontSizeFields: 8,
        showBorders: true,
        showCutGuides: true,
      });
    } else if (name === 'compact_letter') {
      onUpdateConfig({
        ...config,
        paperSize: 'LETTER',
        orientation: 'portrait',
        columns: 2,
        tagWidthMm: 100,
        tagHeightMm: 62,
        marginTopMm: 6,
        marginBottomMm: 6,
        marginLeftMm: 6,
        marginRightMm: 6,
        gapRowMm: 3,
        gapColMm: 3,
        fontSizeDesc: 11,
        fontSizeSku: 8.5,
        fontSizeLocator: 10.5,
        fontSizeFields: 7.5,
        showBorders: true,
        showCutGuides: true,
      });
    } else if (name === 'large_tag') {
      onUpdateConfig({
        ...config,
        paperSize: 'A4',
        orientation: 'portrait',
        columns: 2,
        tagWidthMm: 98,
        tagHeightMm: 135,
        marginTopMm: 10,
        marginBottomMm: 10,
        marginLeftMm: 7,
        marginRightMm: 7,
        gapRowMm: 5,
        gapColMm: 5,
        fontSizeDesc: 15,
        fontSizeSku: 11,
        fontSizeLocator: 14,
        fontSizeFields: 10,
        showBorders: true,
        showCutGuides: true,
      });
    } else if (name === 'single_wide') {
      onUpdateConfig({
        ...config,
        columns: 1,
        tagWidthMm: 190,
        tagHeightMm: 85,
        marginTopMm: 10,
        marginBottomMm: 10,
        marginLeftMm: 10,
        marginRightMm: 10,
        gapRowMm: 6,
        fontSizeDesc: 16,
        fontSizeSku: 12,
        fontSizeLocator: 15,
        fontSizeFields: 10,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              STEP 3 — CONFIGURE LAYOUT
            </span>
            <h2 className="text-2xl font-black text-zinc-900 mt-2">Print & Tag Dimensions</h2>
            <p className="text-sm text-zinc-600 mt-0.5">
              Customize paper size, columns, margins, barcode encoding, and physical counting sheet options.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Table
            </button>
            <button
              type="button"
              onClick={onGenerateLayout}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <span>Generate Layout & Preview</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide mr-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Presets:
          </span>
          <button
            type="button"
            onClick={() => applyPreset('nine_tags_sheet')}
            className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-md transition-colors cursor-pointer flex items-center gap-1"
          >
            ★ 9 Tags / Sheet (3 cols × 3 rows - A4 / Short Bond)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('standard_a4')}
            className="px-3 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors cursor-pointer"
          >
            A4 Standard (2 cols × 3 rows = 6/page)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('compact_letter')}
            className="px-3 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors cursor-pointer"
          >
            Short Bond / Letter (2 cols × 4 rows = 8/page)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('large_tag')}
            className="px-3 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors cursor-pointer"
          >
            Large Pallet Tag (2 cols × 2 rows = 4/page)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('single_wide')}
            className="px-3 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors cursor-pointer"
          >
            Full Width Banner (1 col)
          </button>
        </div>
      </div>

      {/* Main Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Config Controls (7 columns) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Paper & Orientation */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-5">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 mb-4">
              <FileText className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">
                Paper Size & Orientation
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Paper Selection */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase mb-1.5">
                  Paper Format
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'A4', label: 'A4', sub: '210×297mm' },
                    { id: 'LETTER', label: 'Short Bond', sub: '8.5×11 in' },
                    { id: 'CUSTOM', label: 'Custom', sub: 'Specify mm' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onUpdateConfig({ ...config, paperSize: p.id as PaperSize })}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        config.paperSize === p.id
                          ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 ring-1 ring-emerald-600 font-bold'
                          : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700'
                      }`}
                    >
                      <div className="text-xs font-bold">{p.label}</div>
                      <div className="text-[10px] text-zinc-500">{p.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Orientation */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase mb-1.5">
                  Orientation
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateConfig({ ...config, orientation: 'portrait' })}
                    className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                      config.orientation === 'portrait'
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 ring-1 ring-emerald-600 font-bold'
                        : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700'
                    }`}
                  >
                    <div className="text-xs font-bold">Portrait</div>
                    <div className="text-[10px] text-zinc-500">Vertical</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateConfig({ ...config, orientation: 'landscape' })}
                    className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                      config.orientation === 'landscape'
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 ring-1 ring-emerald-600 font-bold'
                        : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700'
                    }`}
                  >
                    <div className="text-xs font-bold">Landscape</div>
                    <div className="text-[10px] text-zinc-500">Horizontal</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Paper dimensions input if custom selected */}
            {config.paperSize === 'CUSTOM' && (
              <div className="mt-4 pt-3 border-t border-zinc-100 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">
                    Custom Width (mm)
                  </label>
                  <input
                    type="number"
                    value={config.customWidthMm}
                    onChange={(e) =>
                      onUpdateConfig({ ...config, customWidthMm: Math.max(50, Number(e.target.value)) })
                    }
                    className="w-full px-2.5 py-1.5 border border-zinc-300 rounded-md text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">
                    Custom Height (mm)
                  </label>
                  <input
                    type="number"
                    value={config.customHeightMm}
                    onChange={(e) =>
                      onUpdateConfig({ ...config, customHeightMm: Math.max(50, Number(e.target.value)) })
                    }
                    className="w-full px-2.5 py-1.5 border border-zinc-300 rounded-md text-xs font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Grid & Tag Dimensions */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-5">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 mb-4">
              <Grid className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">
                Tag Dimensions & Columns
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Tag Width (mm)
                </label>
                <input
                  type="number"
                  min="40"
                  max="250"
                  value={config.tagWidthMm}
                  onChange={(e) =>
                    onUpdateConfig({ ...config, tagWidthMm: Math.max(30, Number(e.target.value)) })
                  }
                  className="w-full px-2.5 py-1.5 border border-zinc-300 rounded-md text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Tag Height (mm)
                </label>
                <input
                  type="number"
                  min="35"
                  max="280"
                  value={config.tagHeightMm}
                  onChange={(e) =>
                    onUpdateConfig({ ...config, tagHeightMm: Math.max(25, Number(e.target.value)) })
                  }
                  className="w-full px-2.5 py-1.5 border border-zinc-300 rounded-md text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Columns
                </label>
                <select
                  value={config.columns}
                  onChange={(e) => onUpdateConfig({ ...config, columns: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 border border-zinc-300 rounded-md text-xs font-bold"
                >
                  <option value={1}>1 Column</option>
                  <option value={2}>2 Columns</option>
                  <option value={3}>3 Columns</option>
                  <option value={4}>4 Columns</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Tag Gap (mm)
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={config.gapColMm}
                  onChange={(e) =>
                    onUpdateConfig({
                      ...config,
                      gapColMm: Number(e.target.value),
                      gapRowMm: Number(e.target.value),
                    })
                  }
                  className="w-full px-2.5 py-1.5 border border-zinc-300 rounded-md text-xs font-mono"
                />
              </div>
            </div>

            {/* Page Margins */}
            <div className="mt-4 pt-3 border-t border-zinc-100">
              <label className="block text-xs font-bold text-zinc-700 uppercase mb-2">
                Page Margins (mm)
              </label>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase">Top</span>
                  <input
                    type="number"
                    value={config.marginTopMm}
                    onChange={(e) =>
                      onUpdateConfig({ ...config, marginTopMm: Math.max(0, Number(e.target.value)) })
                    }
                    className="w-full px-2 py-1 border border-zinc-300 rounded-md text-xs font-mono text-center"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase">Bottom</span>
                  <input
                    type="number"
                    value={config.marginBottomMm}
                    onChange={(e) =>
                      onUpdateConfig({ ...config, marginBottomMm: Math.max(0, Number(e.target.value)) })
                    }
                    className="w-full px-2 py-1 border border-zinc-300 rounded-md text-xs font-mono text-center"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase">Left</span>
                  <input
                    type="number"
                    value={config.marginLeftMm}
                    onChange={(e) =>
                      onUpdateConfig({ ...config, marginLeftMm: Math.max(0, Number(e.target.value)) })
                    }
                    className="w-full px-2 py-1 border border-zinc-300 rounded-md text-xs font-mono text-center"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase">Right</span>
                  <input
                    type="number"
                    value={config.marginRightMm}
                    onChange={(e) =>
                      onUpdateConfig({ ...config, marginRightMm: Math.max(0, Number(e.target.value)) })
                    }
                    className="w-full px-2 py-1 border border-zinc-300 rounded-md text-xs font-mono text-center"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Barcode & Typography */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-5">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 mb-4">
              <Barcode className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">
                Barcode Format & Font Sizes
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Barcode Symbology
                </label>
                <select
                  value={config.barcodeType}
                  onChange={(e) =>
                    onUpdateConfig({ ...config, barcodeType: e.target.value as BarcodeType })
                  }
                  className="w-full px-2.5 py-1.5 border border-zinc-300 rounded-md text-xs font-bold focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="CODE128">Code 128 (Recommended / Universal)</option>
                  <option value="CODE39">Code 39</option>
                  <option value="EAN13">EAN-13 (Standard Retail)</option>
                  <option value="UPCA">UPC-A (Standard Retail)</option>
                </select>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Code 128 supports letters, numbers, and symbols.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Barcode Height (mm)
                </label>
                <input
                  type="number"
                  min="8"
                  max="35"
                  value={config.barcodeHeightMm}
                  onChange={(e) =>
                    onUpdateConfig({ ...config, barcodeHeightMm: Math.max(8, Number(e.target.value)) })
                  }
                  className="w-full px-2.5 py-1.5 border border-zinc-300 rounded-md text-xs font-mono"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Vertical bar height (default: 14mm).
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1 flex items-center justify-between">
                  <span>Barcode Width (mm)</span>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1 rounded">New</span>
                </label>
                <input
                  type="number"
                  min="15"
                  max="90"
                  value={config.barcodeWidthMm ?? 42}
                  onChange={(e) =>
                    onUpdateConfig({ ...config, barcodeWidthMm: Math.max(15, Math.min(90, Number(e.target.value))) })
                  }
                  className="w-full px-2.5 py-1.5 border border-zinc-300 rounded-md text-xs font-mono"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Independent width (default: 42mm).
                </p>
              </div>
            </div>

            {/* Show Human-Readable Barcode Text Toggle */}
            <div className="mt-3.5 flex items-center justify-between p-3 bg-zinc-50 rounded-lg border border-zinc-200">
              <div>
                <span className="text-xs font-bold text-zinc-800 block">
                  Show Human-Readable Text
                </span>
                <span className="text-[11px] text-zinc-500">
                  Displays barcode/UPC numbers directly beneath the barcode bars (Default: ON)
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdateConfig({
                    ...config,
                    showBarcodeText: config.showBarcodeText === false ? true : false,
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  config.showBarcodeText !== false ? 'bg-emerald-600' : 'bg-zinc-300'
                }`}
                title={config.showBarcodeText !== false ? 'Hide human-readable barcode numbers' : 'Show human-readable barcode numbers'}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.showBarcodeText !== false ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Font sizes */}
            <div className="mt-4 pt-3 border-t border-zinc-100">
              <label className="block text-xs font-bold text-zinc-700 uppercase mb-2 flex items-center gap-1">
                <Type className="w-3.5 h-3.5 text-zinc-500" />
                Font Sizing (px)
              </label>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <span className="text-[10px] text-zinc-500">Description</span>
                  <input
                    type="number"
                    min="8"
                    max="22"
                    value={config.fontSizeDesc}
                    onChange={(e) =>
                      onUpdateConfig({ ...config, fontSizeDesc: Number(e.target.value) })
                    }
                    className="w-full px-2 py-1 border border-zinc-300 rounded-md text-xs font-mono text-center"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500">SKU / UPC</span>
                  <input
                    type="number"
                    min="7"
                    max="16"
                    value={config.fontSizeSku}
                    onChange={(e) =>
                      onUpdateConfig({ ...config, fontSizeSku: Number(e.target.value) })
                    }
                    className="w-full px-2 py-1 border border-zinc-300 rounded-md text-xs font-mono text-center"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500">Locator</span>
                  <input
                    type="number"
                    min="8"
                    max="20"
                    value={config.fontSizeLocator}
                    onChange={(e) =>
                      onUpdateConfig({ ...config, fontSizeLocator: Number(e.target.value) })
                    }
                    className="w-full px-2 py-1 border border-zinc-300 rounded-md text-xs font-mono text-center"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500">Count Fields</span>
                  <input
                    type="number"
                    min="6"
                    max="14"
                    value={config.fontSizeFields}
                    onChange={(e) =>
                      onUpdateConfig({ ...config, fontSizeFields: Number(e.target.value) })
                    }
                    className="w-full px-2 py-1 border border-zinc-300 rounded-md text-xs font-mono text-center"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3B: Locator Barcode Settings (v2.0.4) */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Barcode className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">
                  Locator Barcode Settings
                </h3>
              </div>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                v2.0.4 Feature
              </span>
            </div>

            <p className="text-xs text-zinc-500 mb-4">
              Replaces the plain text locator in the Count Tag header with a scanner-readable optical barcode (CODE128). These controls adjust <strong>ONLY</strong> the Locator Barcode and are completely separate from the Item Barcode.
            </p>

            {/* Toggle: Enable Scanner-Readable Locator Barcode */}
            <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg border border-zinc-200 mb-4">
              <div>
                <span className="text-xs font-bold text-zinc-800 block">
                  Locator Display Format
                </span>
                <span className="text-[11px] text-zinc-500">
                  {config.locatorBarcodeEnabled !== false
                    ? 'Scanner-readable barcode (CODE128) with quiet zones'
                    : 'Plain text locator badge only'}
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdateConfig({
                    ...config,
                    locatorBarcodeEnabled: config.locatorBarcodeEnabled === false ? true : false,
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  config.locatorBarcodeEnabled !== false ? 'bg-blue-600' : 'bg-zinc-300'
                }`}
                title={config.locatorBarcodeEnabled !== false ? 'Switch to plain text locator' : 'Switch to scanner-readable barcode'}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.locatorBarcodeEnabled !== false ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {config.locatorBarcodeEnabled !== false && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Locator Barcode Width */}
                  <div className="bg-zinc-50 p-3.5 rounded-lg border border-zinc-200">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-xs font-bold text-zinc-800 block">
                          Locator Barcode Width (mm)
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          Independent width in header (default: 42mm)
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateConfig({
                              ...config,
                              locatorBarcodeWidthMm: Math.max(20, (config.locatorBarcodeWidthMm ?? 42) - 1),
                            })
                          }
                          className="w-6 h-6 flex items-center justify-center rounded bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-700 font-bold cursor-pointer text-xs"
                          title="Decrease Width"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold text-xs bg-white px-2 py-0.5 rounded border border-zinc-200 min-w-[48px] text-center text-zinc-900">
                          {config.locatorBarcodeWidthMm ?? 42}mm
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateConfig({
                              ...config,
                              locatorBarcodeWidthMm: Math.min(70, (config.locatorBarcodeWidthMm ?? 42) + 1),
                            })
                          }
                          className="w-6 h-6 flex items-center justify-center rounded bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-700 font-bold cursor-pointer text-xs"
                          title="Increase Width"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="70"
                      step="1"
                      value={config.locatorBarcodeWidthMm ?? 42}
                      onChange={(e) =>
                        onUpdateConfig({
                          ...config,
                          locatorBarcodeWidthMm: Number(e.target.value),
                        })
                      }
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>

                  {/* Locator Barcode Height */}
                  <div className="bg-zinc-50 p-3.5 rounded-lg border border-zinc-200">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-xs font-bold text-zinc-800 block">
                          Locator Barcode Height (mm)
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          Vertical bar height (default: 10mm)
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateConfig({
                              ...config,
                              locatorBarcodeHeightMm: Math.max(6, (config.locatorBarcodeHeightMm ?? 10) - 1),
                            })
                          }
                          className="w-6 h-6 flex items-center justify-center rounded bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-700 font-bold cursor-pointer text-xs"
                          title="Decrease Height"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold text-xs bg-white px-2 py-0.5 rounded border border-zinc-200 min-w-[48px] text-center text-zinc-900">
                          {config.locatorBarcodeHeightMm ?? 10}mm
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateConfig({
                              ...config,
                              locatorBarcodeHeightMm: Math.min(20, (config.locatorBarcodeHeightMm ?? 10) + 1),
                            })
                          }
                          className="w-6 h-6 flex items-center justify-center rounded bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-700 font-bold cursor-pointer text-xs"
                          title="Increase Height"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="6"
                      max="20"
                      step="1"
                      value={config.locatorBarcodeHeightMm ?? 10}
                      onChange={(e) =>
                        onUpdateConfig({
                          ...config,
                          locatorBarcodeHeightMm: Number(e.target.value),
                        })
                      }
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Show Human-Readable Locator Text Toggle */}
                <div className="flex items-center justify-between p-3.5 bg-zinc-50 rounded-lg border border-zinc-200">
                  <div>
                    <span className="text-xs font-bold text-zinc-800 block">
                      Show Human-Readable Locator Text
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Displays text (e.g. <code className="font-mono font-bold text-zinc-700">BA-A1-B21L</code>) beneath the barcode lines (Default: ON)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateConfig({
                        ...config,
                        showLocatorText: config.showLocatorText === false ? true : false,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      config.showLocatorText !== false ? 'bg-blue-600' : 'bg-zinc-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.showLocatorText !== false ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: COUNT Box & Barcode Spacing Controls (Adjustable Box & Gap) */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <BoxSelect className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">
                  COUNT Box & Barcode Layout Controls
                </h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Adjust Buttons & Sliders
              </span>
            </div>

            <p className="text-xs text-zinc-500 mb-4">
              Customize the physical size, border, and spacing of the framed <strong>COUNT</strong> box and fine-tune the gap between the Barcode and COUNT box to eliminate empty space.
            </p>

            <div className="space-y-4">
              {/* 1. COUNT Box Height Adjuster */}
              <div className="bg-zinc-50 p-3.5 rounded-lg border border-zinc-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-xs font-bold text-zinc-900 block">
                      COUNT Box Height
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Physical writing height for manual counts or bold printed count
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateConfig({
                          ...config,
                          countBoxHeightMm: Math.max(6, (config.countBoxHeightMm ?? 12) - 1),
                        })
                      }
                      className="w-7 h-7 flex items-center justify-center rounded-md bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-700 font-bold cursor-pointer shadow-2xs transition-colors"
                      title="Decrease Height by 1mm"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono font-bold text-xs bg-white px-2.5 py-1 rounded-md border border-zinc-200 min-w-[56px] text-center text-zinc-900">
                      {config.countBoxHeightMm ?? 12} mm
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateConfig({
                          ...config,
                          countBoxHeightMm: Math.min(24, (config.countBoxHeightMm ?? 12) + 1),
                        })
                      }
                      className="w-7 h-7 flex items-center justify-center rounded-md bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-700 font-bold cursor-pointer shadow-2xs transition-colors"
                      title="Increase Height by 1mm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min="6"
                  max="22"
                  step="0.5"
                  value={config.countBoxHeightMm ?? 12}
                  onChange={(e) =>
                    onUpdateConfig({ ...config, countBoxHeightMm: Number(e.target.value) })
                  }
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* 2. Gap Between Barcode & COUNT Box */}
              <div className="bg-zinc-50 p-3.5 rounded-lg border border-zinc-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-xs font-bold text-zinc-900 block flex items-center gap-1.5">
                      <MoveVertical className="w-3.5 h-3.5 text-emerald-700" />
                      Vertical Spacing (Barcode to COUNT Box)
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Eliminates dead empty space between the barcode and count box
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateConfig({
                          ...config,
                          countBoxGapTopMm: Math.max(0.5, (config.countBoxGapTopMm ?? 2.5) - 0.5),
                        })
                      }
                      className="w-7 h-7 flex items-center justify-center rounded-md bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-700 font-bold cursor-pointer shadow-2xs transition-colors"
                      title="Decrease Gap by 0.5mm"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono font-bold text-xs bg-white px-2.5 py-1 rounded-md border border-zinc-200 min-w-[56px] text-center text-zinc-900">
                      {config.countBoxGapTopMm ?? 2.5} mm
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateConfig({
                          ...config,
                          countBoxGapTopMm: Math.min(12, (config.countBoxGapTopMm ?? 2.5) + 0.5),
                        })
                      }
                      className="w-7 h-7 flex items-center justify-center rounded-md bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-700 font-bold cursor-pointer shadow-2xs transition-colors"
                      title="Increase Gap by 0.5mm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={config.countBoxGapTopMm ?? 2.5}
                  onChange={(e) =>
                    onUpdateConfig({ ...config, countBoxGapTopMm: Number(e.target.value) })
                  }
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* 3. COUNT Box Width & Border Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Box Width */}
                <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-zinc-900">Box Width</span>
                    <span className="font-mono font-bold text-xs text-zinc-900">
                      {config.countBoxWidthPercent ?? 94}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateConfig({
                          ...config,
                          countBoxWidthPercent: Math.max(60, (config.countBoxWidthPercent ?? 94) - 5),
                        })
                      }
                      className="w-6 h-6 flex items-center justify-center rounded bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-700 cursor-pointer"
                      title="Decrease Width"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="range"
                      min="60"
                      max="100"
                      step="2"
                      value={config.countBoxWidthPercent ?? 94}
                      onChange={(e) =>
                        onUpdateConfig({ ...config, countBoxWidthPercent: Number(e.target.value) })
                      }
                      className="flex-1 accent-emerald-600 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateConfig({
                          ...config,
                          countBoxWidthPercent: Math.min(100, (config.countBoxWidthPercent ?? 94) + 5),
                        })
                      }
                      className="w-6 h-6 flex items-center justify-center rounded bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-700 cursor-pointer"
                      title="Increase Width"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => onUpdateConfig({ ...config, countBoxWidthPercent: 80 })}
                      className={`flex-1 py-1 text-[10px] font-medium border rounded cursor-pointer transition-colors ${
                        config.countBoxWidthPercent === 80
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                          : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                      }`}
                    >
                      Narrow (80%)
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateConfig({ ...config, countBoxWidthPercent: 94 })}
                      className={`flex-1 py-1 text-[10px] font-medium border rounded cursor-pointer transition-colors ${
                        (config.countBoxWidthPercent ?? 94) === 94
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                          : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                      }`}
                    >
                      Standard (94%)
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateConfig({ ...config, countBoxWidthPercent: 100 })}
                      className={`flex-1 py-1 text-[10px] font-medium border rounded cursor-pointer transition-colors ${
                        config.countBoxWidthPercent === 100
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                          : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                      }`}
                    >
                      Full (100%)
                    </button>
                  </div>
                </div>

                {/* Box Border & Font */}
                <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                  <span className="text-xs font-bold text-zinc-900 block mb-1.5">
                    Box Border Thickness
                  </span>
                  <div className="grid grid-cols-3 gap-1.5 mb-2.5">
                    {[
                      { label: '1px Thin', val: 1 },
                      { label: '2px Normal', val: 2 },
                      { label: '3px Bold', val: 3 },
                    ].map((b) => (
                      <button
                        key={b.val}
                        type="button"
                        onClick={() => onUpdateConfig({ ...config, countBoxBorderWidth: b.val })}
                        className={`py-1 text-[11px] font-bold rounded border cursor-pointer transition-colors ${
                          (config.countBoxBorderWidth ?? 2) === b.val
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                            : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100'
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-600 font-medium">Count Font Size:</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateConfig({
                            ...config,
                            countBoxFontSize: Math.max(9, (config.countBoxFontSize ?? 13) - 1),
                          })
                        }
                        className="w-5 h-5 flex items-center justify-center rounded bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-700 cursor-pointer"
                        title="Decrease Count Font"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="font-mono font-bold text-[11px] min-w-[32px] text-center text-zinc-900">
                        {config.countBoxFontSize ?? 13}pt
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateConfig({
                            ...config,
                            countBoxFontSize: Math.min(22, (config.countBoxFontSize ?? 13) + 1),
                          })
                        }
                        className="w-5 h-5 flex items-center justify-center rounded bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-700 cursor-pointer"
                        title="Increase Count Font"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Barcode Height Quick Adjust */}
              <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-900 block">
                    Barcode Graphic Height
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    Adjust barcode height to give the tag a clean, well-filled look
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateConfig({
                        ...config,
                        barcodeHeightMm: Math.max(8, (config.barcodeHeightMm || 14) - 1),
                      })
                    }
                    className="w-7 h-7 flex items-center justify-center rounded-md bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-700 font-bold cursor-pointer shadow-2xs transition-colors"
                    title="Decrease Barcode Height"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono font-bold text-xs bg-white px-2.5 py-1 rounded-md border border-zinc-200 min-w-[56px] text-center text-zinc-900">
                    {config.barcodeHeightMm || 14} mm
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateConfig({
                        ...config,
                        barcodeHeightMm: Math.min(25, (config.barcodeHeightMm || 14) + 1),
                      })
                    }
                    className="w-7 h-7 flex items-center justify-center rounded-md bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-700 font-bold cursor-pointer shadow-2xs transition-colors"
                    title="Increase Barcode Height"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Physical Counting Sheet & Style Options */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-5">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 mb-4">
              <Layers className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">
                Physical Inventory Counting Options
              </h3>
            </div>

            <div className="space-y-3">
              {/* Blank counting fields switch */}
              <label className="flex items-start gap-3 p-3 bg-zinc-50 hover:bg-zinc-100/70 border border-zinc-200 rounded-lg cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={config.printBlankCountFields}
                  onChange={(e) =>
                    onUpdateConfig({ ...config, printBlankCountFields: e.target.checked })
                  }
                  className="mt-0.5 rounded-xs text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-zinc-900 block">
                    Print Blank Lines for Physical Inventory Counting (Recommended)
                  </span>
                  <span className="text-[11px] text-zinc-500 block mt-0.5">
                    Renders blank underline spaces for COUNT, COUNTER, SCANNER, and VALIDATOR so auditors can write directly on the shelf tag during inventory.
                  </span>
                </div>
              </label>

              {/* Cut Guides */}
              <label className="flex items-start gap-3 p-3 bg-zinc-50 hover:bg-zinc-100/70 border border-zinc-200 rounded-lg cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={config.showCutGuides}
                  onChange={(e) =>
                    onUpdateConfig({ ...config, showCutGuides: e.target.checked })
                  }
                  className="mt-0.5 rounded-xs text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5 text-zinc-600" />
                    Show Cut Guides & Scissor Crop Corners
                  </span>
                  <span className="text-[11px] text-zinc-500 block mt-0.5">
                    Adds dashed corner alignment marks to make trimming tags with paper cutters fast and accurate.
                  </span>
                </div>
              </label>

              {/* Tag Border */}
              <label className="flex items-start gap-3 p-3 bg-zinc-50 hover:bg-zinc-100/70 border border-zinc-200 rounded-lg cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={config.showBorders}
                  onChange={(e) =>
                    onUpdateConfig({ ...config, showBorders: e.target.checked })
                  }
                  className="mt-0.5 rounded-xs text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-zinc-900 block">
                    Render Outer Solid Border
                  </span>
                  <span className="text-[11px] text-zinc-500 block mt-0.5">
                    Draws a clean black border around each shelf tag for crisp contrast.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Section 5: Store Logo & Header Branding (Upper Right Alignment) */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">
                  Store Logo & Header Branding
                </h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Upper Right Aligned
              </span>
            </div>

            <div className="space-y-4">
              {/* Toggle Logo Display */}
              <label className="flex items-start gap-3 p-3 bg-zinc-50 hover:bg-zinc-100/70 border border-zinc-200 rounded-lg cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={config.showLogo !== false}
                  onChange={(e) =>
                    onUpdateConfig({ ...config, showLogo: e.target.checked })
                  }
                  className="mt-0.5 rounded-xs text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <div className="flex-1">
                  <span className="text-xs font-bold text-zinc-900 block">
                    Display Store Logo in Header (Upper Right)
                  </span>
                  <span className="text-[11px] text-zinc-500 block mt-0.5">
                    Places the circular Prince retail store logo on the top-right side, perfectly aligned with the Locator field.
                  </span>
                </div>
              </label>

              {config.showLogo !== false && (
                <div className="p-3.5 bg-zinc-50/80 border border-zinc-200 rounded-lg space-y-3">
                  {/* Logo Preview & Size Control */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {/* Logo Thumbnail preview */}
                      <div className="w-10 h-10 rounded-full bg-white border border-zinc-200 shadow-2xs flex items-center justify-center p-0.5 shrink-0 overflow-hidden">
                        {config.logoUrl && config.logoUrl !== DEFAULT_PRINCE_LOGO && config.logoUrl !== '/prince-logo.svg' && config.logoUrl !== 'prince' ? (
                          <img
                            src={config.logoUrl}
                            alt="Logo preview"
                            className="w-full h-full object-contain rounded-full"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <svg viewBox="0 0 200 200" className="w-full h-full rounded-full">
                            <circle cx="100" cy="100" r="100" fill="#FEED01" />
                            <polygon points="100,56 126,76 113,76 100,66 87,76 74,76" fill="#E31B23" />
                            <text
                              x="100"
                              y="110"
                              fill="#E31B23"
                              textAnchor="middle"
                              fontFamily="system-ui, -apple-system, 'Arial Black', Impact, sans-serif"
                              fontWeight="900"
                              fontStyle="italic"
                              fontSize="47"
                              letterSpacing="-1.5px"
                            >
                              prince
                            </text>
                            <polygon points="22,117 178,117 188,125 12,125" fill="#E31B23" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-zinc-900">
                          {config.logoUrl && config.logoUrl !== DEFAULT_PRINCE_LOGO && config.logoUrl !== '/prince-logo.svg' && config.logoUrl !== 'prince'
                            ? 'Custom Store Logo'
                            : 'Prince Retail Brand Logo'}
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          {config.logoUrl && config.logoUrl !== DEFAULT_PRINCE_LOGO && config.logoUrl !== '/prince-logo.svg' && config.logoUrl !== 'prince'
                            ? 'User provided image asset'
                            : 'Official yellow & red badge'}
                        </div>
                      </div>
                    </div>

                    {/* Logo Height Control */}
                    <div className="w-36 text-right">
                      <div className="flex items-center justify-between text-[11px] text-zinc-600 mb-1">
                        <span>Logo Size</span>
                        <span className="font-mono font-bold text-zinc-900">
                          {config.logoHeightMm || 6.5}mm
                        </span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="11"
                        step="0.5"
                        value={config.logoHeightMm || 6.5}
                        onChange={(e) =>
                          onUpdateConfig({ ...config, logoHeightMm: Number(e.target.value) })
                        }
                        className="w-full accent-emerald-600 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Logo Actions: Upload custom or reset to Prince */}
                  <div className="flex items-center gap-2 pt-2 border-t border-zinc-200/80">
                    <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-md cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Upload Custom Logo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (typeof event.target?.result === 'string') {
                                onUpdateConfig({ ...config, logoUrl: event.target.result });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>

                    {config.logoUrl && config.logoUrl !== DEFAULT_PRINCE_LOGO && config.logoUrl !== '/prince-logo.svg' && config.logoUrl !== 'prince' && (
                      <button
                        type="button"
                        onClick={() => onUpdateConfig({ ...config, logoUrl: DEFAULT_PRINCE_LOGO })}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 rounded-md transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset to Prince Logo</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Tag Number toggle */}
              <label className="flex items-start gap-3 p-3 bg-zinc-50 hover:bg-zinc-100/70 border border-zinc-200 rounded-lg cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={config.showTagNumber !== false}
                  onChange={(e) =>
                    onUpdateConfig({ ...config, showTagNumber: e.target.checked })
                  }
                  className="mt-0.5 rounded-xs text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-zinc-900 block">
                    Show Sequential Tag Number (#001)
                  </span>
                  <span className="text-[11px] text-zinc-500 block mt-0.5">
                    Displays the item sequence number in the header alongside the logo for tracking counted tags.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Live Preview & Page Calculation (5 columns) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Page Layout Math Card */}
          <div className="bg-zinc-900 text-white rounded-xl shadow-xs p-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Sheet Calculation Summary
              </h3>
              <span className="text-xs font-mono bg-zinc-800 px-2 py-0.5 rounded-sm">
                {config.paperSize} ({paperDimensions.width}×{paperDimensions.height}mm)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 my-4">
              <div>
                <span className="text-[11px] text-zinc-400 uppercase">Tags Per Page</span>
                <div className="text-3xl font-black text-white mt-1">
                  {layoutCalculations.tagsPerPage}
                  <span className="text-xs text-zinc-400 font-normal ml-1.5">
                    ({layoutCalculations.cols} cols × {layoutCalculations.rows} rows)
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-zinc-400 uppercase">Total Pages Needed</span>
                <div className="text-3xl font-black text-emerald-400 mt-1">
                  {layoutCalculations.totalPages}
                  <span className="text-xs text-zinc-400 font-normal ml-1.5">
                    for {layoutCalculations.totalSelected} tags
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 text-xs flex items-center justify-between text-zinc-300">
              <span>Orientation: <strong className="text-white capitalize">{config.orientation}</strong></span>
              <span>Available Area: <strong className="text-white">{Math.round(layoutCalculations.availWidth)}×{Math.round(layoutCalculations.availHeight)}mm</strong></span>
            </div>
          </div>

          {/* Live Interactive Tag Preview */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
              <div className="flex items-center gap-1.5">
                <Maximize2 className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-zinc-900">Live Tag Preview</h3>
              </div>
              <span className="text-xs font-mono text-zinc-500">
                {config.tagWidthMm} × {config.tagHeightMm} mm
              </span>
            </div>

            <p className="text-xs text-zinc-500 mb-4">
              Sample shelf tag rendered with current settings and barcode symbology:
            </p>

            <div className="flex justify-center p-4 bg-zinc-100/60 rounded-xl border border-zinc-200 overflow-hidden">
              <div className="shadow-md transition-all hover:scale-[1.02]">
                <ShelfTag item={previewItem} config={config} scale={0.92} />
              </div>
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={onGenerateLayout}
                className="w-full py-3 px-4 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Generate Layout & Open Preview</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
