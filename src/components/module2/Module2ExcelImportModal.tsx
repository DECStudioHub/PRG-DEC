import React, { useRef, useState } from 'react';
import { X, UploadCloud, FileSpreadsheet, AlertCircle, Download, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { ShelfTagItem } from '../../types';
import { downloadLayout2Template, parseLayout2Excel } from '../../utils/layout2Excel';

interface Module2ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (items: ShelfTagItem[]) => void;
  layoutOption?: 1 | 2;
}

export const Module2ExcelImportModal: React.FC<Module2ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  layoutOption = 1,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  if (!isOpen) return null;

  const isLayout2 = layoutOption === 2;

  const processWorkbookLayout1 = (wb: XLSX.WorkBook) => {
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    // raw: false ensures strings and formatted numbers with leading zeroes are kept
    const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });

    if (rawRows.length === 0) {
      setErrorMsg('The uploaded sheet is empty.');
      return;
    }

    // Map rows to ShelfTagItem
    const parsedItems: ShelfTagItem[] = rawRows.map((row, idx) => {
      // Detect SKU
      const sku = String(row.SKU || row['SKU / CODE'] || row.Code || row.ItemCode || row.Item || `SKU-${idx + 1}`).trim();
      // Detect Description
      const desc = String(
        row.Description || row.DESCRIPTION || row.Desc || row['Item Description'] || row.Name || 'UNTITLED ITEM'
      ).trim().toUpperCase();
      // Detect Barcode / UPC (preserve string)
      const barcode = String(row.Barcode || row.BARCODE || row.UPC || row['UPC No'] || row.upcNo || sku).trim();
      // Detect Regular Price
      const regPrice = parseFloat(String(row['Regular Price'] || row.RegularPrice || row.Price || row.PRICE || row.SRP || '0').replace(/[₱$,\s]/g, '')) || 0;
      // Detect Promo Price
      const promoPriceRaw = row['Promo Price'] || row.PromoPrice || row.Promo || row.SalePrice || '';
      const promoPrice = promoPriceRaw ? parseFloat(String(promoPriceRaw).replace(/[₱$,\s]/g, '')) || null : null;
      // Detect Tag Style
      const styleRaw = String(row['Tag Style'] || row.Style || row.Type || '').toLowerCase();
      const tagStyle = (styleRaw.includes('yellow') || styleRaw.includes('promo') || (promoPrice != null && promoPrice > 0)) ? 'yellow' : 'white';
      // Detect Unit
      const unit = String(row.Unit || row.UNIT || row.UOM || 'per PC').trim();
      // Detect Locator
      const locator = String(row.Locator || row.LOCATOR || row.Location || row.Aisle || 'A01-01').trim();
      // Detect Category
      const category = String(row.Category || row.Dept || row.Department || 'Grocery').trim();

      return {
        id: `imp-${Date.now()}-${idx}`,
        tagStyle,
        description: desc,
        promoHeader: tagStyle === 'yellow' ? (promoPrice ? `SAVE ₱${Math.max(0, regPrice - promoPrice).toFixed(2)}` : 'PROMO TAG') : undefined,
        promoSubtext: tagStyle === 'yellow' ? 'SPECIAL PROMO PERIOD' : undefined,
        promoValidity: tagStyle === 'yellow' ? 'Special Promo Period' : undefined,
        sku,
        barcode,
        regularPrice: regPrice,
        promoPrice,
        unit,
        locator,
        category,
        isSelected: true,
        copies: 1,
      };
    });

    onImport(parsedItems);
    onClose();
  };

  const handleFile = (file: File) => {
    setErrorMsg(null);
    setSuccessInfo(null);
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const buffer = e.target?.result as ArrayBuffer;

        if (isLayout2) {
          // Layout Option 2 strict template validation & mapping
          const result = parseLayout2Excel(buffer);
          if (!result.success) {
            setErrorMsg(result.error || 'Failed to parse Layout Option 2 file.');
            return;
          }

          if (result.items.length === 0) {
            setErrorMsg('No valid items found in the Layout Option 2 template. Ensure rows are populated below the header.');
            return;
          }

          onImport(result.items);
          onClose();
        } else {
          // Layout Option 1 existing parsing logic
          const data = new Uint8Array(buffer);
          const wb = XLSX.read(data, { type: 'array' });
          processWorkbookLayout1(wb);
        }
      } catch (err: any) {
        setErrorMsg('Error reading file: ' + (err?.message || 'Unknown format'));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className={`w-5 h-5 ${isLayout2 ? 'text-amber-600' : 'text-emerald-600'}`} />
            <div>
              <h3 className="text-sm font-black text-zinc-900">
                {isLayout2 ? 'Import Layout Option 2 Spreadsheet' : 'Import Excel Spreadsheet'}
              </h3>
              <p className="text-[11px] text-zinc-500 font-medium">
                {isLayout2 ? 'Upload completed DEC-Layout-Option-2-Import-Template.xlsx' : 'Import tags from Excel or CSV'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLayout2 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3">
            <div className="text-xs text-amber-950 leading-tight">
              <strong className="block font-bold">Need the official Layout 2 format?</strong>
              <span className="text-[11px] text-amber-800">
                Download the verified Excel template with exact headers.
              </span>
            </div>
            <button
              type="button"
              onClick={() => downloadLayout2Template()}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-zinc-950 font-black rounded-lg text-xs flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Template</span>
            </button>
          </div>
        )}

        <div className="mt-4">
          <div
            onDragOver={e => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={e => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFile(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              dragActive
                ? 'border-amber-500 bg-amber-50/50'
                : 'border-zinc-300 hover:border-zinc-400 bg-zinc-50'
            }`}
          >
            <UploadCloud className="w-8 h-8 mx-auto text-zinc-400 mb-2" />
            <span className="text-xs font-bold text-zinc-800 block">
              Drag and drop your .xlsx or .xls file here
            </span>
            <span className="text-[11px] text-zinc-500 block mt-1">or click to browse files</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              className="hidden"
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
            />
          </div>

          {errorMsg && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 whitespace-pre-line leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1 font-mono text-[11.5px]">{errorMsg}</div>
            </div>
          )}

          {isLayout2 ? (
            <div className="mt-4 text-[11px] text-zinc-600 space-y-1 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
              <span className="font-bold text-zinc-800 block">Layout Option 2 Required Columns:</span>
              <p className="font-mono text-[10.5px] text-zinc-700 leading-normal">
                DESCRIPTION, BARCODE, PRICE, UNIT, SKU, DATE, BUY_PER, UP, COPY_QTY
              </p>
              <p className="text-zinc-500 text-[10.5px] pt-1">
                • Barcodes are read as strings to preserve leading zeros.
                <br />
                • COPY_QTY defaults to 1 if blank or invalid.
              </p>
            </div>
          ) : (
            <p className="mt-3 text-[11px] text-zinc-500 leading-relaxed">
              Supported columns include: <strong>Description</strong>, <strong>SKU</strong>,{' '}
              <strong>Barcode / UPC</strong>, <strong>Regular Price</strong>, <strong>Promo Price</strong>,{' '}
              <strong>Tag Style</strong> (White/Yellow), <strong>Locator</strong>, and <strong>Unit</strong>.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
