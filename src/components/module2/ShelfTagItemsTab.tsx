import React, { useMemo, useState } from 'react';
import {
  Search,
  Plus,
  RotateCcw,
  Trash2,
  Edit2,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Sparkles,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { Module2Config, ShelfTagItem, ShelfTagStyle } from '../../types';
import { AddEditTagModal } from './AddEditTagModal';
import { Module2ExcelImportModal } from './Module2ExcelImportModal';
import { downloadLayout2Template } from '../../utils/layout2Excel';
import { formatBuyPerAndUp } from '../../utils/shelftagExpansion';

interface ShelfTagItemsTabProps {
  items: ShelfTagItem[];
  setItems: React.Dispatch<React.SetStateAction<ShelfTagItem[]>>;
  config: Module2Config;
  onResetSamples: () => void;
  onSelectLayoutOption?: (opt: 1 | 2) => void;
  onLoadLayout2Samples?: () => void;
}

export const ShelfTagItemsTab: React.FC<ShelfTagItemsTabProps> = ({
  items,
  setItems,
  config,
  onResetSamples,
  onSelectLayoutOption,
  onLoadLayout2Samples,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStyle, setFilterStyle] = useState<'all' | 'white' | 'yellow'>('all');

  // Modal states
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<ShelfTagItem | null>(null);
  const [isExcelOpen, setIsExcelOpen] = useState(false);

  const isLayout2 = config.layoutOption === 2;

  // Counts
  const totalCount = items.length;
  const whiteCount = useMemo(() => items.filter(i => i.tagStyle === 'white').length, [items]);
  const yellowCount = useMemo(() => items.filter(i => i.tagStyle === 'yellow').length, [items]);

  // Selection tracking
  const selectedCount = useMemo(() => items.filter(i => i.isSelected !== false).length, [items]);
  const isAllSelected = items.length > 0 && items.every(i => i.isSelected !== false);

  // Total physical tags accounting for individual copies
  const totalPhysicalTags = useMemo(() => {
    return items.reduce((acc, curr) => {
      if (curr.isSelected === false) return acc;
      return acc + Math.max(1, curr.copies || 1);
    }, 0);
  }, [items]);

  // Per-SKU copy quantity updater
  const updateItemCopies = (id: string, deltaOrVal: number, isAbsolute = false) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const current = Math.max(1, item.copies || 1);
          const next = isAbsolute ? Math.max(1, deltaOrVal) : Math.max(1, current + deltaOrVal);
          return { ...item, copies: next };
        }
        return item;
      })
    );
  };

  // Bulk copy quantity updater for all selected items
  const setBulkCopies = (qty: number) => {
    const val = Math.max(1, qty);
    setItems(prev =>
      prev.map(item => {
        if (item.isSelected !== false) {
          return { ...item, copies: val };
        }
        return item;
      })
    );
  };

  // Filtered items based on search and style
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Style filter
      if (filterStyle !== 'all' && item.tagStyle !== filterStyle) {
        return false;
      }
      // Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const descMatch = item.description?.toLowerCase().includes(term);
        const skuMatch = item.sku?.toLowerCase().includes(term);
        const barcodeMatch = item.barcode?.toLowerCase().includes(term);
        const locatorMatch = item.locator?.toLowerCase().includes(term);
        return descMatch || skuMatch || barcodeMatch || locatorMatch;
      }
      return true;
    });
  }, [items, filterStyle, searchTerm]);

  // Toggle single item selection
  const toggleItemSelect = (id: string) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, isSelected: !item.isSelected } : item
      )
    );
  };

  // Toggle select all
  const toggleSelectAll = () => {
    const nextState = !isAllSelected;
    setItems(prev => prev.map(item => ({ ...item, isSelected: nextState })));
  };

  // Bulk change tag style
  const setBulkTagStyle = (style: ShelfTagStyle) => {
    setItems(prev =>
      prev.map(item => {
        if (item.isSelected !== false) {
          return {
            ...item,
            tagStyle: style,
            promoPrice: style === 'yellow' ? (item.promoPrice || Math.round(item.regularPrice * 0.85)) : null,
            promoHeader: style === 'yellow' ? (item.promoHeader || 'SPECIAL BUY') : undefined,
            promoValidity: style === 'yellow' ? (item.promoValidity || 'Special Promo Period') : undefined,
          };
        }
        return item;
      })
    );
  };

  // Delete selected tags
  const deleteSelected = () => {
    if (selectedCount === 0) return;
    if (window.confirm(`Delete ${selectedCount} selected tags?`)) {
      setItems(prev => prev.filter(item => item.isSelected === false));
    }
  };

  // Delete single tag
  const deleteSingleItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // Save add/edit tag
  const handleSaveTag = (tag: ShelfTagItem) => {
    if (editingTag) {
      setItems(prev => prev.map(i => (i.id === tag.id ? tag : i)));
    } else {
      setItems(prev => [tag, ...prev]);
    }
  };

  // Import parsed Excel items
  const handleImportExcel = (newItems: ShelfTagItem[]) => {
    setItems(newItems);
  };

  const currency = config.currencySymbol || '₱';

  return (
    <div className="space-y-4">
      {/* Layout Option Selector Banner */}
      <div className="bg-white border border-zinc-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-black uppercase text-zinc-700 tracking-wider">
            Layout Preset:
          </span>
          <div className="inline-flex rounded-lg border border-zinc-200 p-0.5 bg-zinc-100">
            <button
              type="button"
              onClick={() => onSelectLayoutOption?.(1)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                !isLayout2
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Layout Option 1 (Standard / Current)
            </button>
            <button
              type="button"
              onClick={() => onSelectLayoutOption?.(2)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                isLayout2
                  ? 'bg-amber-400 text-zinc-950 shadow-xs font-extrabold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <span>Layout Option 2 (Reference Layout)</span>
              {isLayout2 && (
                <span className="px-1.5 py-0.2 bg-amber-200 text-amber-950 rounded text-[9px] font-black uppercase">
                  Active
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="text-xs text-zinc-600 flex items-center gap-3">
          <span>Total Tags: <strong className="text-zinc-900 font-bold">{totalCount}</strong></span>
          <span>•</span>
          <span>Selected SKUs: <strong className="text-zinc-900 font-bold">{selectedCount}</strong></span>
          <span>•</span>
          <span>Physical Prints: <strong className="text-amber-700 font-extrabold">{totalPhysicalTags}</strong></span>
        </div>
      </div>

      {/* Layout Option 2 8-Step Retail Tag Workflow Guide */}
      {isLayout2 && (
        <div className="p-3.5 bg-linear-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-xl text-xs text-amber-950 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 font-black tracking-wide uppercase text-[11px] text-amber-900">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Layout Option 2 — Official 8-Step Retail Tag Workflow</span>
            </div>
            <button
              type="button"
              onClick={() => downloadLayout2Template()}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-zinc-950 font-black rounded-lg text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Download Import Template (.xlsx)</span>
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-1.5 text-[10.5px] font-bold">
            <div className="bg-white/85 p-2 rounded-lg border border-amber-200 text-center shadow-2xs">
              <span className="text-amber-700 block font-mono text-[9px]">STEP 1</span>Select Layout 2
            </div>
            <div className="bg-white/85 p-2 rounded-lg border border-amber-200 text-center shadow-2xs">
              <span className="text-amber-700 block font-mono text-[9px]">STEP 2</span>Download Template
            </div>
            <div className="bg-white/85 p-2 rounded-lg border border-amber-200 text-center shadow-2xs">
              <span className="text-amber-700 block font-mono text-[9px]">STEP 3</span>Fill in Excel
            </div>
            <div className="bg-white/85 p-2 rounded-lg border border-amber-200 text-center shadow-2xs">
              <span className="text-amber-700 block font-mono text-[9px]">STEP 4</span>Import Excel
            </div>
            <div className="bg-white/85 p-2 rounded-lg border border-amber-200 text-center shadow-2xs">
              <span className="text-amber-700 block font-mono text-[9px]">STEP 5</span>Review Items
            </div>
            <div className="bg-white/85 p-2 rounded-lg border border-amber-200 text-center shadow-2xs">
              <span className="text-amber-700 block font-mono text-[9px]">STEP 6</span>Set Copy QTY
            </div>
            <div className="bg-white/85 p-2 rounded-lg border border-amber-200 text-center shadow-2xs">
              <span className="text-amber-700 block font-mono text-[9px]">STEP 7</span>Live Preview
            </div>
            <div className="bg-white/85 p-2 rounded-lg border border-amber-200 text-center shadow-2xs">
              <span className="text-amber-700 block font-mono text-[9px]">STEP 8</span>Print / PDF
            </div>
          </div>
        </div>
      )}

      {/* Search & Actions Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
        {/* Left: Search input & Style Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search description, SKU, barcode..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-zinc-300 rounded-lg text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-lg border border-zinc-200 text-xs">
            <button
              type="button"
              onClick={() => setFilterStyle('all')}
              className={`px-3 py-1 rounded-md font-bold cursor-pointer transition-colors ${
                filterStyle === 'all'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStyle('white')}
              className={`px-3 py-1 rounded-md font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                filterStyle === 'white'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <span>⚪</span>
              <span>White ({whiteCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterStyle('yellow')}
              className={`px-3 py-1 rounded-md font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                filterStyle === 'yellow'
                  ? 'bg-amber-400 text-zinc-950 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <span>🟡</span>
              <span>Yellow ({yellowCount})</span>
            </button>
          </div>
        </div>

        {/* Right: Download Template (Layout 2), Import Excel, Add Single Tag, Reset Samples */}
        <div className="flex items-center gap-2 shrink-0">
          {isLayout2 && (
            <button
              type="button"
              onClick={() => downloadLayout2Template()}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-zinc-950 font-black rounded-lg text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              title="Download official Layout Option 2 Excel Template (.xlsx)"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Download Template</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExcelOpen(true)}
            className="px-3 py-1.5 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-700 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Import Excel</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingTag(null);
              setIsAddEditOpen(true);
            }}
            className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-black rounded-lg text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Single Tag</span>
          </button>

          <button
            type="button"
            onClick={onResetSamples}
            title="Reset to Sample Retail Tags"
            className="p-1.5 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 rounded-lg text-xs shadow-2xs cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Select All Checkbox */}
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex items-center gap-2 font-bold text-zinc-800 cursor-pointer hover:text-black"
          >
            {isAllSelected ? (
              <CheckSquare className="w-4 h-4 text-zinc-900 fill-zinc-900 stroke-white" />
            ) : (
              <Square className="w-4 h-4 text-zinc-400" />
            )}
            <span>Select All ({totalCount})</span>
          </button>

          {/* Bulk Tag Color for selected */}
          <div className="flex items-center gap-2 border-l border-zinc-200 pl-4">
            <span className="text-zinc-600 font-medium">
              Tag Color ({selectedCount}):
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={selectedCount === 0}
                onClick={() => setBulkTagStyle('white')}
                className={`px-2.5 py-1 rounded-md font-bold cursor-pointer transition-all border text-xs flex items-center gap-1 ${
                  selectedCount === 0
                    ? 'opacity-50 cursor-not-allowed bg-zinc-100 text-zinc-400 border-zinc-200'
                    : 'bg-white hover:bg-zinc-100 text-zinc-800 border-zinc-300 shadow-2xs'
                }`}
              >
                <span>⚪</span>
                <span>White (Regular)</span>
              </button>

              <button
                type="button"
                disabled={selectedCount === 0}
                onClick={() => setBulkTagStyle('yellow')}
                className={`px-2.5 py-1 rounded-md font-bold cursor-pointer transition-all border text-xs flex items-center gap-1 ${
                  selectedCount === 0
                    ? 'opacity-50 cursor-not-allowed bg-zinc-100 text-zinc-400 border-zinc-200'
                    : 'bg-amber-400 hover:bg-amber-500 text-zinc-950 border-amber-500 shadow-2xs'
                }`}
              >
                <span>🟡</span>
                <span>Yellow (PP)</span>
              </button>
            </div>
          </div>

          {/* Bulk Copies for Selected */}
          <div className="flex items-center gap-1.5 border-l border-zinc-200 pl-4">
            <span className="text-zinc-600 font-medium">Copies:</span>
            {[1, 2, 3, 5].map(cnt => (
              <button
                key={`bulk-copy-${cnt}`}
                type="button"
                disabled={selectedCount === 0}
                onClick={() => setBulkCopies(cnt)}
                className="px-2 py-0.5 text-xs font-bold rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 disabled:opacity-40 cursor-pointer shadow-2xs"
                title={`Set ${cnt} copy for all ${selectedCount} selected tags`}
              >
                {cnt}x
              </button>
            ))}
          </div>
        </div>

        {/* Delete Selected & Total Physical Tags Count */}
        <div className="flex items-center gap-3">
          <div className="text-xs font-bold text-zinc-600">
            Physical Output: <span className="font-extrabold text-amber-700">{totalPhysicalTags} tags</span>
          </div>

          {selectedCount > 0 && (
            <button
              type="button"
              onClick={deleteSelected}
              className="text-red-600 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer hover:bg-red-50 px-2 py-1 rounded-md transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              {isLayout2 ? (
                /* Layout Option 2 Specific Column Headers matching template */
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-extrabold text-[11px] tracking-wider uppercase">
                  <th className="py-2.5 px-3 w-10 text-center">SEL</th>
                  <th className="py-2.5 px-3 w-32">TAG STYLE</th>
                  <th className="py-2.5 px-3">DESCRIPTION</th>
                  <th className="py-2.5 px-3 w-36">BARCODE</th>
                  <th className="py-2.5 px-3 w-28 text-right">PRICE</th>
                  <th className="py-2.5 px-3 w-20">UNIT</th>
                  <th className="py-2.5 px-3 w-28">SKU</th>
                  <th className="py-2.5 px-3 w-24">DATE</th>
                  <th className="py-2.5 px-3 w-36">BUY PER & UP</th>
                  <th className="py-2.5 px-3 w-24 text-center">COPY QTY</th>
                  <th className="py-2.5 px-3 w-20 text-center">ACTION</th>
                </tr>
              ) : (
                /* Layout Option 1 Existing Column Headers */
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-extrabold text-[11px] tracking-wider uppercase">
                  <th className="py-2.5 px-3 w-10 text-center">SEL</th>
                  <th className="py-2.5 px-3 w-36">TAG STYLE</th>
                  <th className="py-2.5 px-3">DESCRIPTION</th>
                  <th className="py-2.5 px-3 w-28">SKU / CODE</th>
                  <th className="py-2.5 px-3 w-36">BARCODE</th>
                  <th className="py-2.5 px-3 w-28 text-right">REGULAR PRICE</th>
                  <th className="py-2.5 px-3 w-28 text-right">PROMO PRICE</th>
                  <th className="py-2.5 px-3 w-20">UNIT</th>
                  <th className="py-2.5 px-3 w-20">LOCATOR</th>
                  <th className="py-2.5 px-3 w-24 text-center">COPIES</th>
                  <th className="py-2.5 px-3 w-20 text-center">ACTION</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={isLayout2 ? 11 : 11} className="py-12 px-4 text-center">
                    {isLayout2 ? (
                      /* Empty state specifically designed for Layout Option 2 */
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center mx-auto text-amber-700">
                          <FileSpreadsheet className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-zinc-900">
                            No Layout Option 2 items loaded
                          </h4>
                          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                            Download the official template and import your completed Excel file to generate White and Yellow reference tags.
                          </p>
                        </div>
                        <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => downloadLayout2Template()}
                            className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-zinc-950 font-black rounded-lg text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Download Template</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsExcelOpen(true)}
                            className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Import Excel</span>
                          </button>
                          {onLoadLayout2Samples && (
                            <button
                              type="button"
                              onClick={onLoadLayout2Samples}
                              className="px-3.5 py-1.5 bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-800 font-bold rounded-lg text-xs cursor-pointer shadow-2xs"
                            >
                              Load Reference Samples
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 text-zinc-400">
                        No items found matching your filters.
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const isYellow = item.tagStyle === 'yellow';

                  if (isLayout2) {
                    // Layout Option 2 Row
                    const buyLines = formatBuyPerAndUp(item);

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-zinc-50/80 transition-colors ${
                          item.isSelected !== false ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={item.isSelected !== false}
                            onChange={() => toggleItemSelect(item.id)}
                            className="w-4 h-4 rounded-sm border-zinc-300 text-zinc-900 focus:ring-amber-500 cursor-pointer"
                          />
                        </td>

                        {/* Tag Style Badge */}
                        <td className="py-2.5 px-3">
                          <button
                            type="button"
                            onClick={() => {
                              setItems(prev =>
                                prev.map(i =>
                                  i.id === item.id
                                    ? { ...i, tagStyle: i.tagStyle === 'yellow' ? 'white' : 'yellow' }
                                    : i
                                )
                              );
                            }}
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-bold text-[10.5px] cursor-pointer transition-all border ${
                              isYellow
                                ? 'bg-amber-400 text-zinc-950 border-amber-500 hover:bg-amber-300'
                                : 'bg-zinc-100 text-zinc-800 border-zinc-300 hover:bg-zinc-200'
                            }`}
                            title="Click to toggle Tag Style"
                          >
                            <span>{isYellow ? '🟡' : '⚪'}</span>
                            <span>{isYellow ? 'YELLOW (PP)' : 'WHITE (REG)'}</span>
                          </button>
                        </td>

                        {/* Description */}
                        <td className="py-2.5 px-3 font-semibold text-zinc-900">
                          <div className="uppercase line-clamp-1">{item.description}</div>
                        </td>

                        {/* Barcode (preserved string) */}
                        <td className="py-2.5 px-3 font-mono font-bold text-zinc-800">
                          {item.barcode || item.sku}
                        </td>

                        {/* Price */}
                        <td className="py-2.5 px-3 text-right font-mono font-black text-zinc-950">
                          {currency} {(item.promoPrice != null && item.promoPrice > 0 ? item.promoPrice : item.regularPrice || 0).toFixed(2)}
                        </td>

                        {/* Unit */}
                        <td className="py-2.5 px-3 font-medium text-zinc-700">
                          {item.unit || 'PCS'}
                        </td>

                        {/* SKU */}
                        <td className="py-2.5 px-3 font-mono font-semibold text-zinc-600">
                          {item.sku}
                        </td>

                        {/* Date */}
                        <td className="py-2.5 px-3 text-zinc-600 font-mono text-[11px]">
                          {item.tagDate || '--'}
                        </td>

                        {/* Buy Per & Up */}
                        <td className="py-2.5 px-3">
                          {isYellow ? (
                            <span className="font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                              {buyLines.join(' / ')}
                            </span>
                          ) : (
                            <span className="text-zinc-300 text-center block">--</span>
                          )}
                        </td>

                        {/* Copy QTY */}
                        <td className="py-2.5 px-3 text-center">
                          <div className="inline-flex items-center border border-zinc-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                            <button
                              type="button"
                              onClick={() => updateItemCopies(item.id, -1)}
                              disabled={(item.copies || 1) <= 1}
                              className="w-6 h-6 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold disabled:opacity-30 cursor-pointer text-xs"
                              title="Decrease copy quantity"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.copies || 1}
                              onChange={e => updateItemCopies(item.id, parseInt(e.target.value, 10) || 1, true)}
                              className="w-8 h-6 text-center font-bold text-zinc-900 text-xs focus:outline-hidden border-x border-zinc-200"
                              title="Copy quantity for this SKU"
                            />
                            <button
                              type="button"
                              onClick={() => updateItemCopies(item.id, 1)}
                              className="w-6 h-6 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold cursor-pointer text-xs"
                              title="Increase copy quantity"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTag(item);
                                setIsAddEditOpen(true);
                              }}
                              className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md cursor-pointer"
                              title="Edit Tag"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteSingleItem(item.id)}
                              className="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md cursor-pointer"
                              title="Delete Tag"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  // Layout Option 1 Row (Existing)
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-zinc-50/80 transition-colors ${
                        item.isSelected !== false ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={item.isSelected !== false}
                          onChange={() => toggleItemSelect(item.id)}
                          className="w-4 h-4 rounded-sm border-zinc-300 text-zinc-900 focus:ring-amber-500 cursor-pointer"
                        />
                      </td>

                      {/* Tag Style Badge */}
                      <td className="py-2.5 px-3">
                        <button
                          type="button"
                          onClick={() => {
                            setItems(prev =>
                              prev.map(i =>
                                i.id === item.id
                                  ? {
                                      ...i,
                                      tagStyle: i.tagStyle === 'yellow' ? 'white' : 'yellow',
                                      promoPrice:
                                        i.tagStyle === 'white'
                                          ? i.promoPrice || Math.round(i.regularPrice * 0.85)
                                          : null,
                                      promoHeader:
                                        i.tagStyle === 'white'
                                          ? i.promoHeader || 'SAVE ₱15.00'
                                          : undefined,
                                      promoValidity:
                                        i.tagStyle === 'white'
                                          ? i.promoValidity || 'Valid until Sept 30'
                                          : undefined,
                                    }
                                  : i
                              )
                            );
                          }}
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-bold text-[10.5px] cursor-pointer transition-all border ${
                            isYellow
                              ? 'bg-amber-400 text-zinc-950 border-amber-500 hover:bg-amber-300'
                              : 'bg-zinc-100 text-zinc-800 border-zinc-300 hover:bg-zinc-200'
                          }`}
                          title="Click to toggle Tag Style"
                        >
                          <span>{isYellow ? '🟡' : '⚪'}</span>
                          <span>{isYellow ? 'YELLOW (PP)' : 'WHITE (REG)'}</span>
                        </button>
                      </td>

                      {/* Description + Promo Subtext */}
                      <td className="py-2.5 px-3 font-semibold text-zinc-900">
                        <div className="uppercase line-clamp-1">{item.description}</div>
                        {isYellow && item.promoSubtext && (
                          <div className="text-[10.5px] font-bold text-red-600 mt-0.5 tracking-tight">
                            {item.promoSubtext}
                          </div>
                        )}
                      </td>

                      {/* SKU */}
                      <td className="py-2.5 px-3 font-mono font-bold text-zinc-700">
                        {item.sku}
                      </td>

                      {/* Barcode */}
                      <td className="py-2.5 px-3 font-mono text-zinc-600">
                        {item.barcode}
                      </td>

                      {/* Regular Price */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-900">
                        {currency} {item.regularPrice ? item.regularPrice.toFixed(0) : '0'}
                      </td>

                      {/* Promo Price */}
                      <td className="py-2.5 px-3 text-right font-mono font-black">
                        {isYellow && item.promoPrice != null ? (
                          <span className="text-red-600">
                            {currency} {item.promoPrice.toFixed(0)}
                          </span>
                        ) : (
                          <span className="text-zinc-300">--</span>
                        )}
                      </td>

                      {/* Unit */}
                      <td className="py-2.5 px-3 font-medium text-zinc-600">
                        {item.unit}
                      </td>

                      {/* Locator */}
                      <td className="py-2.5 px-3 font-mono font-bold text-zinc-800">
                        {item.locator || '--'}
                      </td>

                      {/* Per-SKU Copy Quantity Stepper */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="inline-flex items-center border border-zinc-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                          <button
                            type="button"
                            onClick={() => updateItemCopies(item.id, -1)}
                            disabled={(item.copies || 1) <= 1}
                            className="w-6 h-6 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold disabled:opacity-30 cursor-pointer text-xs"
                            title="Decrease copy quantity"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.copies || 1}
                            onChange={e => updateItemCopies(item.id, parseInt(e.target.value, 10) || 1, true)}
                            className="w-8 h-6 text-center font-bold text-zinc-900 text-xs focus:outline-hidden border-x border-zinc-200"
                            title="Copy quantity for this SKU"
                          />
                          <button
                            type="button"
                            onClick={() => updateItemCopies(item.id, 1)}
                            className="w-6 h-6 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold cursor-pointer text-xs"
                            title="Increase copy quantity"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTag(item);
                              setIsAddEditOpen(true);
                            }}
                            className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md cursor-pointer"
                            title="Edit Tag"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSingleItem(item.id)}
                            className="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md cursor-pointer"
                            title="Delete Tag"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Tag Modal */}
      <AddEditTagModal
        isOpen={isAddEditOpen}
        onClose={() => {
          setIsAddEditOpen(false);
          setEditingTag(null);
        }}
        onSave={handleSaveTag}
        initialTag={editingTag}
      />

      {/* Excel Import Modal */}
      <Module2ExcelImportModal
        isOpen={isExcelOpen}
        onClose={() => setIsExcelOpen(false)}
        onImport={handleImportExcel}
        layoutOption={config.layoutOption}
      />
    </div>
  );
};
