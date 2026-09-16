import React from 'react';
import { Check, Sliders, Palette, LayoutGrid, CheckCircle2, AlertTriangle } from 'lucide-react';
import {
  BarcodeType,
  Module2Config,
  Module2PresetId,
  PaperSize,
  ShelfTagItem,
  YellowPaletteId,
  YellowTagItem,
  WhiteTagItem,
} from '../../types';
import { SHELFTAG_PRESETS, YELLOW_PALETTES } from './constants';
import { TagStylesComparison } from './TagStylesComparison';
import { computeShelftagSheetLayout, PAPER_OPTIONS } from '../../utils/shelftagLayoutEngine';

interface LayoutColorSetupTabProps {
  config: Module2Config;
  setConfig: React.Dispatch<React.SetStateAction<Module2Config>>;
  availableItems?: (YellowTagItem | WhiteTagItem | ShelfTagItem)[];
  sampleWhiteItem?: ShelfTagItem;
  sampleYellowItem?: ShelfTagItem;
}

export const LayoutColorSetupTab: React.FC<LayoutColorSetupTabProps> = ({
  config,
  setConfig,
  availableItems,
  sampleWhiteItem,
  sampleYellowItem,
}) => {
  const layout = computeShelftagSheetLayout(config);

  const handlePresetSelect = (presetId: Module2PresetId) => {
    const preset = SHELFTAG_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    setConfig(prev => ({
      ...prev,
      presetId,
      tagWidthMm: preset.tagWidthMm,
      tagHeightMm: preset.tagHeightMm,
      columns: preset.columns,
      rows: preset.rows,
      paperSize: preset.paperSize,
      rowGapMm: preset.rowGapMm,
      colGapMm: preset.colGapMm,
      topMarginMm: preset.topMarginMm,
      bottomMarginMm: preset.topMarginMm,
      sideMarginMm: preset.sideMarginMm,
      leftMarginMm: preset.sideMarginMm,
      rightMarginMm: preset.sideMarginMm,
    }));
  };

  const handlePaletteSelect = (paletteId: YellowPaletteId) => {
    setConfig(prev => ({
      ...prev,
      yellowPalette: paletteId,
    }));
  };

  return (
    <div className="space-y-6 text-xs">
      {/* 1. Standard Shelftag & PP Tag Size Presets */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800">
            <LayoutGrid className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-extrabold text-zinc-900">
            Standard Shelftag & PP Tag Size Presets
          </h2>
        </div>
        <p className="text-zinc-500 mb-4 text-[11.5px]">
          Choose an industry standard tag size or customize exact millimeter dimensions below to match your shelf channel.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SHELFTAG_PRESETS.map(preset => {
            const isSelected = config.presetId === preset.id || (!config.presetId && preset.id === 'standard_letter');

            return (
              <div
                key={preset.id}
                onClick={() => handlePresetSelect(preset.id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50/50 shadow-xs ring-2 ring-amber-400/20'
                    : 'border-zinc-200 hover:border-amber-300 bg-zinc-50/50 hover:bg-white'
                }`}
              >
                {/* Active check indicator */}
                {isSelected && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}

                <div>
                  <div className="font-extrabold text-zinc-900 text-[13px] leading-tight pr-6">
                    {preset.name}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="font-mono font-bold text-amber-800 bg-amber-100/70 border border-amber-200 px-2 py-0.5 rounded text-[11px]">
                      {preset.tagSize}
                    </span>
                    <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10.5px]">
                      {preset.badge}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 my-3 pt-2 border-t border-zinc-200/80 text-[11px]">
                    <div>
                      <span className="text-zinc-500">Columns × Rows:</span>
                      <p className="font-bold text-zinc-800">{preset.columns} Cols × {preset.rows} Rows</p>
                    </div>
                    <div>
                      <span className="text-zinc-500">Tags/Sheet:</span>
                      <p className="font-bold text-zinc-900">{preset.tagsPerSheet} tags/sheet</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-zinc-500">Paper:</span>
                      <p className="font-semibold text-zinc-800">{preset.paperName}</p>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-zinc-500 pt-2 border-t border-zinc-100 leading-snug">
                  {preset.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Two-Column Configuration Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: TAG DIMENSIONS & SHEET LAYOUT */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-zinc-700" />
              <h3 className="text-xs font-black tracking-wider text-zinc-800 uppercase">
                TAG DIMENSIONS & 3-COLUMN SHEET LAYOUT
              </h3>
            </div>

            {/* Fit Status Badge */}
            <div>
              {layout.fitsWidth ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                  Fits 3 Columns
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                  <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
                  Exceeds Sheet
                </span>
              )}
            </div>
          </div>

          {/* Real-time Math Summary Alert */}
          <div className={`p-2.5 rounded-xl border text-[11px] mb-4 ${
            layout.fitsWidth
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : 'bg-rose-50/80 border-rose-300 text-rose-950'
          }`}>
            <div className="font-bold flex items-center justify-between">
              <span>
                Required Width: <strong>{layout.requiredWidthMm} mm</strong> (3 × {layout.tagWidthMm}mm + 2 × {layout.colGapMm}mm)
              </span>
              <span>
                Available: <strong>{layout.availableWidthMm} mm</strong>
              </span>
            </div>
            <div className="text-[10.5px] text-zinc-600 mt-1 flex items-center justify-between">
              <span>
                Capacity: <strong>{layout.columns} Cols × {layout.maxRows} Rows</strong> = <strong>{layout.tagsPerSheet} tags/sheet</strong>
              </span>
              <span>
                {layout.fitsWidth
                  ? `Extra Margin: ${layout.extraHorizontalSpaceMm} mm`
                  : <strong className="text-rose-700">Overflow: +{layout.differenceMm} mm</strong>}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {/* Tag Width */}
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Tag Width (mm)</label>
              <input
                type="number"
                step="0.5"
                min="20"
                max="200"
                value={config.tagWidthMm}
                onChange={e =>
                  setConfig(prev => ({
                    ...prev,
                    tagWidthMm: parseFloat(e.target.value) || 65,
                  }))
                }
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 font-mono font-bold focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            {/* Tag Height */}
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Tag Height (mm)</label>
              <input
                type="number"
                step="0.5"
                min="15"
                max="150"
                value={config.tagHeightMm}
                onChange={e =>
                  setConfig(prev => ({
                    ...prev,
                    tagHeightMm: parseFloat(e.target.value) || 42,
                  }))
                }
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 font-mono font-bold focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            {/* Paper Size */}
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Paper Size</label>
              <select
                value={config.paperSize}
                onChange={e =>
                  setConfig(prev => ({
                    ...prev,
                    paperSize: e.target.value as PaperSize,
                  }))
                }
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 font-semibold focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              >
                {PAPER_OPTIONS.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.widthMm} × {p.heightMm} mm)
                  </option>
                ))}
              </select>
            </div>

            {/* Paper Orientation */}
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Orientation</label>
              <select
                value={config.orientation || 'portrait'}
                onChange={e =>
                  setConfig(prev => ({
                    ...prev,
                    orientation: e.target.value as 'portrait' | 'landscape',
                  }))
                }
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 font-semibold focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>

            {/* Custom Dimensions if CUSTOM */}
            {config.paperSize === 'CUSTOM' && (
              <>
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Custom Width (mm)</label>
                  <input
                    type="number"
                    step="1"
                    min="50"
                    value={config.customWidthMm || 210}
                    onChange={e =>
                      setConfig(prev => ({
                        ...prev,
                        customWidthMm: parseFloat(e.target.value) || 210,
                      }))
                    }
                    className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Custom Height (mm)</label>
                  <input
                    type="number"
                    step="1"
                    min="50"
                    value={config.customHeightMm || 297}
                    onChange={e =>
                      setConfig(prev => ({
                        ...prev,
                        customHeightMm: parseFloat(e.target.value) || 297,
                      }))
                    }
                    className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 font-mono font-bold"
                  />
                </div>
              </>
            )}

            {/* Columns (Target 3) */}
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Columns</label>
              <input
                type="number"
                min="1"
                max="6"
                value={config.columns}
                onChange={e =>
                  setConfig(prev => ({
                    ...prev,
                    columns: parseInt(e.target.value, 10) || 3,
                  }))
                }
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 font-mono font-bold focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            {/* Column Gap (Horizontal Gap) */}
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Horizontal Gap (mm)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="20"
                value={config.colGapMm}
                onChange={e =>
                  setConfig(prev => ({
                    ...prev,
                    colGapMm: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 font-mono font-bold focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            {/* Row Gap (Vertical Gap) */}
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Vertical Gap (mm)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="20"
                value={config.rowGapMm}
                onChange={e =>
                  setConfig(prev => ({
                    ...prev,
                    rowGapMm: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 font-mono font-bold focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            {/* Side Margin (Left/Right) */}
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Side Margin (mm)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="50"
                value={config.sideMarginMm}
                onChange={e => {
                  const val = parseFloat(e.target.value) || 0;
                  setConfig(prev => ({
                    ...prev,
                    sideMarginMm: val,
                    leftMarginMm: val,
                    rightMarginMm: val,
                  }));
                }}
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 font-mono font-bold focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            {/* Top Margin */}
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Top Margin (mm)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="50"
                value={config.topMarginMm}
                onChange={e => {
                  const val = parseFloat(e.target.value) || 0;
                  setConfig(prev => ({
                    ...prev,
                    topMarginMm: val,
                    bottomMarginMm: val,
                  }));
                }}
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 font-mono font-bold focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            {/* Center Columns Toggle */}
            <div className="flex items-center pt-5">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={config.centerColumns !== false}
                  onChange={e =>
                    setConfig(prev => ({
                      ...prev,
                      centerColumns: e.target.checked,
                    }))
                  }
                  className="rounded accent-amber-500 w-4 h-4"
                />
                <span className="font-bold text-zinc-800">Center 3 Columns Horizontally</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: WHITE & YELLOW COLORS & TYPOGRAPHY */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-100">
            <Palette className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-black tracking-wider text-zinc-800 uppercase">
              WHITE & YELLOW COLORS & TYPOGRAPHY
            </h3>
          </div>

          {/* Yellow Tag Color Palette */}
          <div className="mb-4">
            <label className="block font-bold text-zinc-700 mb-2">
              Yellow Tag Color Palette:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {YELLOW_PALETTES.map(palette => {
                const isSelected = config.yellowPalette === palette.id;

                return (
                  <button
                    key={palette.id}
                    type="button"
                    onClick={() => handlePaletteSelect(palette.id)}
                    className={`py-2 px-2.5 rounded-xl border text-center font-bold text-[11px] cursor-pointer transition-all flex flex-col items-center gap-1.5 ${
                      isSelected
                        ? 'border-zinc-900 ring-2 ring-zinc-900 shadow-xs'
                        : 'border-zinc-200 hover:border-zinc-400'
                    }`}
                    style={{ backgroundColor: palette.bgHex }}
                  >
                    <span className="text-zinc-900 font-black truncate w-full">
                      {palette.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Currency Symbol & Barcode Format */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Currency Symbol</label>
              <input
                type="text"
                value={config.currencySymbol}
                onChange={e =>
                  setConfig(prev => ({
                    ...prev,
                    currencySymbol: e.target.value || '₱',
                  }))
                }
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 font-mono font-bold focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-zinc-700 mb-1">Barcode Format</label>
              <select
                value={config.barcodeFormat}
                onChange={e =>
                  setConfig(prev => ({
                    ...prev,
                    barcodeFormat: e.target.value as BarcodeType,
                  }))
                }
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 font-semibold focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              >
                <option value="CODE128">Code 128 (Standard)</option>
                <option value="EAN13">EAN-13 (Retail standard)</option>
                <option value="CODE39">Code 39</option>
                <option value="UPCA">UPC-A</option>
              </select>
            </div>
          </div>

          {/* 4 Checkbox Options */}
          <div className="space-y-2.5 pt-2 border-t border-zinc-100">
            {/* Show Strike-Through Regular Price on Yellow Tags */}
            <label className="flex items-center gap-2.5 font-medium text-zinc-800 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showStrikeThroughRegular}
                onChange={e =>
                  setConfig(prev => ({
                    ...prev,
                    showStrikeThroughRegular: e.target.checked,
                  }))
                }
                className="w-4 h-4 rounded-sm border-zinc-300 text-zinc-900 focus:ring-amber-500 cursor-pointer"
              />
              <span>Show Strike-Through Regular Price on Yellow Tags (e.g. WAS ₱185.00)</span>
            </label>

            {/* Show Cutting Guides Corner Markers */}
            <label className="flex items-center gap-2.5 font-medium text-zinc-800 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showCutGuides}
                onChange={e =>
                  setConfig(prev => ({
                    ...prev,
                    showCutGuides: e.target.checked,
                  }))
                }
                className="w-4 h-4 rounded-sm border-zinc-300 text-zinc-900 focus:ring-amber-500 cursor-pointer"
              />
              <span>Show Cutting Guides Corner Markers</span>
            </label>

            {/* Show Solid Card Borders */}
            <label className="flex items-center gap-2.5 font-medium text-zinc-800 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showBorder}
                onChange={e =>
                  setConfig(prev => ({
                    ...prev,
                    showBorder: e.target.checked,
                  }))
                }
                className="w-4 h-4 rounded-sm border-zinc-300 text-zinc-900 focus:ring-amber-500 cursor-pointer"
              />
              <span>Show Solid Card Borders</span>
            </label>

            {/* Include Store Logo in Header */}
            <label className="flex items-center gap-2.5 font-medium text-zinc-800 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showLogo}
                onChange={e =>
                  setConfig(prev => ({
                    ...prev,
                    showLogo: e.target.checked,
                  }))
                }
                className="w-4 h-4 rounded-sm border-zinc-300 text-zinc-900 focus:ring-amber-500 cursor-pointer"
              />
              <span>Include Store Logo in Header</span>
            </label>
          </div>
        </div>
      </div>

      {/* 3. Live Comparison Box matching Image 2 */}
      <TagStylesComparison
        config={config}
        availableItems={availableItems}
        sampleWhiteItem={sampleWhiteItem}
        sampleYellowItem={sampleYellowItem}
      />
    </div>
  );
};
