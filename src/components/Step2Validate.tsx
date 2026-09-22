import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Trash2,
  Edit2,
  Download,
  ArrowRight,
  Sparkles,
  CheckSquare,
  Square,
  RefreshCw,
  Eye,
  FileSpreadsheet,
  Tag,
} from 'lucide-react';
import { InventoryItem, ValidationSummary, ValidationIssue } from '../types';
import { revalidateItems, exportInventoryToExcel } from '../utils/excelParser';

interface Step2ValidateProps {
  items: InventoryItem[];
  summary: ValidationSummary;
  filename: string;
  onUpdateItems: (newItems: InventoryItem[], newSummary: ValidationSummary) => void;
  onContinue: () => void;
  onGenerateCountSheet?: () => void;
  onBackToImport: () => void;
}

type FilterMode = 'all' | 'valid' | 'warning' | 'error' | 'selected';
type SortField = 'locator' | 'sku' | 'upcNo' | 'description' | 'count' | 'counter' | 'scanner' | 'validator';
type SortDir = 'asc' | 'desc';

export const Step2Validate: React.FC<Step2ValidateProps> = ({
  items,
  summary,
  filename,
  onUpdateItems,
  onContinue,
  onGenerateCountSheet,
  onBackToImport,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [sortField, setSortField] = useState<SortField>('locator');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Edit item state
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Map issues by item ID for rapid lookup
  const issuesByItemId = useMemo(() => {
    const map = new Map<string, ValidationIssue[]>();
    summary.issues.forEach(issue => {
      const list = map.get(issue.itemId) || [];
      list.push(issue);
      map.set(issue.itemId, list);
    });
    return map;
  }, [summary.issues]);

  // Selected items count
  const selectedCount = useMemo(() => {
    return items.filter(it => it.isSelected !== false).length;
  }, [items]);

  // Filtered and sorted items
  const displayedItems = useMemo(() => {
    return items
      .filter(item => {
        // Filter by tab
        const itemIssues = issuesByItemId.get(item.id) || [];
        const hasError = itemIssues.some(i => i.severity === 'error');
        const hasWarning = itemIssues.some(i => i.severity === 'warning');

        if (filterMode === 'valid' && (hasError || hasWarning)) return false;
        if (filterMode === 'warning' && !hasWarning) return false;
        if (filterMode === 'error' && !hasError) return false;
        if (filterMode === 'selected' && item.isSelected === false) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const match =
            item.locator.toLowerCase().includes(q) ||
            item.sku.toLowerCase().includes(q) ||
            item.upcNo.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q) ||
            item.barcode.toLowerCase().includes(q) ||
            item.counter.toLowerCase().includes(q) ||
            (item.scanner && item.scanner.toLowerCase().includes(q)) ||
            (item.validator && item.validator.toLowerCase().includes(q));
          if (!match) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let valA = a[sortField] ?? '';
        let valB = b[sortField] ?? '';

        if (sortField === 'count') {
          valA = Number(valA) || 0;
          valB = Number(valB) || 0;
        } else {
          valA = String(valA).toLowerCase();
          valB = String(valB).toLowerCase();
        }

        if (valA < valB) return sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
  }, [items, filterMode, searchQuery, sortField, sortDir, issuesByItemId]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const handleToggleSelect = (id: string) => {
    const updated = items.map(it => (it.id === id ? { ...it, isSelected: !it.isSelected } : it));
    onUpdateItems(updated, summary);
  };

  const handleSelectAll = (select: boolean) => {
    const updated = items.map(it => ({ ...it, isSelected: select }));
    onUpdateItems(updated, summary);
  };

  const handleDeleteItem = (id: string) => {
    const updated = items.filter(it => it.id !== id);
    const newSummary = revalidateItems(updated);
    onUpdateItems(updated, newSummary);
  };

  const handleDeleteSelected = () => {
    if (!confirm(`Are you sure you want to remove ${selectedCount} selected items?`)) return;
    const updated = items.filter(it => it.isSelected === false);
    const newSummary = revalidateItems(updated);
    onUpdateItems(updated, newSummary);
  };

  const handleSaveEdit = (edited: InventoryItem) => {
    let updated: InventoryItem[];
    if (isAddingNew) {
      updated = [edited, ...items];
    } else {
      updated = items.map(it => (it.id === edited.id ? edited : it));
    }
    const newSummary = revalidateItems(updated);
    onUpdateItems(updated, newSummary);
    setEditingItem(null);
    setIsAddingNew(false);
  };

  const handleAutoFixIssues = () => {
    const updated = items.map(item => {
      let barcode = item.barcode;
      let upcNo = item.upcNo;
      let count = item.count;
      let locator = item.locator;

      // Fix barcode from upc if empty
      if (!barcode && upcNo) barcode = upcNo;
      if (!upcNo && barcode) upcNo = barcode;

      // Format locator uppercase
      if (locator) locator = locator.toUpperCase().trim();

      // Normalize count if empty or invalid
      if (count === '' || isNaN(Number(count))) {
        count = 0;
      }

      return {
        ...item,
        barcode,
        upcNo,
        count,
        locator,
      };
    });

    const newSummary = revalidateItems(updated);
    onUpdateItems(updated, newSummary);
  };

  const handleExportExcel = () => {
    exportInventoryToExcel(items, `validated_${filename || 'inventory'}`);
  };

  return (
    <div className="space-y-6">
      {/* 1. Validation Summary Banner */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                STEP 2 — VALIDATE & EDIT
              </span>
              <span className="text-xs text-zinc-500 font-mono">Source: {filename}</span>
            </div>
            <h2 className="text-2xl font-black text-zinc-900 mt-2">Data Validation Summary</h2>
            <p className="text-sm text-zinc-600 mt-0.5">
              Review imported rows, correct any missing values or warnings, and select items for tag generation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onBackToImport}
              className="px-3.5 py-2 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
            >
              Re-upload Excel
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-zinc-500" />
              Export Excel
            </button>
            {onGenerateCountSheet && (
              <button
                type="button"
                onClick={onGenerateCountSheet}
                disabled={selectedCount === 0}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 disabled:bg-zinc-200 disabled:border-zinc-300 disabled:text-zinc-400 rounded-lg shadow-2xs transition-colors cursor-pointer"
                title="Generate printable Count Sheets for physical inventory counting"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-800" />
                <span>Generate Count Sheet</span>
              </button>
            )}
            <button
              type="button"
              onClick={onContinue}
              disabled={selectedCount === 0}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-zinc-300 rounded-lg shadow-sm transition-colors cursor-pointer"
              title="Configure and generate shelf count tags"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Generate Count Tags</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </div>

        {/* Missing Columns Warning */}
        {summary.missingRequiredColumns.length > 0 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-amber-800 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Missing Standard Column(s): </span>
              {summary.missingRequiredColumns.join(', ')}. Default values were substituted or will need manual input.
            </div>
          </div>
        )}

        {/* 4 Key Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-5">
          <div
            onClick={() => setFilterMode('all')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              filterMode === 'all'
                ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                : 'bg-zinc-50 hover:bg-zinc-100/80 text-zinc-900 border-zinc-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider opacity-80">Total Rows</span>
              <span className="text-xs font-mono font-bold">100%</span>
            </div>
            <div className="text-2xl font-black mt-2">{summary.totalRows}</div>
            <div className="text-xs opacity-75 mt-0.5">Imported items in file</div>
          </div>

          <div
            onClick={() => setFilterMode('valid')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              filterMode === 'valid'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                : 'bg-emerald-50/70 hover:bg-emerald-100/80 text-emerald-950 border-emerald-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider opacity-90 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Valid Items
              </span>
              <span className="text-xs font-mono font-bold">
                {summary.totalRows > 0 ? Math.round((summary.validItems / summary.totalRows) * 100) : 0}%
              </span>
            </div>
            <div className="text-2xl font-black mt-2 text-emerald-800">{summary.validItems}</div>
            <div className="text-xs opacity-75 mt-0.5">Ready to print with zero errors</div>
          </div>

          <div
            onClick={() => setFilterMode('warning')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              filterMode === 'warning'
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                : 'bg-amber-50/70 hover:bg-amber-100/80 text-amber-950 border-amber-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider opacity-90 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Warnings
              </span>
              <span className="text-xs font-mono font-bold">{summary.warningItems}</span>
            </div>
            <div className="text-2xl font-black mt-2 text-amber-800">{summary.warningItems}</div>
            <div className="text-xs opacity-75 mt-0.5">Duplicate codes or missing tags</div>
          </div>

          <div
            onClick={() => setFilterMode('error')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              filterMode === 'error'
                ? 'bg-rose-700 text-white border-rose-700 shadow-sm'
                : 'bg-rose-50/70 hover:bg-rose-100/80 text-rose-950 border-rose-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider opacity-90 flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                Errors
              </span>
              <span className="text-xs font-mono font-bold">{summary.errorItems}</span>
            </div>
            <div className="text-2xl font-black mt-2 text-rose-800">{summary.errorItems}</div>
            <div className="text-xs opacity-75 mt-0.5">Missing SKU / Barcode / Desc</div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Data Table with Search & Controls */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-zinc-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-zinc-50/50">
          <div className="flex flex-1 items-center gap-2 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search SKU, Locator, Description, Barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Tabs */}
            <div className="inline-flex bg-zinc-200/80 p-0.5 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filterMode === 'all' ? 'bg-white font-bold text-zinc-900 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                All ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('selected')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filterMode === 'selected' ? 'bg-white font-bold text-zinc-900 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Selected ({selectedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('warning')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filterMode === 'warning' ? 'bg-white font-bold text-amber-700 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Issues ({summary.warningItems + summary.errorItems})
              </button>
            </div>

            {/* Auto Fix Button */}
            {(summary.warningItems > 0 || summary.errorItems > 0) && (
              <button
                type="button"
                onClick={handleAutoFixIssues}
                title="Automatically populate missing barcodes from UPC, uppercase locators, and normalize counts"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Auto-Fix Common Issues
              </button>
            )}

            {/* Add Item Button */}
            <button
              type="button"
              onClick={() => {
                setEditingItem({
                  id: `new-${Date.now()}`,
                  locator: 'A01-01',
                  sku: '',
                  upcNo: '',
                  description: '',
                  barcode: '',
                  count: 0,
                  counter: '',
                  scanner: '',
                  validator: '',
                  copies: 1,
                  isSelected: true,
                });
                setIsAddingNew(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-800 bg-white hover:bg-zinc-50 border border-zinc-300 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-zinc-600" />
              Add Item
            </button>

            {/* Bulk Selection Actions */}
            <div className="flex items-center gap-1 border-l border-zinc-300 pl-2">
              <button
                type="button"
                onClick={() => handleSelectAll(true)}
                title="Select all"
                className="p-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md cursor-pointer"
              >
                <CheckSquare className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleSelectAll(false)}
                title="Deselect all"
                className="p-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md cursor-pointer"
              >
                <Square className="w-4 h-4" />
              </button>
              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  title="Remove selected items"
                  className="p-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-md cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Table */}
        <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-zinc-100 text-zinc-700 sticky top-0 z-10 border-b border-zinc-200 font-bold select-none">
              <tr>
                <th className="px-3 py-2.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedCount === items.length && items.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded-xs text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>
                <th className="px-3 py-2.5 w-12 text-zinc-500 font-mono text-[11px]">#</th>
                <th
                  onClick={() => handleSort('locator')}
                  className="px-3 py-2.5 cursor-pointer hover:bg-zinc-200/70 transition-colors"
                >
                  <div className="flex items-center gap-1 font-bold">
                    <span>LOCATOR</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('sku')}
                  className="px-3 py-2.5 cursor-pointer hover:bg-zinc-200/70 transition-colors"
                >
                  <div className="flex items-center gap-1 font-bold">
                    <span>SKU</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('upcNo')}
                  className="px-3 py-2.5 cursor-pointer hover:bg-zinc-200/70 transition-colors"
                >
                  <div className="flex items-center gap-1 font-bold">
                    <span>UPC NO</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('description')}
                  className="px-3 py-2.5 cursor-pointer hover:bg-zinc-200/70 transition-colors min-w-[200px]"
                >
                  <div className="flex items-center gap-1 font-bold">
                    <span>DESCRIPTION</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  </div>
                </th>
                <th className="px-3 py-2.5 font-bold">BARCODE</th>
                <th
                  onClick={() => handleSort('count')}
                  className="px-3 py-2.5 cursor-pointer hover:bg-zinc-200/70 transition-colors w-20 text-right"
                >
                  <div className="flex items-center justify-end gap-1 font-bold">
                    <span>COUNT</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('counter')}
                  className="px-3 py-2.5 cursor-pointer hover:bg-zinc-200/70 transition-colors"
                >
                  <div className="flex items-center gap-1 font-bold">
                    <span>COUNTER</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('scanner')}
                  className="px-3 py-2.5 cursor-pointer hover:bg-zinc-200/70 transition-colors"
                >
                  <div className="flex items-center gap-1 font-bold">
                    <span>SCANNER</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('validator')}
                  className="px-3 py-2.5 cursor-pointer hover:bg-zinc-200/70 transition-colors"
                >
                  <div className="flex items-center gap-1 font-bold">
                    <span>VALIDATOR</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  </div>
                </th>
                <th className="px-3 py-2.5 text-center w-16">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-zinc-800 bg-white font-medium">
              {displayedItems.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-12 text-zinc-400">
                    No inventory items matched your criteria.
                  </td>
                </tr>
              ) : (
                displayedItems.map((item, index) => {
                  const itemIssues = issuesByItemId.get(item.id) || [];
                  const hasError = itemIssues.some(i => i.severity === 'error');
                  const hasWarning = itemIssues.some(i => i.severity === 'warning');

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-zinc-50 transition-colors ${
                        item.isSelected === false ? 'opacity-40 bg-zinc-50/40' : ''
                      } ${hasError ? 'bg-rose-50/40' : hasWarning ? 'bg-amber-50/30' : ''}`}
                    >
                      {/* Selection Checkbox */}
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={item.isSelected !== false}
                          onChange={() => handleToggleSelect(item.id)}
                          className="rounded-xs text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>

                      {/* Row Index */}
                      <td className="px-3 py-2 text-zinc-400 font-mono text-[11px]">
                        {index + 1}
                      </td>

                      {/* LOCATOR */}
                      <td className="px-3 py-2 font-mono font-bold text-zinc-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded-sm">
                            {item.locator || '---'}
                          </span>
                          {!item.locator && (
                            <span title="Missing locator" className="text-amber-500">
                              ⚠️
                            </span>
                          )}
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="px-3 py-2 font-mono font-bold text-zinc-900 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span>{item.sku || 'MISSING'}</span>
                          {!item.sku && (
                            <span title="Required SKU is missing" className="text-rose-500 font-bold">
                              ❌
                            </span>
                          )}
                        </div>
                      </td>

                      {/* UPC */}
                      <td className="px-3 py-2 font-mono text-zinc-600 whitespace-nowrap">
                        {item.upcNo || '---'}
                      </td>

                      {/* DESCRIPTION */}
                      <td className="px-3 py-2 font-medium text-zinc-900 max-w-xs truncate" title={item.description}>
                        {item.description || <span className="text-rose-600 italic">No description</span>}
                      </td>

                      {/* BARCODE */}
                      <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span className="bg-zinc-50 border border-zinc-200 px-1.5 py-0.5 rounded-sm">
                            {item.barcode || 'NO BARCODE'}
                          </span>
                          {!item.barcode && (
                            <span title="Barcode missing" className="text-rose-500 font-bold">
                              ❌
                            </span>
                          )}
                        </div>
                      </td>

                      {/* COUNT */}
                      <td className="px-3 py-2 font-mono font-bold text-right text-zinc-900 whitespace-nowrap">
                        {item.count}
                      </td>

                      {/* COUNTER */}
                      <td className="px-3 py-2 text-zinc-600 whitespace-nowrap">{item.counter || '---'}</td>

                      {/* SCANNER */}
                      <td className="px-3 py-2 text-zinc-600 whitespace-nowrap">{item.scanner || '---'}</td>

                      {/* VALIDATOR */}
                      <td className="px-3 py-2 text-zinc-600 whitespace-nowrap">{item.validator || '---'}</td>

                      {/* Actions */}
                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItem({ ...item });
                              setIsAddingNew(false);
                            }}
                            title="Edit row"
                            className="p-1 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-sm cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            title="Delete row"
                            className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-sm cursor-pointer"
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

        {/* Footer info bar */}
        <div className="p-3 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500">
          <div>
            Showing <span className="font-bold text-zinc-800">{displayedItems.length}</span> of{' '}
            <span className="font-bold text-zinc-800">{items.length}</span> items (
            <span className="font-bold text-emerald-700">{selectedCount}</span> selected to generate)
          </div>
          <div className="flex items-center gap-3">
            {onGenerateCountSheet && (
              <button
                type="button"
                onClick={onGenerateCountSheet}
                disabled={selectedCount === 0}
                className="inline-flex items-center gap-1.5 font-bold text-emerald-800 hover:text-emerald-900 disabled:text-zinc-400 cursor-pointer text-xs bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Generate Count Sheet</span>
              </button>
            )}
            <button
              type="button"
              onClick={onContinue}
              disabled={selectedCount === 0}
              className="inline-flex items-center gap-1.5 font-bold text-emerald-700 hover:text-emerald-800 disabled:text-zinc-400 cursor-pointer"
            >
              <span>Next: Configure Count Tags →</span>
            </button>
          </div>
        </div>
      </div>

      {/* Edit / Add Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-zinc-200 w-full max-w-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-base font-bold text-zinc-900">
                {isAddingNew ? 'Add Inventory Item' : `Edit Item: ${editingItem.sku || editingItem.locator}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-zinc-400 hover:text-zinc-600 p-1 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">LOCATOR *</label>
                <input
                  type="text"
                  value={editingItem.locator}
                  onChange={(e) => setEditingItem({ ...editingItem, locator: e.target.value })}
                  placeholder="e.g. A01-01"
                  className="w-full px-2.5 py-1.5 border border-zinc-300 rounded-md font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">SKU *</label>
                <input
                  type="text"
                  value={editingItem.sku}
                  onChange={(e) => setEditingItem({ ...editingItem, sku: e.target.value })}
                  placeholder="e.g. SKU001"
                  className="w-full px-2.5 py-1.5 border border-zinc-300 rounded-md font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">UPC NO</label>
                <input
                  type="text"
                  value={editingItem.upcNo}
                  onChange={(e) => setEditingItem({ ...editingItem, upcNo: e.target.value })}
                  placeholder="e.g. 123456789012"
                  className="w-full px-2.5 py-1.5 border border-zinc-300 rounded-md font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">BARCODE *</label>
                <input
                  type="text"
                  value={editingItem.barcode}
                  onChange={(e) => setEditingItem({ ...editingItem, barcode: e.target.value })}
                  placeholder="Barcode digits"
                  className="w-full px-2.5 py-1.5 border border-zinc-300 rounded-md font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="col-span-2">
                <label className="block font-bold text-zinc-700 mb-1">DESCRIPTION *</label>
                <input
                  type="text"
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  placeholder="e.g. Coca-Cola 1.5L Bottle"
                  className="w-full px-2.5 py-1.5 border border-zinc-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">COUNT</label>
                <input
                  type="number"
                  value={editingItem.count}
                  onChange={(e) => setEditingItem({ ...editingItem, count: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-zinc-300 rounded-md font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">COUNTER NAME</label>
                <input
                  type="text"
                  value={editingItem.counter}
                  onChange={(e) => setEditingItem({ ...editingItem, counter: e.target.value })}
                  placeholder="e.g. Juan Santos"
                  className="w-full px-2.5 py-1.5 border border-zinc-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">SCANNER NAME</label>
                <input
                  type="text"
                  value={editingItem.scanner}
                  onChange={(e) => setEditingItem({ ...editingItem, scanner: e.target.value })}
                  placeholder="e.g. Maria Gomez"
                  className="w-full px-2.5 py-1.5 border border-zinc-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">VALIDATOR NAME</label>
                <input
                  type="text"
                  value={editingItem.validator}
                  onChange={(e) => setEditingItem({ ...editingItem, validator: e.target.value })}
                  placeholder="e.g. Pedro Reyes"
                  className="w-full px-2.5 py-1.5 border border-zinc-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">COPIES (TAG QUANTITY)</label>
                <input
                  type="number"
                  min="1"
                  value={editingItem.copies ?? 1}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      copies: Math.max(1, parseInt(e.target.value, 10) || 1),
                    })
                  }
                  className="w-full px-2.5 py-1.5 border border-zinc-300 rounded-md font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-md cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveEdit(editingItem)}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md shadow-xs cursor-pointer"
              >
                Save Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
