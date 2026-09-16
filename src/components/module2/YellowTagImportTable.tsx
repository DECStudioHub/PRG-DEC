import React, { useState, useMemo, useRef } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Search,
  CheckSquare,
  Square,
  Pencil,
  Check,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { YellowTagItem } from '../../types';
import {
  downloadYellowTagTemplate,
  parseYellowTagExcel,
} from '../../utils/module2ExcelService';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

interface YellowTagImportTableProps {
  items: YellowTagItem[];
  setItems?: React.Dispatch<React.SetStateAction<YellowTagItem[]>>;
  onUpdateItems?: (items: YellowTagItem[] | ((prev: YellowTagItem[]) => YellowTagItem[])) => void;
  onLoadSampleData?: () => void;
  onClearData?: () => void;
  onSwitchToWhite?: () => void;
}

type SortCol = 'upc' | 'description' | 'qty' | 'price' | 'copies';

export const YellowTagImportTable: React.FC<YellowTagImportTableProps> = ({
  items,
  setItems,
  onUpdateItems,
  onLoadSampleData,
  onClearData,
  onSwitchToWhite: _onSwitchToWhite,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Row Edit Mode State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<YellowTagItem>>({});

  // Table Column Sort State - Defaults to DESCRIPTION A -> Z
  const [sortCol, setSortCol] = useState<SortCol | null>('description');
  const [sortAsc, setSortAsc] = useState(true);

  // In-app Delete Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'single' | 'selected' | 'clear';
    id?: string;
    itemName?: string;
    count?: number;
  }>({
    isOpen: false,
    type: 'single',
  });

  // Unified safe state updater that works regardless of whether parent passed setItems or onUpdateItems
  const updateAllItems = (action: YellowTagItem[] | ((prev: YellowTagItem[]) => YellowTagItem[])) => {
    if (onUpdateItems) {
      onUpdateItems(action);
    } else if (setItems) {
      setItems(action);
    }
  };

  // Safe clear data handler
  const handleClear = () => {
    setDeleteModal({
      isOpen: true,
      type: 'clear',
      count: items.length,
    });
  };

  // Safe sample data handler
  const handleLoadSample = () => {
    if (onLoadSampleData) {
      onLoadSampleData();
    }
    setEditingId(null);
  };

  // Statistics
  const totalItems = items.length;
  const selectedItems = useMemo(
    () => items.filter(i => i.isSelected !== false),
    [items]
  );
  const selectedCount = selectedItems.length;
  const isAllSelected = items.length > 0 && selectedCount === totalItems;

  const totalPhysicalCopies = useMemo(() => {
    return selectedItems.reduce((acc, curr) => acc + Math.max(1, curr.copies || 1), 0);
  }, [selectedItems]);

  const estimatedSheets = useMemo(() => {
    return Math.ceil(totalPhysicalCopies / 15);
  }, [totalPhysicalCopies]);

  const invalidCount = useMemo(() => {
    return items.filter(i => !i.description.trim() || !i.upc.trim() || i.price <= 0).length;
  }, [items]);

  // Handle Excel Upload
  const handleFileUpload = async (file: File) => {
    setErrorMessage(null);
    setIsProcessing(true);
    try {
      const result = await parseYellowTagExcel(file);
      if (!result.success) {
        setErrorMessage(result.error || 'Failed to parse Yellow Tag Excel file.');
        return;
      }
      updateAllItems(result.items);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error processing file.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Row update helper (for inline changes like copies count)
  const updateItem = (id: string, field: keyof YellowTagItem, val: any) => {
    updateAllItems(prev =>
      prev.map(i => {
        if (i.id !== id) return i;
        return { ...i, [field]: val };
      })
    );
  };

  // Edit Mode Handlers
  const startEdit = (item: YellowTagItem) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = (id: string) => {
    const rawPrice = typeof editForm.price === 'number' ? editForm.price : parseFloat(String(editForm.price ?? 0));
    const validPrice = isNaN(rawPrice) || rawPrice < 0 ? 0 : Number(rawPrice.toFixed(2));
    const rawQty = typeof editForm.qty === 'number' ? editForm.qty : parseInt(String(editForm.qty ?? 1), 10);
    const validQty = isNaN(rawQty) || rawQty < 1 ? 1 : rawQty;
    const rawCopies = typeof editForm.copies === 'number' ? editForm.copies : parseInt(String(editForm.copies ?? 1), 10);
    const validCopies = isNaN(rawCopies) || rawCopies < 1 ? 1 : Math.min(99, rawCopies);

    updateAllItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        return {
          ...item,
          upc: String(editForm.upc ?? item.upc).trim(),
          description: String(editForm.description ?? item.description).trim(),
          qty: validQty,
          price: validPrice,
          copies: validCopies,
          buy: editForm.buy || item.buy || 'BUY',
          uom: editForm.uom || item.uom || 'PCS AND UP',
          per: editForm.per || item.per || '/PC',
        };
      })
    );
    setEditingId(null);
    setEditForm({});
  };

  // Delete row with confirmation dialog
  const requestDeleteItem = (id: string, description?: string) => {
    setDeleteModal({
      isOpen: true,
      type: 'single',
      id,
      itemName: description || 'Yellow Tag item',
    });
  };

  // Bulk delete selected with confirmation dialog
  const requestDeleteSelected = () => {
    if (selectedCount === 0) return;
    setDeleteModal({
      isOpen: true,
      type: 'selected',
      count: selectedCount,
    });
  };

  // Handle confirmed deletion
  const handleConfirmDelete = () => {
    if (deleteModal.type === 'single' && deleteModal.id) {
      const targetId = deleteModal.id;
      if (editingId === targetId) setEditingId(null);
      updateAllItems(prev => prev.filter(i => i.id !== targetId));
    } else if (deleteModal.type === 'selected') {
      if (editingId) setEditingId(null);
      updateAllItems(prev => prev.filter(i => (i.isSelected ?? true) === false));
    } else if (deleteModal.type === 'clear') {
      if (editingId) setEditingId(null);
      if (onClearData) {
        onClearData();
      } else {
        updateAllItems([]);
      }
    }
    setDeleteModal({ isOpen: false, type: 'single' });
  };

  const handleCancelDelete = () => {
    setDeleteModal(prev => ({ ...prev, isOpen: false }));
  };

  // Duplicate row
  const duplicateItem = (item: YellowTagItem) => {
    const duplicated: YellowTagItem = {
      ...item,
      id: `yt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      description: `${item.description} (Copy)`,
      isSelected: true,
      copies: item.copies || 1,
    };
    updateAllItems(prev => {
      const idx = prev.findIndex(i => i.id === item.id);
      if (idx >= 0) {
        const next = [...prev];
        next.splice(idx + 1, 0, duplicated);
        return next;
      }
      return [duplicated, ...prev];
    });
  };

  // Add new item
  const addNewItem = () => {
    const newId = `yt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newItem: YellowTagItem = {
      id: newId,
      upc: '000000000000',
      description: 'NEW PROMO PRODUCT DESCRIPTION',
      qty: 3,
      price: 50.0,
      copies: 1,
      buy: 'BUY',
      uom: 'PCS AND UP',
      per: '/PC',
      isSelected: true,
    };
    updateAllItems(prev => [newItem, ...prev]);
    startEdit(newItem);
  };

  // Selection toggles
  const toggleSelectAll = () => {
    const nextState = !isAllSelected;
    updateAllItems(prev => prev.map(i => ({ ...i, isSelected: nextState })));
  };

  const toggleItemSelect = (id: string) => {
    updateAllItems(prev =>
      prev.map(i => (i.id === id ? { ...i, isSelected: !(i.isSelected ?? true) } : i))
    );
  };

  // Header column sort click
  const handleSortClick = (col: SortCol) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(true);
    }
  };

  // Filtered rows with search
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(
      i =>
        i.description.toLowerCase().includes(term) ||
        i.upc.toLowerCase().includes(term) ||
        String(i.qty).includes(term)
    );
  }, [items, searchTerm]);

  // Display items sorted by active column
  const displayedItems = useMemo(() => {
    if (!sortCol) return filteredItems;
    return [...filteredItems].sort((a, b) => {
      const valA: any = a[sortCol];
      const valB: any = b[sortCol];
      if (typeof valA === 'string') {
        return sortAsc
          ? valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' })
          : valB.localeCompare(valA, undefined, { numeric: true, sensitivity: 'base' });
      }
      return sortAsc ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
    });
  }, [filteredItems, sortCol, sortAsc]);

  return (
    <div className="space-y-4">
      {/* 1. Header Actions Banner */}
      <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 md:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400 ring-4 ring-amber-200" />
              <h2 className="text-base font-extrabold text-amber-950">
                Yellow Tag Data & Excel Import
              </h2>
            </div>
            <p className="text-xs text-amber-800 mt-1 max-w-2xl">
              Upload your Yellow Tag Excel file containing <span className="font-bold">UPC, DESCRIPTION, QTY, PRICE, COPIES</span>. Preserves leading zeros on barcodes and defaults BUY = "BUY", UOM = "PCS AND UP", and PER = "/PC".
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={downloadYellowTagTemplate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-amber-900 border border-amber-300 hover:bg-amber-100/60 shadow-2xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-700" />
              <span>Download Yellow Template</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-zinc-950 shadow-xs transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Import Yellow Tag Excel</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              className="hidden"
              onChange={e => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
          </div>
        </div>

        {/* Drag & Drop Upload Zone */}
        <div
          onDragOver={e => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-4 border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-amber-600 bg-amber-100/80 scale-[0.99]'
              : 'border-amber-300/80 hover:border-amber-400 bg-white/70'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-1 text-xs text-amber-900">
            <FileSpreadsheet className="w-6 h-6 text-amber-600 mb-1" />
            <span className="font-bold">
              {isProcessing ? 'Processing Excel file...' : 'Drop DEC-Yellow-Tag-Import-Template.xlsx here, or click to browse'}
            </span>
            <span className="text-[11px] text-amber-700">
              Preserves leading zeroes on UPCs • Format: UPC, DESCRIPTION, QTY, PRICE, COPIES
            </span>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Import Error: </span>
              {errorMessage}
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-500 hover:text-red-800 font-bold ml-2 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* 2. Controls & Summary Bar */}
      <div className="bg-white border border-zinc-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search description, UPC, or qty..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button
            type="button"
            onClick={addNewItem}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-bold text-xs shadow-2xs cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
          {selectedCount > 0 && (
            <button
              type="button"
              onClick={requestDeleteSelected}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-bold text-xs shadow-2xs cursor-pointer shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span>Delete Selected ({selectedCount})</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-wrap items-center gap-3 text-zinc-600 text-xs">
            <span>
              Unique Items: <strong className="text-zinc-900">{totalItems}</strong>
            </span>
            <span>•</span>
            <span>
              Selected: <strong className="text-amber-700">{selectedCount}</strong>
            </span>
            <span>•</span>
            <span>
              Physical Tags:{' '}
              <strong className="text-zinc-900 font-mono bg-zinc-100 px-1.5 py-0.5 rounded">
                {totalPhysicalCopies}
              </strong>
            </span>
            <span>•</span>
            <span>
              Estimated Sheets:{' '}
              <strong className="text-emerald-700 font-mono bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                {estimatedSheets} sheet(s)
              </strong>
            </span>
            {invalidCount > 0 && (
              <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                <AlertTriangle className="w-3 h-3" />
                {invalidCount} warning(s)
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 border-l border-zinc-200 pl-3">
            <button
              type="button"
              onClick={handleLoadSample}
              title="Load Sample Yellow Tags"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-zinc-700 hover:bg-zinc-100 rounded-lg font-medium cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Sample Data</span>
            </button>
            <button
              type="button"
              onClick={handleClear}
              title="Clear All Rows"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-red-600 hover:bg-red-50 rounded-lg font-medium cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Data Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-700 font-bold select-none">
                <th className="py-2.5 px-3 w-10 text-center">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="cursor-pointer text-zinc-500 hover:text-zinc-900"
                    title={isAllSelected ? 'Deselect All' : 'Select All'}
                  >
                    {isAllSelected ? (
                      <CheckSquare className="w-4 h-4 text-amber-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th
                  onClick={() => handleSortClick('upc')}
                  className="py-2.5 px-3 w-36 font-mono cursor-pointer hover:bg-zinc-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>UPC</span>
                    {sortCol === 'upc' ? (
                      sortAsc ? <ArrowUp className="w-3 h-3 text-amber-600" /> : <ArrowDown className="w-3 h-3 text-amber-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSortClick('description')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-zinc-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>DESCRIPTION</span>
                    {sortCol === 'description' ? (
                      sortAsc ? <ArrowUp className="w-3 h-3 text-amber-600" /> : <ArrowDown className="w-3 h-3 text-amber-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSortClick('qty')}
                  className="py-2.5 px-3 w-20 text-center cursor-pointer hover:bg-zinc-100 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>BUY</span>
                    {sortCol === 'qty' ? (
                      sortAsc ? <ArrowUp className="w-3 h-3 text-amber-600" /> : <ArrowDown className="w-3 h-3 text-amber-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSortClick('price')}
                  className="py-2.5 px-3 w-28 text-right cursor-pointer hover:bg-zinc-100 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>PRICE (₱)</span>
                    {sortCol === 'price' ? (
                      sortAsc ? <ArrowUp className="w-3 h-3 text-amber-600" /> : <ArrowDown className="w-3 h-3 text-amber-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSortClick('copies')}
                  className="py-2.5 px-3 w-28 text-center cursor-pointer hover:bg-zinc-100 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>COPIES</span>
                    {sortCol === 'copies' ? (
                      sortAsc ? <ArrowUp className="w-3 h-3 text-amber-600" /> : <ArrowDown className="w-3 h-3 text-amber-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                    )}
                  </div>
                </th>
                <th className="py-2.5 px-3 w-24 text-center">STATUS</th>
                <th className="py-2.5 px-3 w-28 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {displayedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-400">
                    No Yellow Tag items found. Import an Excel template or click "Sample Data" above.
                  </td>
                </tr>
              ) : (
                displayedItems.map(item => {
                  const isEditing = editingId === item.id;
                  const isRowValid =
                    item.description.trim().length > 0 &&
                    item.upc.trim().length > 0 &&
                    item.price > 0 &&
                    item.qty > 0;

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isEditing
                          ? 'bg-amber-50/70 ring-1 ring-amber-400'
                          : item.isSelected === false
                          ? 'opacity-50 bg-zinc-50/50'
                          : 'hover:bg-amber-50/30'
                      }`}
                    >
                      {/* Select Checkbox */}
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleItemSelect(item.id)}
                          className="cursor-pointer text-zinc-500 hover:text-zinc-900"
                        >
                          {item.isSelected !== false ? (
                            <CheckSquare className="w-4 h-4 text-amber-600" />
                          ) : (
                            <Square className="w-4 h-4 text-zinc-400" />
                          )}
                        </button>
                      </td>

                      {/* UPC */}
                      <td className="py-2 px-3 font-mono">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.upc ?? ''}
                            onChange={e => setEditForm(prev => ({ ...prev, upc: e.target.value }))}
                            className="w-full font-mono text-zinc-900 px-2 py-1 bg-white border border-amber-400 rounded focus:ring-1 focus:ring-amber-500 focus:outline-none"
                            placeholder="UPC / Barcode"
                          />
                        ) : (
                          <span className="font-mono text-zinc-800 font-medium">
                            {item.upc || '—'}
                          </span>
                        )}
                      </td>

                      {/* DESCRIPTION */}
                      <td className="py-2 px-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.description ?? ''}
                            onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full text-zinc-900 font-semibold px-2 py-1 bg-white border border-amber-400 rounded focus:ring-1 focus:ring-amber-500 focus:outline-none"
                            placeholder="Product description"
                          />
                        ) : (
                          <span className="text-zinc-900 font-semibold">
                            {item.description || '—'}
                          </span>
                        )}
                      </td>

                      {/* QTY */}
                      <td className="py-2 px-3 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            min={1}
                            max={999}
                            value={editForm.qty ?? 1}
                            onChange={e =>
                              setEditForm(prev => ({
                                ...prev,
                                qty: Math.max(1, parseInt(e.target.value || '1', 10)),
                              }))
                            }
                            className="w-16 text-center font-bold text-zinc-900 px-1 py-1 bg-white border border-amber-400 rounded focus:outline-none"
                          />
                        ) : (
                          <span className="font-bold text-zinc-800">
                            {item.qty}
                          </span>
                        )}
                      </td>

                      {/* PRICE */}
                      <td className="py-2 px-3 text-right">
                        {isEditing ? (
                          <div className="relative inline-flex items-center w-28">
                            <span className="absolute left-2 text-zinc-500 font-bold font-mono text-xs pointer-events-none select-none">
                              ₱
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editForm.price ?? 0}
                              onChange={e =>
                                setEditForm(prev => ({
                                  ...prev,
                                  price: Math.max(0, parseFloat(e.target.value || '0')),
                                }))
                              }
                              className="w-full text-right font-mono font-bold text-zinc-900 pl-5 pr-2 py-1 bg-white border border-amber-400 rounded focus:outline-none"
                            />
                          </div>
                        ) : (
                          <span className="font-mono font-black text-zinc-900">
                            ₱{Number(item.price || 0).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        )}
                      </td>

                      {/* COPIES */}
                      <td className="py-2 px-3 text-center">
                        <div className="inline-flex items-center border border-zinc-200 rounded-lg overflow-hidden bg-white">
                          <button
                            type="button"
                            onClick={() => {
                              const nextCopies = Math.max(1, (item.copies || 1) - 1);
                              updateItem(item.id, 'copies', nextCopies);
                              if (isEditing) {
                                setEditForm(prev => ({ ...prev, copies: nextCopies }));
                              }
                            }}
                            className="px-2 py-0.5 text-zinc-500 hover:bg-zinc-100 font-bold cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={99}
                            value={isEditing ? (editForm.copies ?? item.copies ?? 1) : (item.copies || 1)}
                            onChange={e => {
                              const val = Math.max(1, Math.min(99, parseInt(e.target.value || '1', 10)));
                              updateItem(item.id, 'copies', val);
                              if (isEditing) {
                                setEditForm(prev => ({ ...prev, copies: val }));
                              }
                            }}
                            className="w-10 text-center font-mono font-bold text-zinc-900 text-xs py-0.5 border-x border-zinc-200 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const nextCopies = Math.min(99, (item.copies || 1) + 1);
                              updateItem(item.id, 'copies', nextCopies);
                              if (isEditing) {
                                setEditForm(prev => ({ ...prev, copies: nextCopies }));
                              }
                            }}
                            className="px-2 py-0.5 text-zinc-500 hover:bg-zinc-100 font-bold cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* STATUS */}
                      <td className="py-2 px-3 text-center">
                        {isRowValid ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Valid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <AlertTriangle className="w-3 h-3" />
                            Check
                          </span>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="py-2 px-3 text-center">
                        {isEditing ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => saveEdit(item.id)}
                              title="Save Changes"
                              className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold shadow-2xs cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Save</span>
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              title="Cancel"
                              className="p-1 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/60 rounded cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              title="Edit Row"
                              className="p-1 text-zinc-400 hover:text-amber-700 hover:bg-amber-100/60 rounded cursor-pointer transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => duplicateItem(item)}
                              title="Duplicate Row"
                              className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded cursor-pointer transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => requestDeleteItem(item.id, item.description)}
                              title="Delete Row"
                              className="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reliable In-App Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        title={
          deleteModal.type === 'single'
            ? 'Delete this Yellow Tag item?'
            : deleteModal.type === 'selected'
            ? `Delete ${deleteModal.count} selected Yellow Tag item(s)?`
            : 'Clear all Yellow Tag items?'
        }
        itemName={deleteModal.type === 'single' ? deleteModal.itemName : undefined}
        message={
          deleteModal.type === 'single'
            ? 'Are you sure you want to delete this Yellow Tag? This item will be removed immediately from the table, Live Preview, and Print/PDF output.'
            : deleteModal.type === 'selected'
            ? 'Are you sure you want to delete the selected items? They will be removed immediately from the table, Live Preview, and Print/PDF output.'
            : 'Are you sure you want to clear all tags from the table? This will remove all items.'
        }
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};
