import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Download, Sparkles, AlertCircle, AlertTriangle, Building2, Calendar, User, FileText, CheckCircle2 } from 'lucide-react';
import { InventoryItem, InventorySession, ValidationSummary, SystemSettings } from '../types';
import { parseExcelFile, downloadSampleExcelTemplate, SAMPLE_DEMO_ITEMS, revalidateItems } from '../utils/excelParser';
import { DEFAULT_PRINCE_LOGO, PRINCE_LOGO_INLINE_SVG, getEffectiveLogoUrl } from '../utils/theme';

interface Step1ImportProps {
  onDataLoaded: (items: InventoryItem[], summary: ValidationSummary, filename: string) => void;
  session: InventorySession;
  onUpdateSession: (session: InventorySession) => void;
  settings?: SystemSettings;
}

export const Step1Import: React.FC<Step1ImportProps> = ({
  onDataLoaded,
  session,
  onUpdateSession,
  settings,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [largeFileWarning, setLargeFileWarning] = useState<{
    items: InventoryItem[];
    summary: ValidationSummary;
    filename: string;
    rowCount: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setIsLoading(true);
    setErrorMessage(null);

    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      setErrorMessage('Please upload a valid Excel or CSV file (.xlsx, .xls, .csv).');
      setIsLoading(false);
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const result = parseExcelFile(buffer);

      if (result.items.length === 0) {
        setErrorMessage('No inventory items found in the file. Please check that rows exist.');
        setIsLoading(false);
        return;
      }

      // Large dataset warning for >500 rows (Non-blocking notice, source data stays 100% intact)
      if (result.items.length > 500) {
        setLargeFileWarning({
          items: result.items,
          summary: result.summary,
          filename: file.name,
          rowCount: result.items.length,
        });
        setIsLoading(false);
        return;
      }

      onDataLoaded(result.items, result.summary, file.name);
    } catch (err: any) {
      console.error('Error reading Excel file:', err);
      setErrorMessage(err.message || 'Failed to read Excel file. Please ensure it is not corrupted.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleLoadDemo = () => {
    setIsLoading(true);
    setTimeout(() => {
      const summary = revalidateItems(SAMPLE_DEMO_ITEMS);
      onDataLoaded(SAMPLE_DEMO_ITEMS, summary, 'Sample_Inventory_Demo.xlsx');
      setIsLoading(false);
    }, 250);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Home Page — DEC System Identity Banner */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs p-6 sm:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-zinc-100 pb-6 mb-6">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Built-in Prince Retail Logo */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border border-zinc-200 shadow-2xs p-1.5 flex items-center justify-center shrink-0">
              <img
                src={getEffectiveLogoUrl(settings?.customLogoUrl)}
                alt="Prince Retail Logo"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  if (target.src !== PRINCE_LOGO_INLINE_SVG) {
                    target.src = PRINCE_LOGO_INLINE_SVG;
                  }
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                  STEP 1 — IMPORT EXCEL FILE
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-950">
                {settings?.systemName || 'DEC'}
              </h1>
              <p className="text-sm sm:text-base font-bold text-zinc-800 mt-0.5">
                {settings?.systemTagline || 'Digital Efficiency & Continuity System'}
              </p>
              <p className="text-xs sm:text-sm font-medium text-zinc-500 mt-1">
                {settings?.systemSubtitle || 'Backup • Continuity • Alternative Process • Process Improvement'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-col gap-2 shrink-0 w-full md:w-auto">
            <button
              type="button"
              onClick={downloadSampleExcelTemplate}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-zinc-700 bg-zinc-50 hover:bg-zinc-100 border border-zinc-300 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-zinc-600" />
              Download Template (.xlsx)
            </button>
            <button
              type="button"
              onClick={handleLoadDemo}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Load Demo Data (12 Items)
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-800">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold">Import Error</p>
              <p className="mt-0.5 text-red-700">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Drag and drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]'
              : 'border-zinc-300 hover:border-zinc-400 bg-zinc-50/70 hover:bg-zinc-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100/80 text-emerald-700 flex items-center justify-center mb-4 shadow-xs">
            {isLoading ? (
              <div className="w-7 h-7 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <UploadCloud className="w-8 h-8" />
            )}
          </div>

          <h3 className="text-lg font-bold text-zinc-900">
            {isLoading ? 'Processing Excel Data...' : 'Choose Excel File or Drag & Drop Here'}
          </h3>
          <p className="text-sm text-zinc-500 mt-1">
            Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv) spreadsheets
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={isLoading}
              className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Choose Excel File
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Session Configuration Card */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-6">
        <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 pb-3">
          <Building2 className="w-5 h-5 text-emerald-700" />
          <div>
            <h3 className="text-base font-bold text-zinc-900">Inventory Session Details</h3>
            <p className="text-xs text-zinc-500">Optional store and session header metadata printed on the tags</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
              Branch Name
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Metro Manila Hub"
                value={session.branch}
                onChange={(e) => onUpdateSession({ ...session, branch: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-zinc-50/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
              Store / Warehouse ID
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Store #104 - Main"
                value={session.store}
                onChange={(e) => onUpdateSession({ ...session, store: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-zinc-50/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              Inventory Date
            </label>
            <input
              type="date"
              value={session.inventoryDate}
              onChange={(e) => onUpdateSession({ ...session, inventoryDate: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-zinc-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-zinc-500" />
              Prepared By
            </label>
            <input
              type="text"
              placeholder="e.g. Auditor / Lead"
              value={session.preparedBy}
              onChange={(e) => onUpdateSession({ ...session, preparedBy: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-zinc-50/50"
            />
          </div>
        </div>
      </div>

      {/* Recommended Columns Reference Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-6">
        <div className="flex items-center gap-2 mb-3">
          <FileSpreadsheet className="w-5 h-5 text-zinc-600" />
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">
            Recommended Excel File Format (4 Columns — v2.0.4)
          </h3>
        </div>
        <p className="text-xs text-zinc-500 mb-4">
          The simplified PCOUNT W2W template requires only <strong>4 essential columns</strong>. Optional columns from legacy templates are also supported with full backward compatibility:
        </p>

        <div className="overflow-x-auto border border-zinc-200 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-100 text-zinc-700 border-b border-zinc-200 font-bold">
              <tr>
                <th className="px-3 py-2">Column</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Purpose</th>
                <th className="px-3 py-2">Accepted Aliases</th>
                <th className="px-3 py-2">Example Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-zinc-700">
              <tr className="bg-blue-50/40">
                <td className="px-3 py-2 font-mono font-bold text-blue-900">LOCATOR</td>
                <td className="px-3 py-2"><span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-800 rounded">Required</span></td>
                <td className="px-3 py-2 font-medium">Warehouse / Shelf / Bay Locator (renders barcode)</td>
                <td className="px-3 py-2 text-zinc-500">Location, Shelf, Rack, Bin, Loc</td>
                <td className="px-3 py-2 font-mono font-bold text-blue-900">BA-A1-B21L</td>
              </tr>
              <tr className="bg-blue-50/40">
                <td className="px-3 py-2 font-mono font-bold text-blue-900">SKU</td>
                <td className="px-3 py-2"><span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-800 rounded">Required</span></td>
                <td className="px-3 py-2 font-medium">Stock Keeping Unit (Unique item code)</td>
                <td className="px-3 py-2 text-zinc-500">Item Code, Product Code, Part No</td>
                <td className="px-3 py-2 font-mono font-bold text-blue-900">14177</td>
              </tr>
              <tr className="bg-blue-50/40">
                <td className="px-3 py-2 font-mono font-bold text-blue-900">UPC</td>
                <td className="px-3 py-2"><span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-800 rounded">Required</span></td>
                <td className="px-3 py-2 font-medium">UPC / EAN product code (used for item barcode)</td>
                <td className="px-3 py-2 text-zinc-500">UPC NO, EAN, Barcode No, Barcode</td>
                <td className="px-3 py-2 font-mono font-bold text-blue-900">1428503045</td>
              </tr>
              <tr className="bg-blue-50/40">
                <td className="px-3 py-2 font-mono font-bold text-blue-900">DESCRIPTION</td>
                <td className="px-3 py-2"><span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-800 rounded">Required</span></td>
                <td className="px-3 py-2 font-medium">Product name or item description</td>
                <td className="px-3 py-2 text-zinc-500">Desc, Item Name, Title, Product</td>
                <td className="px-3 py-2 font-medium text-zinc-900">UFC BANANA CATSUP 1000G</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono font-medium text-zinc-600">COUNT</td>
                <td className="px-3 py-2"><span className="px-1.5 py-0.5 text-[10px] font-medium bg-zinc-100 text-zinc-600 rounded">Optional</span></td>
                <td className="px-3 py-2">Pre-counted quantity (default blank for physical counting)</td>
                <td className="px-3 py-2 text-zinc-500">Qty, Quantity, Actual Count</td>
                <td className="px-3 py-2 font-mono">25</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono font-medium text-zinc-600">COUNTER / SCANNER / VALIDATOR</td>
                <td className="px-3 py-2"><span className="px-1.5 py-0.5 text-[10px] font-medium bg-zinc-100 text-zinc-600 rounded">Optional</span></td>
                <td className="px-3 py-2">Personnel audit names / signatures</td>
                <td className="px-3 py-2 text-zinc-500">Counted By, Auditor, Checker</td>
                <td className="px-3 py-2 text-zinc-600">Carlos Dizon / Lito Cruz</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Large Dataset Warning Modal (>500 rows) - NON-BLOCKING */}
      {largeFileWarning && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-amber-200 space-y-4 animate-scaleUp">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-zinc-900">
                    Large Dataset Detected
                  </h3>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-mono font-bold text-xs rounded-full">
                    {largeFileWarning.rowCount} Rows
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  File: <strong className="text-zinc-800">{largeFileWarning.filename}</strong>
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2 text-xs text-amber-950">
              <p className="font-semibold">
                Your spreadsheet contains <strong>{largeFileWarning.rowCount} items</strong> (greater than 500 rows).
              </p>
              <ul className="list-disc pl-4 space-y-1 text-zinc-700">
                <li>
                  <strong>Not Blocked:</strong> The system will process and retain all {largeFileWarning.rowCount} items without truncating.
                </li>
                <li>
                  <strong>Raw Data Untouched:</strong> Your original Excel spreadsheet file is read-only and remains 100% unaltered.
                </li>
                <li>
                  <strong>Performance Notice:</strong> Generating high-density barcodes and multi-page preview sheets may take a few moments. We recommend grouping by locator when printing.
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setLargeFileWarning(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg cursor-pointer transition-colors"
              >
                Cancel & Pick Another File
              </button>
              <button
                type="button"
                onClick={() => {
                  onDataLoaded(
                    largeFileWarning.items,
                    largeFileWarning.summary,
                    largeFileWarning.filename
                  );
                  setLargeFileWarning(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Continue with All {largeFileWarning.rowCount} Rows</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
