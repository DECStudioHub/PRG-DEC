import React, { useState, useEffect } from 'react';
import {
  BarcodeType,
  CountSheetColumnId,
  CountSheetColumnWidths,
  CountSheetConfig,
  CountSheetPreset,
  CountSheetSortField,
  CountSheetSortOrder,
  PaperSize,
} from '../../types';
import {
  DEFAULT_COUNT_SHEET_CONFIG,
  DEFAULT_COUNT_SHEET_PRESETS,
  getCountSheetPaperDimensions,
} from '../../utils/countSheetLayoutEngine';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Bookmark,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  FileText,
  Grid,
  HelpCircle,
  LayoutGrid,
  Move,
  Plus,
  RotateCcw,
  Sliders,
  Table,
  Trash2,
  Type,
} from 'lucide-react';

interface CountSheetConfigPanelProps {
  config: CountSheetConfig;
  onUpdateConfig: (newConfig: CountSheetConfig) => void;
  presets: CountSheetPreset[];
  onSelectPreset: (preset: CountSheetPreset) => void;
  onSaveNewPreset: (name: string, description: string) => void;
  onDeletePreset: (presetId: string) => void;
  onResetToDefaults: () => void;
}

export const CountSheetConfigPanel: React.FC<CountSheetConfigPanelProps> = ({
  config,
  onUpdateConfig,
  presets,
  onSelectPreset,
  onSaveNewPreset,
  onDeletePreset,
  onResetToDefaults,
}) => {
  const [activeSection, setActiveSection] = useState<'presets' | 'sorting' | 'paper' | 'columns' | 'table' | 'typography' | 'barcode'>('presets');
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDesc, setNewPresetDesc] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Sorting Local Draft State
  const [draftSortField, setDraftSortField] = useState<'sku' | 'description' | 'barcode'>(
    config.sortField && config.sortField !== 'original' ? config.sortField : 'description'
  );
  const [draftSortOrder, setDraftSortOrder] = useState<'asc' | 'desc'>(
    config.sortOrder || 'asc'
  );

  useEffect(() => {
    if (config.sortField && config.sortField !== 'original') {
      setDraftSortField(config.sortField);
    }
    if (config.sortOrder) {
      setDraftSortOrder(config.sortOrder);
    }
  }, [config.sortField, config.sortOrder]);

  const handleApplySort = () => {
    onUpdateConfig({
      ...config,
      sortField: draftSortField,
      sortOrder: draftSortOrder,
    });
  };

  const handleClearSort = () => {
    onUpdateConfig({
      ...config,
      sortField: 'original',
      sortOrder: 'asc',
    });
  };

  // Compute paper and printable dimensions
  const paperDims = getCountSheetPaperDimensions(
    config.paperSize,
    config.customWidthMm,
    config.customHeightMm,
    config.orientation
  );

  const printableWidthMm = Math.max(
    50,
    paperDims.widthMm - (config.marginLeftMm + config.marginRightMm)
  );

  const totalColWidthMm =
    (config.columnWidths?.locatorMm || 26) +
    (config.columnWidths?.skuMm || 28) +
    (config.columnWidths?.barcodeMm || 42) +
    (config.columnWidths?.descMm || 88) +
    (config.columnWidths?.countMm || 34);

  const isWidthExceeded = totalColWidthMm > printableWidthMm + 1;

  const handleUpdate = <K extends keyof CountSheetConfig>(key: K, value: CountSheetConfig[K]) => {
    onUpdateConfig({
      ...config,
      [key]: value,
    });
  };

  const handleUpdateColWidth = (
    col: keyof CountSheetColumnWidths,
    value: number
  ) => {
    onUpdateConfig({
      ...config,
      columnWidths: {
        ...config.columnWidths,
        [col]: Math.max(10, value),
      },
    });
  };

  const handleAutoFitColumns = () => {
    // Proportional distribution within printable width
    const targetWidth = printableWidthMm - (config.showRowNumbers ? 6 : 0);
    const hasLocator = currentColumnOrder.includes('locator') && (config.columnVisibility?.locator !== false);
    const hasPrecount = currentColumnOrder.includes('precount') && (config.columnVisibility?.precount !== false);
    const locator = hasLocator ? Math.round(targetWidth * 0.15) : 0;
    const sku = Math.round(targetWidth * 0.12);
    const barcode = Math.round(targetWidth * 0.19);
    const precount = hasPrecount ? Math.round(targetWidth * 0.13) : 0;
    const count = Math.round(targetWidth * 0.13);
    const desc = Math.max(30, targetWidth - (locator + sku + barcode + precount + count));

    onUpdateConfig({
      ...config,
      columnWidths: {
        locatorMm: locator || 28,
        skuMm: sku,
        barcodeMm: barcode,
        descMm: desc,
        precountMm: precount || 23,
        countMm: count,
      },
    });
  };

  // Column Reordering Handlers
  const currentColumnOrder: CountSheetColumnId[] =
    config.columnOrder && config.columnOrder.length > 0
      ? config.columnOrder
      : (config.mixLocators
          ? ['locator', 'sku', 'barcode', 'description', 'precount', 'count']
          : ['sku', 'barcode', 'description', 'count']);

  const handleMoveColumn = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentColumnOrder.length) return;
    const newOrder = [...currentColumnOrder];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;
    handleUpdate('columnOrder', newOrder);
  };

  const handleToggleColumnVisibility = (colId: CountSheetColumnId) => {
    const currentVis = config.columnVisibility || {
      locator: true,
      sku: true,
      barcode: true,
      description: true,
      precount: true,
      count: true,
    };
    handleUpdate('columnVisibility', {
      ...currentVis,
      [colId]: currentVis[colId] === false ? true : false,
    });
  };

  const handleResetColumnOrder = () => {
    const resetOrder: CountSheetColumnId[] = config.mixLocators
      ? ['locator', 'sku', 'barcode', 'description', 'precount', 'count']
      : ['sku', 'barcode', 'description', 'count'];
    handleUpdate('columnOrder', resetOrder);
    handleUpdate('columnVisibility', {
      locator: true,
      sku: true,
      barcode: true,
      description: true,
      precount: true,
      count: true,
    });
  };

  const columnMeta: Record<CountSheetColumnId, { label: string; desc: string }> = {
    locator: { label: 'LOCATOR', desc: 'Scannable barcode & location' },
    sku: { label: 'SKU', desc: 'Stock identifier' },
    barcode: { label: 'BARCODE', desc: 'Scannable barcode & numbers' },
    description: { label: 'DESCRIPTION', desc: 'Item name & details' },
    precount: { label: 'PRE COUNT', desc: 'Pre-count write-in area' },
    count: { label: 'FINAL COUNT', desc: 'Final verified count write-in' },
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden flex flex-col h-full text-xs">
      {/* Top Header */}
      <div className="p-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-700" />
          <h2 className="font-bold text-zinc-900 text-sm">Count Sheet Settings</h2>
        </div>
        <button
          type="button"
          onClick={onResetToDefaults}
          title="Reset settings to standard 15-row layout"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-600 hover:text-zinc-900 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Tabs / Accordion Selectors */}
      <div className="flex items-center gap-1.5 border-b border-zinc-200 bg-zinc-100/70 p-1.5 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSection('presets')}
          className={`py-1.5 px-3 rounded-lg font-bold text-center transition-all cursor-pointer whitespace-nowrap text-xs shrink-0 ${
            activeSection === 'presets'
              ? 'bg-white text-emerald-800 shadow-xs border border-zinc-200'
              : 'text-zinc-600 hover:bg-zinc-200/50'
          }`}
        >
          Presets
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('sorting')}
          className={`py-1.5 px-3 rounded-lg font-bold text-center transition-all cursor-pointer whitespace-nowrap text-xs shrink-0 flex items-center justify-center gap-1.5 ${
            activeSection === 'sorting'
              ? 'bg-white text-emerald-800 shadow-xs border border-zinc-200'
              : 'text-zinc-600 hover:bg-zinc-200/50'
          }`}
        >
          <span>Sorting</span>
          {config.sortField && config.sortField !== 'original' && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse inline-block" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('paper')}
          className={`py-1.5 px-3 rounded-lg font-bold text-center transition-all cursor-pointer whitespace-nowrap text-xs shrink-0 ${
            activeSection === 'paper'
              ? 'bg-white text-emerald-800 shadow-xs border border-zinc-200'
              : 'text-zinc-600 hover:bg-zinc-200/50'
          }`}
        >
          Paper
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('columns')}
          className={`py-1.5 px-3 rounded-lg font-bold text-center transition-all cursor-pointer whitespace-nowrap text-xs shrink-0 ${
            activeSection === 'columns'
              ? 'bg-white text-emerald-800 shadow-xs border border-zinc-200'
              : 'text-zinc-600 hover:bg-zinc-200/50'
          }`}
        >
          Columns
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('table')}
          className={`py-1.5 px-3 rounded-lg font-bold text-center transition-all cursor-pointer whitespace-nowrap text-xs shrink-0 ${
            activeSection === 'table'
              ? 'bg-white text-emerald-800 shadow-xs border border-zinc-200'
              : 'text-zinc-600 hover:bg-zinc-200/50'
          }`}
        >
          Table
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('typography')}
          className={`py-1.5 px-3 rounded-lg font-bold text-center transition-all cursor-pointer whitespace-nowrap text-xs shrink-0 ${
            activeSection === 'typography'
              ? 'bg-white text-emerald-800 shadow-xs border border-zinc-200'
              : 'text-zinc-600 hover:bg-zinc-200/50'
          }`}
        >
          Fonts
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('barcode')}
          className={`py-1.5 px-3 rounded-lg font-bold text-center transition-all cursor-pointer whitespace-nowrap text-xs shrink-0 ${
            activeSection === 'barcode'
              ? 'bg-white text-emerald-800 shadow-xs border border-zinc-200'
              : 'text-zinc-600 hover:bg-zinc-200/50'
          }`}
        >
          Barcode
        </button>
      </div>

      {/* Body Content */}
      <div className="p-3.5 space-y-4 overflow-y-auto max-h-[calc(100vh-260px)]">
        {/* SECTION 1: PRESETS */}
        {activeSection === 'presets' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-800">Saved Layout Presets</span>
              <button
                type="button"
                onClick={() => setShowSaveModal(true)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Current as Preset</span>
              </button>
            </div>

            <div className="space-y-2">
              {presets.map(p => {
                const isSelected =
                  config.rowsPerPage === p.config.rowsPerPage &&
                  config.paperSize === p.config.paperSize &&
                  config.rowHeightMm === p.config.rowHeightMm;

                return (
                  <div
                    key={p.id}
                    className={`p-2.5 rounded-lg border transition-all flex items-start justify-between ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                        : 'border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100/60'
                    }`}
                  >
                    <div
                      className="cursor-pointer flex-1 mr-2"
                      onClick={() => onSelectPreset(p)}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-zinc-900">{p.name}</span>
                        {p.isDefault && (
                          <span className="px-1.5 py-0.2 text-[9px] bg-zinc-200 text-zinc-700 font-bold rounded-xs">
                            Standard
                          </span>
                        )}
                        {isSelected && (
                          <span className="px-1.5 py-0.2 text-[9px] bg-emerald-600 text-white font-bold rounded-xs flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5">{p.description}</p>
                      <div className="flex items-center gap-3 text-[10px] text-zinc-600 mt-1 font-mono">
                        <span>Rows: {p.config.rowsPerPage}</span>
                        <span>Paper: {p.config.paperSize}</span>
                        <span>Height: {p.config.rowHeightMm}mm</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onSelectPreset(p)}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-700 text-white'
                            : 'bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                        }`}
                      >
                        Use
                      </button>

                      {!p.isDefault && (
                        <button
                          type="button"
                          onClick={() => onDeletePreset(p.id)}
                          title="Delete preset"
                          className="p-1 text-zinc-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Save Modal */}
            {showSaveModal && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2">
                <div className="font-bold text-emerald-900 text-xs">Save Current Layout as Preset</div>
                <input
                  type="text"
                  placeholder="Preset Name (e.g. My Selling Area Layout)"
                  value={newPresetName}
                  onChange={e => setNewPresetName(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-emerald-300 rounded text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newPresetDesc}
                  onChange={e => setNewPresetDesc(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-emerald-300 rounded text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowSaveModal(false)}
                    className="px-2.5 py-1 text-zinc-600 hover:bg-zinc-100 rounded font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!newPresetName.trim()}
                    onClick={() => {
                      if (newPresetName.trim()) {
                        onSaveNewPreset(newPresetName.trim(), newPresetDesc.trim());
                        setNewPresetName('');
                        setNewPresetDesc('');
                        setShowSaveModal(false);
                      }
                    }}
                    className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded font-bold cursor-pointer"
                  >
                    Save Preset
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION: SORTING */}
        {activeSection === 'sorting' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-md">
                  <ArrowUpDown className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800">
                    Sort Count Sheet
                  </h4>
                  <p className="text-[11px] text-zinc-500">
                    Reorder items before previewing, printing, or exporting PDF
                  </p>
                </div>
              </div>
            </div>

            {/* Currently Active Status Badge */}
            <div className="p-2.5 rounded-lg border bg-zinc-50 border-zinc-200">
              <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">
                Current Active Rule
              </div>
              <div className="mt-1 flex items-center gap-2">
                {config.sortField && config.sortField !== 'original' ? (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2 py-1 rounded-md border border-emerald-200">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      Sorted by: <span className="uppercase">{config.sortField}</span> —{' '}
                      {config.sortOrder === 'desc' ? 'Descending (Z → A / 9 → 1)' : 'Ascending (A → Z / 1 → 9)'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 bg-zinc-100 px-2 py-1 rounded-md border border-zinc-200">
                    <span className="w-2 h-2 rounded-full bg-zinc-400 shrink-0" />
                    <span>Sort: Original Excel Order</span>
                  </div>
                )}
              </div>
            </div>

            {/* Form Controls */}
            <div className="space-y-3 bg-white p-3 rounded-lg border border-zinc-200">
              {/* Sort By Field */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Sort By:
                </label>
                <select
                  value={draftSortField}
                  onChange={e => setDraftSortField(e.target.value as 'sku' | 'description' | 'barcode')}
                  className="w-full px-2.5 py-1.5 text-xs border border-zinc-300 rounded-md bg-white font-medium text-zinc-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="sku">SKU (Product Code / ID)</option>
                  <option value="description">DESCRIPTION (Item Name)</option>
                  <option value="barcode">BARCODE (Barcode Number)</option>
                </select>
                <p className="text-[10px] text-zinc-400 mt-1">
                  Natural alphanumeric ordering is applied (e.g., SKU-2 precedes SKU-10).
                </p>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Order:
                </label>
                <select
                  value={draftSortOrder}
                  onChange={e => setDraftSortOrder(e.target.value as 'asc' | 'desc')}
                  className="w-full px-2.5 py-1.5 text-xs border border-zinc-300 rounded-md bg-white font-medium text-zinc-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="asc">Ascending (A → Z, 1 → 9)</option>
                  <option value="desc">Descending (Z → A, 9 → 1)</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleApplySort}
                  className="flex-1 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white text-xs font-bold rounded-md shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>APPLY SORT</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearSort}
                  disabled={!config.sortField || config.sortField === 'original'}
                  className="px-3 py-2 border border-zinc-300 bg-zinc-50 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-700 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Restore original Excel order"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>CLEAR SORT</span>
                </button>
              </div>
            </div>

            {/* Explanatory Notice */}
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-[11px] text-amber-900 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-amber-950">
                <span>Sorting Rules & Behavior:</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-amber-800">
                <li>
                  <strong>Safe & Non-Destructive:</strong> Sorting applies exclusively to the Count Sheet view/PDF/Print without altering your imported Excel dataset.
                </li>
                <li>
                  <strong>Locator Grouping Maintained:</strong> When locators are filtered, items are sorted neatly <em>within</em> each locator group; locators never mix.
                </li>
                <li>
                  <strong>Physical Count Column:</strong> The blank write-in box column remains unshifted and ready for physical inventory taking.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* SECTION 2: PAPER & PAGE SETUP */}
        {activeSection === 'paper' && (
          <div className="space-y-3.5">
            {/* Paper Size */}
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Paper Size</label>
              <select
                value={config.paperSize}
                onChange={e => handleUpdate('paperSize', e.target.value as PaperSize)}
                className="w-full px-2.5 py-1.5 border border-zinc-300 rounded-md bg-white font-medium focus:ring-1 focus:ring-emerald-500"
              >
                <option value="A4">A4 (210 × 297 mm) - Standard</option>
                <option value="SHORT_BOND">Short Bond (8.5 × 11 in / 216 × 279 mm)</option>
                <option value="LETTER">Letter (8.5 × 11 in / 216 × 279 mm)</option>
                <option value="LONG_BOND">Long Bond (8.5 × 13 in / 216 × 330 mm)</option>
                <option value="LEGAL">US Legal (8.5 × 14 in / 216 × 356 mm)</option>
                <option value="CUSTOM">Custom Size (mm)</option>
              </select>
            </div>

            {config.paperSize === 'CUSTOM' && (
              <div className="grid grid-cols-2 gap-2 p-2 bg-zinc-50 border border-zinc-200 rounded">
                <div>
                  <label className="block text-zinc-600 font-semibold mb-1">Width (mm)</label>
                  <input
                    type="number"
                    value={config.customWidthMm || 210}
                    onChange={e => handleUpdate('customWidthMm', Number(e.target.value))}
                    className="w-full px-2 py-1 border border-zinc-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 font-semibold mb-1">Height (mm)</label>
                  <input
                    type="number"
                    value={config.customHeightMm || 297}
                    onChange={e => handleUpdate('customHeightMm', Number(e.target.value))}
                    className="w-full px-2 py-1 border border-zinc-300 rounded bg-white"
                  />
                </div>
              </div>
            )}

            {/* Orientation */}
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Orientation</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdate('orientation', 'portrait')}
                  className={`py-1.5 text-center font-bold rounded border cursor-pointer ${
                    config.orientation === 'portrait'
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-300 hover:bg-zinc-100'
                  }`}
                >
                  Portrait (Default)
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdate('orientation', 'landscape')}
                  className={`py-1.5 text-center font-bold rounded border cursor-pointer ${
                    config.orientation === 'landscape'
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-300 hover:bg-zinc-100'
                  }`}
                >
                  Landscape
                </button>
              </div>
            </div>

            {/* Rows Per Page (DEFAULT 15, Options: 10, 15, 20, 25, 30, Custom) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-zinc-700">Rows Per Page</label>
                <span className="font-bold font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  {config.rowsPerPage} rows
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {[10, 15, 20, 25, 30].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleUpdate('rowsPerPage', val)}
                    className={`px-2.5 py-1 rounded font-bold cursor-pointer text-xs border ${
                      config.rowsPerPage === val
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    {val} {val === 15 && '(Default)'}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="5"
                max="50"
                value={config.rowsPerPage}
                onChange={e => handleUpdate('rowsPerPage', Math.max(1, Number(e.target.value)))}
                className="w-full px-2.5 py-1 border border-zinc-300 rounded bg-white font-mono"
                placeholder="Or enter custom number of rows"
              />
            </div>

            {/* Row Height (DEFAULT 12mm, with custom numeric input & slider) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-zinc-700">Row Height (mm)</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="6"
                    max="28"
                    step="0.5"
                    value={config.rowHeightMm}
                    onChange={e => handleUpdate('rowHeightMm', Math.max(5, Number(e.target.value)))}
                    className="w-16 px-1.5 py-0.5 border border-zinc-300 rounded bg-white text-right font-mono font-bold"
                  />
                  <span className="font-mono text-xs text-zinc-500 font-bold">mm</span>
                </div>
              </div>
              <input
                type="range"
                min="7"
                max="22"
                step="0.5"
                value={config.rowHeightMm}
                onChange={e => handleUpdate('rowHeightMm', Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <span className="text-[10px] text-zinc-500">
                Default 12mm provides ideal physical spacing for fast handheld inventory counts.
              </span>
            </div>

            {/* Margins */}
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Page Margins (mm)</label>
              <div className="grid grid-cols-4 gap-1.5">
                <div>
                  <span className="text-[10px] text-zinc-500">Top</span>
                  <input
                    type="number"
                    value={config.marginTopMm}
                    onChange={e => handleUpdate('marginTopMm', Math.max(0, Number(e.target.value)))}
                    className="w-full px-1.5 py-1 border border-zinc-300 rounded bg-white text-center font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500">Bottom</span>
                  <input
                    type="number"
                    value={config.marginBottomMm}
                    onChange={e => handleUpdate('marginBottomMm', Math.max(0, Number(e.target.value)))}
                    className="w-full px-1.5 py-1 border border-zinc-300 rounded bg-white text-center font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500">Left</span>
                  <input
                    type="number"
                    value={config.marginLeftMm}
                    onChange={e => handleUpdate('marginLeftMm', Math.max(0, Number(e.target.value)))}
                    className="w-full px-1.5 py-1 border border-zinc-300 rounded bg-white text-center font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500">Right</span>
                  <input
                    type="number"
                    value={config.marginRightMm}
                    onChange={e => handleUpdate('marginRightMm', Math.max(0, Number(e.target.value)))}
                    className="w-full px-1.5 py-1 border border-zinc-300 rounded bg-white text-center font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Continuous Multi-Locator Page-Filling (Cycle Count Mode / Paper Saver) */}
            <div className="pt-2 border-t border-zinc-200">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-700" />
                    <span className="font-bold text-zinc-900 text-xs">Continuous Page-Filling (Paper Saver)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(config.mixLocators)}
                    onChange={e => handleUpdate('mixLocators', e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-emerald-900 leading-snug">
                  {config.mixLocators
                    ? 'Active: Consecutive locators share the sheet up to maximum rows, eliminating blank rows between locators (optimized for CYCLE COUNT audits).'
                    : 'Disabled: Each locator starts on a fresh sheet (standard PCOUNT W2W Wall-to-Wall behavior).'}
                </p>
              </div>
            </div>

            {/* Ink-Saving print mode indicator */}
            <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-zinc-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  Eco Ink-Saving Printing
                </span>
                <p className="text-[10px] text-zinc-500">
                  Rows Per Page ({config.rowsPerPage}) is maximum capacity; prints only existing SKU rows without empty borders
                </p>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ACTIVE
              </span>
            </div>
          </div>
        )}

        {/* SECTION 3: MOVABLE COLUMNS & COLUMN WIDTHS */}
        {activeSection === 'columns' && (
          <div className="space-y-4">
            {/* 1. COLUMN ORDER (REORDERABLE) */}
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="font-bold text-zinc-900 uppercase tracking-wider text-[10px]">
                    COLUMN SEQUENCE & ORDER
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleResetColumnOrder}
                  className="text-[10px] font-bold text-zinc-500 hover:text-emerald-700 cursor-pointer"
                >
                  Reset Sequence
                </button>
              </div>
              <p className="text-[11px] text-zinc-600">
                Move columns left or right to reorder the table structure. Live preview and printed sheets update instantly.
              </p>

              <div className="space-y-1.5">
                {currentColumnOrder.map((colId, idx) => {
                  const meta = columnMeta[colId] || { label: colId.toUpperCase(), desc: '' };
                  const isVisible = config.columnVisibility ? config.columnVisibility[colId] !== false : true;

                  return (
                    <div
                      key={colId}
                      className={`flex items-center justify-between p-2 rounded border transition-all ${
                        isVisible
                          ? 'bg-white border-zinc-200 shadow-2xs'
                          : 'bg-zinc-100/70 border-zinc-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold font-mono text-[10px]">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-zinc-900 flex items-center gap-1.5">
                            <span>{meta.label}</span>
                            {colId === 'count' && (
                              <span className="px-1 py-0.2 bg-amber-100 text-amber-800 rounded text-[9px] font-bold">
                                Writing Area
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-500">{meta.desc}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleColumnVisibility(colId)}
                          title={isVisible ? 'Hide Column' : 'Show Column'}
                          className={`p-1.5 rounded cursor-pointer ${
                            isVisible
                              ? 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                              : 'text-zinc-400 hover:text-emerald-700 hover:bg-zinc-200'
                          }`}
                        >
                          {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveColumn(idx, 'left')}
                          title="Move Left (Earlier in table)"
                          className="p-1.5 rounded text-zinc-600 hover:text-emerald-700 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          disabled={idx === currentColumnOrder.length - 1}
                          onClick={() => handleMoveColumn(idx, 'right')}
                          title="Move Right (Later in table)"
                          className="p-1.5 rounded text-zinc-600 hover:text-emerald-700 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. COLUMN WIDTHS */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-800">Column Widths</span>
                <button
                  type="button"
                  onClick={handleAutoFitColumns}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                >
                  Auto-Distribute Width
                </button>
              </div>

              {/* Total Width Indicator */}
              <div
                className={`p-2.5 rounded-lg border text-[11px] flex items-center justify-between ${
                  isWidthExceeded
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                <span>
                  Total Width: <strong>{totalColWidthMm} mm</strong> / Printable:{' '}
                  {Math.round(printableWidthMm)} mm
                </span>
                {isWidthExceeded ? (
                  <span className="font-bold text-rose-600">Exceeds Page!</span>
                ) : (
                  <span className="font-bold text-emerald-700">Fits Page ✓</span>
                )}
              </div>

              {/* LOCATOR Column Width */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="font-bold text-zinc-700">LOCATOR Width</label>
                  <span className="font-mono text-zinc-900 font-bold">
                    {config.columnWidths.locatorMm || 26} mm
                  </span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="60"
                  value={config.columnWidths.locatorMm || 26}
                  onChange={e => handleUpdateColWidth('locatorMm', Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              {/* SKU Column Width */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="font-bold text-zinc-700">SKU Width</label>
                  <span className="font-mono text-zinc-900 font-bold">
                    {config.columnWidths.skuMm} mm
                  </span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="60"
                  value={config.columnWidths.skuMm}
                  onChange={e => handleUpdateColWidth('skuMm', Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              {/* BARCODE Column Width */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="font-bold text-zinc-700">BARCODE Width</label>
                  <span className="font-mono text-zinc-900 font-bold">
                    {config.columnWidths.barcodeMm} mm
                  </span>
                </div>
                <input
                  type="range"
                  min="25"
                  max="80"
                  value={config.columnWidths.barcodeMm}
                  onChange={e => handleUpdateColWidth('barcodeMm', Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              {/* DESCRIPTION Column Width */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="font-bold text-zinc-700">DESCRIPTION Width</label>
                  <span className="font-mono text-zinc-900 font-bold">
                    {config.columnWidths.descMm} mm
                  </span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="130"
                  value={config.columnWidths.descMm}
                  onChange={e => handleUpdateColWidth('descMm', Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              {/* PRE COUNT Column Width (Writing Area) */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="font-bold text-zinc-700">PRE COUNT Writing Box Width</label>
                  <span className="font-mono text-zinc-900 font-bold">
                    {config.columnWidths.precountMm || 23} mm
                  </span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="60"
                  value={config.columnWidths.precountMm || 23}
                  onChange={e => handleUpdateColWidth('precountMm', Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              {/* FINAL COUNT Column Width (Writing Area) */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="font-bold text-zinc-700">FINAL COUNT Writing Box Width</label>
                  <span className="font-mono text-emerald-800 font-bold">
                    {config.columnWidths.countMm} mm
                  </span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="70"
                  value={config.columnWidths.countMm}
                  onChange={e => handleUpdateColWidth('countMm', Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
                <span className="text-[10px] text-zinc-500">
                  Wider columns make it easier for fast manual handwritten count entry.
                </span>
              </div>

              {/* Row numbering toggle */}
              <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                <span className="font-bold text-zinc-800">Show Row Number (#)</span>
                <input
                  type="checkbox"
                  checked={config.showRowNumbers}
                  onChange={e => handleUpdate('showRowNumbers', e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded"
                />
              </div>

              {/* Signatures footer toggle */}
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-800">Show Counter/Validator Signatures</span>
                <input
                  type="checkbox"
                  checked={config.showSignatures}
                  onChange={e => handleUpdate('showSignatures', e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: TABLE SETTINGS (Borders, Headers, Body) */}
        {activeSection === 'table' && (
          <div className="space-y-3.5">
            {/* Table Border Master Switch */}
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Table className="w-4 h-4 text-emerald-700" />
                  <span className="font-bold text-zinc-900 text-xs">Table Borders</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.tableBorderEnabled !== false}
                  onChange={e => handleUpdate('tableBorderEnabled', e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded"
                />
              </div>
              <p className="text-[11px] text-zinc-500">
                Enhance table contrast and line definition so lines print crisp and clear.
              </p>

              {config.tableBorderEnabled !== false && (
                <div className="space-y-3 pt-2 border-t border-zinc-200">
                  {/* Border Width & Style */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-zinc-700 font-semibold mb-1">
                        Border Width ({config.tableBorderWidthPx ?? 1.5}px)
                      </label>
                      <select
                        value={config.tableBorderWidthPx ?? 1.5}
                        onChange={e => handleUpdate('tableBorderWidthPx', Number(e.target.value))}
                        className="w-full px-2 py-1 border border-zinc-300 rounded bg-white"
                      >
                        <option value="0.75">0.75px (Hairline)</option>
                        <option value="1">1px (Thin)</option>
                        <option value="1.5">1.5px (Standard - Recommended)</option>
                        <option value="2">2px (Medium)</option>
                        <option value="2.5">2.5px (Heavy)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-zinc-700 font-semibold mb-1">Border Style</label>
                      <select
                        value={config.tableBorderStyle || 'solid'}
                        onChange={e => handleUpdate('tableBorderStyle', e.target.value as any)}
                        className="w-full px-2 py-1 border border-zinc-300 rounded bg-white"
                      >
                        <option value="solid">Solid</option>
                        <option value="dashed">Dashed</option>
                        <option value="dotted">Dotted</option>
                      </select>
                    </div>
                  </div>

                  {/* Border Color */}
                  <div>
                    <label className="block text-zinc-700 font-semibold mb-1">Border Line Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.tableBorderColor || '#27272a'}
                        onChange={e => handleUpdate('tableBorderColor', e.target.value)}
                        className="w-8 h-8 rounded border border-zinc-300 cursor-pointer p-0.5"
                      />
                      <div className="flex gap-1.5 flex-1">
                        {[
                          { name: 'Dark Graphite', hex: '#27272a' },
                          { name: 'Pure Black', hex: '#000000' },
                          { name: 'Slate Gray', hex: '#475569' },
                          { name: 'Zinc Gray', hex: '#71717a' },
                        ].map(c => (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() => handleUpdate('tableBorderColor', c.hex)}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border cursor-pointer ${
                              config.tableBorderColor === c.hex
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-500 font-bold'
                                : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                            }`}
                          >
                            {c.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Specific Line Toggles */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-700 font-medium">Outer Perimeter Border</span>
                      <input
                        type="checkbox"
                        checked={config.tableOuterBorder !== false}
                        onChange={e => handleUpdate('tableOuterBorder', e.target.checked)}
                        className="w-4 h-4 accent-emerald-600 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-700 font-medium">Inner Horizontal Row Lines</span>
                      <input
                        type="checkbox"
                        checked={config.tableInnerHorizontalLines !== false}
                        onChange={e => handleUpdate('tableInnerHorizontalLines', e.target.checked)}
                        className="w-4 h-4 accent-emerald-600 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-700 font-medium">Inner Vertical Column Lines</span>
                      <input
                        type="checkbox"
                        checked={config.tableInnerVerticalLines !== false}
                        onChange={e => handleUpdate('tableInnerVerticalLines', e.target.checked)}
                        className="w-4 h-4 accent-emerald-600 rounded"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Header Settings */}
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2.5">
              <span className="font-bold text-zinc-900 uppercase tracking-wider text-[10px]">
                HEADER ROW SETTINGS
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">Header Divider Width</label>
                  <select
                    value={config.tableHeaderBorderWidthPx ?? 2}
                    onChange={e => handleUpdate('tableHeaderBorderWidthPx', Number(e.target.value))}
                    className="w-full px-2 py-1 border border-zinc-300 rounded bg-white"
                  >
                    <option value="1">1px (Thin)</option>
                    <option value="1.5">1.5px</option>
                    <option value="2">2px (Medium - Standard)</option>
                    <option value="2.5">2.5px</option>
                    <option value="3">3px (Heavy)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">Header Text Alignment</label>
                  <div className="flex border border-zinc-300 rounded overflow-hidden">
                    {(['left', 'center', 'right'] as const).map(align => (
                      <button
                        key={align}
                        type="button"
                        onClick={() => handleUpdate('tableHeaderAlign', align)}
                        className={`flex-1 py-1 flex items-center justify-center cursor-pointer ${
                          (config.tableHeaderAlign || 'left') === align
                            ? 'bg-emerald-700 text-white'
                            : 'bg-white text-zinc-600 hover:bg-zinc-100'
                        }`}
                      >
                        {align === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                        {align === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                        {align === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Body Settings */}
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2.5">
              <span className="font-bold text-zinc-900 uppercase tracking-wider text-[10px]">
                BODY CELL SETTINGS
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">Body Border Width</label>
                  <select
                    value={config.tableBodyBorderWidthPx ?? 1}
                    onChange={e => handleUpdate('tableBodyBorderWidthPx', Number(e.target.value))}
                    className="w-full px-2 py-1 border border-zinc-300 rounded bg-white"
                  >
                    <option value="0.75">0.75px</option>
                    <option value="1">1px (Standard)</option>
                    <option value="1.5">1.5px</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">Text Alignment</label>
                  <div className="flex border border-zinc-300 rounded overflow-hidden">
                    {(['left', 'center', 'right'] as const).map(align => (
                      <button
                        key={align}
                        type="button"
                        onClick={() => handleUpdate('tableBodyAlign', align)}
                        className={`flex-1 py-1 flex items-center justify-center cursor-pointer ${
                          (config.tableBodyAlign || 'left') === align
                            ? 'bg-emerald-700 text-white'
                            : 'bg-white text-zinc-600 hover:bg-zinc-100'
                        }`}
                      >
                        {align === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                        {align === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                        {align === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: TYPOGRAPHY & TEXT SIZES */}
        {activeSection === 'typography' && (
          <div className="space-y-3.5">
            {/* Header Font */}
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Header Font Family</label>
              <select
                value={config.headerFontFamily}
                onChange={e => handleUpdate('headerFontFamily', e.target.value)}
                className="w-full px-2.5 py-1.5 border border-zinc-300 rounded bg-white"
              >
                <option value="sans-serif">Sans-Serif (Inter / Helvetica / Arial)</option>
                <option value="serif">Serif (Times / Georgia)</option>
                <option value="monospace">Monospace (Courier / Menlo)</option>
              </select>
            </div>

            {/* Font Sizes Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">
                  SKU Text Size ({config.skuFontSizePt}pt)
                </label>
                <input
                  type="range"
                  min="6"
                  max="14"
                  step="0.5"
                  value={config.skuFontSizePt}
                  onChange={e => handleUpdate('skuFontSizePt', Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">
                  Desc Text Size ({config.descFontSizePt}pt)
                </label>
                <input
                  type="range"
                  min="6"
                  max="14"
                  step="0.5"
                  value={config.descFontSizePt}
                  onChange={e => handleUpdate('descFontSizePt', Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">
                  Barcode Text Size ({config.barcodeTextFontSizePt}pt)
                </label>
                <input
                  type="range"
                  min="5"
                  max="12"
                  step="0.5"
                  value={config.barcodeTextFontSizePt}
                  onChange={e => handleUpdate('barcodeTextFontSizePt', Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">
                  Table Header Size ({config.headerFontSizePt}pt)
                </label>
                <input
                  type="range"
                  min="7"
                  max="14"
                  step="0.5"
                  value={config.headerFontSizePt}
                  onChange={e => handleUpdate('headerFontSizePt', Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>
            </div>

            {/* Description Text Wrapping */}
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-800">Wrap Description Text</span>
                <input
                  type="checkbox"
                  checked={config.wrapDescription}
                  onChange={e => handleUpdate('wrapDescription', e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded"
                />
              </div>

              {config.wrapDescription && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-1">Max Lines</label>
                    <select
                      value={config.descMaxLines}
                      onChange={e => handleUpdate('descMaxLines', Number(e.target.value))}
                      className="w-full px-2 py-1 border border-zinc-300 rounded bg-white"
                    >
                      <option value="1">1 Line (Truncate)</option>
                      <option value="2">2 Lines</option>
                      <option value="3">3 Lines</option>
                      <option value="4">4 Lines</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-1">Line Height</label>
                    <select
                      value={config.descLineHeight}
                      onChange={e => handleUpdate('descLineHeight', Number(e.target.value))}
                      className="w-full px-2 py-1 border border-zinc-300 rounded bg-white"
                    >
                      <option value="1.1">Tight (1.1)</option>
                      <option value="1.25">Normal (1.25)</option>
                      <option value="1.4">Spacious (1.4)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 6: BARCODE & LOCATOR SETTINGS */}
        {activeSection === 'barcode' && (
          <div className="space-y-3.5">
            {/* Table Item Barcode */}
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2.5">
              <span className="font-bold text-zinc-900 uppercase tracking-wider text-[10px]">
                ITEM BARCODE COLUMN
              </span>

              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-800">Show Scannable Barcode</span>
                <input
                  type="checkbox"
                  checked={config.showBarcodeGraphic}
                  onChange={e => handleUpdate('showBarcodeGraphic', e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded"
                />
              </div>

              {config.showBarcodeGraphic && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Barcode Width */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="font-semibold text-zinc-700">Barcode Width</label>
                        <span className="font-mono text-zinc-900 font-bold">
                          {config.barcodeWidthMm || 36} mm
                        </span>
                      </div>
                      <input
                        type="range"
                        min="15"
                        max="60"
                        step="1"
                        value={config.barcodeWidthMm || 36}
                        onChange={e => handleUpdate('barcodeWidthMm', Number(e.target.value))}
                        className="w-full accent-emerald-600 cursor-pointer"
                      />
                    </div>

                    {/* Barcode Height */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="font-semibold text-zinc-700">Barcode Height</label>
                        <span className="font-mono text-zinc-900 font-bold">
                          {config.barcodeHeightMm} mm
                        </span>
                      </div>
                      <input
                        type="range"
                        min="4"
                        max="14"
                        step="0.5"
                        value={config.barcodeHeightMm}
                        onChange={e => handleUpdate('barcodeHeightMm', Number(e.target.value))}
                        className="w-full accent-emerald-600 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">Barcode Format</label>
                    <select
                      value={config.barcodeFormat}
                      onChange={e => handleUpdate('barcodeFormat', e.target.value as BarcodeType)}
                      className="w-full px-2 py-1 border border-zinc-300 rounded bg-white"
                    >
                      <option value="CODE128">CODE 128 (Standard)</option>
                      <option value="CODE39">CODE 39</option>
                      <option value="EAN13">EAN-13</option>
                      <option value="UPCA">UPC-A</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-700">Show Human-Readable Digits</span>
                    <input
                      type="checkbox"
                      checked={config.showBarcodeValueText !== false}
                      onChange={e => handleUpdate('showBarcodeValueText', e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Upper-Right Locator Barcode & Header Text (Removed in CYCLE COUNT continuous fill mode since Locator is a table column) */}
            {config.mixLocators ? (
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1.5">
                <span className="font-bold text-zinc-900 uppercase tracking-wider text-[10px]">
                  LOCATOR DISPLAY (CYCLE COUNT MODE)
                </span>
                <p className="text-[11px] text-zinc-600 leading-relaxed">
                  Upper-right locator header & barcode are removed in Cycle Count mode. Instead, each row includes a dedicated <strong>LOCATOR</strong> column with scannable barcode lines for continuous multi-locator page auditing.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2.5">
                <span className="font-bold text-zinc-900 uppercase tracking-wider text-[10px]">
                  UPPER-RIGHT LOCATOR HEADER & BARCODE
                </span>

                {/* Show Locator Text */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-zinc-800">Show Human-Readable Locator Text</span>
                    <p className="text-[10px] text-zinc-500">
                      Display LOCATOR code box in the top-right header area
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.showLocatorText !== false}
                    onChange={e => handleUpdate('showLocatorText', e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                </div>

                {/* Show Locator Barcode */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-200">
                  <div>
                    <span className="font-bold text-zinc-800">Show Locator Barcode</span>
                    <p className="text-[10px] text-zinc-500">
                      Dedicated optical quiet zones ensure 100% readability on handheld scanners
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.showLocatorBarcode}
                    onChange={e => handleUpdate('showLocatorBarcode', e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                </div>

                {config.showLocatorBarcode && (
                  <>
                    {/* Locator Barcode Format */}
                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">
                        Locator Symbology / Format
                      </label>
                      <select
                        value={config.locatorBarcodeFormat || 'CODE128'}
                        onChange={e =>
                          handleUpdate('locatorBarcodeFormat', e.target.value as BarcodeType)
                        }
                        className="w-full px-2 py-1 border border-zinc-300 rounded bg-white"
                      >
                        <option value="CODE128">CODE 128 (Recommended for Locators like BA-A1-B2L1)</option>
                        <option value="CODE39">CODE 39</option>
                      </select>
                    </div>

                    {/* Height */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="font-semibold text-zinc-700">Locator Barcode Height</label>
                        <span className="font-mono text-zinc-900 font-bold">
                          {config.locatorBarcodeHeightMm} mm
                        </span>
                      </div>
                      <input
                        type="range"
                        min="6"
                        max="20"
                        step="0.5"
                        value={config.locatorBarcodeHeightMm}
                        onChange={e => handleUpdate('locatorBarcodeHeightMm', Number(e.target.value))}
                        className="w-full accent-emerald-600"
                      />
                    </div>

                    {/* Width Scale */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="font-semibold text-zinc-700">Bar Width Scale</label>
                        <span className="font-mono text-zinc-900 font-bold">
                          {config.locatorBarcodeWidthScale || 1.5}x
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1.0"
                        max="2.2"
                        step="0.1"
                        value={config.locatorBarcodeWidthScale || 1.5}
                        onChange={e => handleUpdate('locatorBarcodeWidthScale', Number(e.target.value))}
                        className="w-full accent-emerald-600"
                      />
                      <span className="text-[10px] text-zinc-500">
                        1.4x – 1.6x ensures optimal narrow bar thickness for red laser beams.
                      </span>
                    </div>

                    {/* Show Text */}
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-700">Show Human-Readable Locator Text</span>
                      <input
                        type="checkbox"
                        checked={config.showLocatorBarcodeText !== false}
                        onChange={e => handleUpdate('showLocatorBarcodeText', e.target.checked)}
                        className="w-4 h-4 accent-emerald-600 rounded"
                      />
                    </div>

                    {/* Text Size */}
                    {config.showLocatorBarcodeText !== false && (
                      <div>
                        <div className="flex justify-between mb-1">
                          <label className="font-semibold text-zinc-700">Locator Text Size</label>
                          <span className="font-mono text-zinc-900 font-bold">
                            {config.locatorBarcodeTextSizePt || 8} pt
                          </span>
                        </div>
                        <input
                          type="range"
                          min="6"
                          max="12"
                          step="0.5"
                          value={config.locatorBarcodeTextSizePt || 8}
                          onChange={e => handleUpdate('locatorBarcodeTextSizePt', Number(e.target.value))}
                          className="w-full accent-emerald-600"
                        />
                      </div>
                    )}

                    {/* Alignment */}
                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">Alignment</label>
                      <div className="flex border border-zinc-300 rounded overflow-hidden">
                        {(['left', 'center', 'right'] as const).map(align => (
                          <button
                            key={align}
                            type="button"
                            onClick={() => handleUpdate('locatorBarcodeAlign', align)}
                            className={`flex-1 py-1 text-center font-bold text-xs cursor-pointer ${
                              (config.locatorBarcodeAlign || 'right') === align
                                ? 'bg-emerald-700 text-white'
                                : 'bg-white text-zinc-600 hover:bg-zinc-100'
                            }`}
                          >
                            {align === 'left' ? 'Left' : align === 'center' ? 'Center' : 'Right'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
