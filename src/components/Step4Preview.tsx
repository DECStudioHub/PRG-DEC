import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Printer,
  FileDown,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  Maximize,
  FileSpreadsheet,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  X,
  Eye,
  Layers,
  Sparkles,
  Info,
  Filter,
  CheckSquare,
  Square,
  RotateCcw,
  Check,
} from 'lucide-react';
import { InventoryItem, LayoutConfig, InventorySession, SystemSettings } from '../types';
import { ShelfTag } from './ShelfTag';
import {
  generateShelfTagsPdf,
  GeneratePdfProgress,
  triggerFileDownload,
} from '../utils/pdfGenerator';
import { exportInventoryToExcel } from '../utils/excelParser';
import { packCountTagPages } from '../utils/countTagLayoutEngine';

interface Step4PreviewProps {
  items: InventoryItem[];
  config: LayoutConfig;
  session: InventorySession;
  settings?: SystemSettings;
  onBackToConfig: () => void;
}

interface GeneratedPdfMeta {
  url: string;
  filename: string;
  totalPages: number;
  totalTags: number;
  doc: any;
}

export const Step4Preview: React.FC<Step4PreviewProps> = ({
  items,
  config,
  session,
  settings,
  onBackToConfig,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomScale, setZoomScale] = useState(0.85);
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<GeneratePdfProgress | null>(null);

  // Modals state
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [generatedPdf, setGeneratedPdf] = useState<GeneratedPdfMeta | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [printStatusNotice, setPrintStatusNotice] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [showPrintDropdown, setShowPrintDropdown] = useState<boolean>(false);
  const [printNotification, setPrintNotification] = useState<{
    type: 'success' | 'warning' | 'info';
    message: string;
    actionUrl?: string;
    actionLabel?: string;
  } | null>(null);

  const printContainerRef = useRef<HTMLDivElement>(null);

  // Group and count physical tags per locator from items (accounting for COPIES)
  const locatorCounts = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach(it => {
      if (it.isSelected === false) return;
      const loc = (it.locator && String(it.locator).trim()) || 'UNASSIGNED';
      const copiesCount = (it.copies && Number(it.copies) >= 1) ? Math.floor(Number(it.copies)) : 1;
      map.set(loc, (map.get(loc) || 0) + copiesCount);
    });
    const result: { locator: string; count: number }[] = [];
    map.forEach((count, locator) => {
      result.push({ locator, count });
    });
    return result.sort((a, b) =>
      a.locator.localeCompare(b.locator, undefined, { numeric: true, sensitivity: 'base' })
    );
  }, [items]);

  const allLocators = useMemo(() => {
    return locatorCounts.map(lc => lc.locator);
  }, [locatorCounts]);

  const datasetFingerprint = useMemo(() => {
    if (!items || items.length === 0) return 'empty';
    const first = items[0];
    const last = items[items.length - 1];
    const firstKey = first ? `${first.sku || first.id || ''}_${first.locator || ''}` : '';
    const lastKey = last ? `${last.sku || last.id || ''}_${last.locator || ''}` : '';
    return `ct_ds_${items.length}_${firstKey}_${lastKey}`;
  }, [items]);

  // Selected Locators Filter state (default: all locators active)
  const [selectedLocators, setSelectedLocators] = useState<Set<string>>(() => {
    return new Set(locatorCounts.map(lc => lc.locator));
  });

  const prevFingerprintRef = useRef<string>(datasetFingerprint);
  useEffect(() => {
    if (prevFingerprintRef.current !== datasetFingerprint) {
      prevFingerprintRef.current = datasetFingerprint;
      setSelectedLocators(new Set(allLocators));
      setCurrentPage(1);
    }
  }, [datasetFingerprint, allLocators]);

  // Printed Locators Tracker (persists per dataset, preserves reprint capability)
  const [printedLocators, setPrintedLocators] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(`count_tag_printed_${datasetFingerprint}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    } catch {}
    return new Set<string>();
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`count_tag_printed_${datasetFingerprint}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setPrintedLocators(new Set(parsed));
          return;
        }
      }
    } catch {}
    setPrintedLocators(new Set<string>());
  }, [datasetFingerprint]);

  const markLocatorsAsPrinted = (locs: string[]) => {
    if (locs.length === 0) return;
    setPrintedLocators(prev => {
      const updated = new Set(prev);
      locs.forEach(l => updated.add(l));
      try {
        localStorage.setItem(
          `count_tag_printed_${datasetFingerprint}`,
          JSON.stringify(Array.from(updated))
        );
      } catch {}
      return updated;
    });
  };

  const handleResetPrintStatus = () => {
    setPrintedLocators(new Set());
    try {
      localStorage.removeItem(`count_tag_printed_${datasetFingerprint}`);
    } catch {}
  };

  const [locatorSearch, setLocatorSearch] = useState<string>('');
  const filteredLocatorCounts = useMemo(() => {
    if (!locatorSearch.trim()) return locatorCounts;
    const q = locatorSearch.trim().toLowerCase();
    return locatorCounts.filter(lc => lc.locator.toLowerCase().includes(q));
  }, [locatorCounts, locatorSearch]);

  const handleToggleLocator = (loc: string) => {
    setSelectedLocators(prev => {
      const updated = new Set(prev);
      if (updated.has(loc)) {
        updated.delete(loc);
      } else {
        updated.add(loc);
      }
      return updated;
    });
    setCurrentPage(1);
  };

  const handleSelectAllLocators = () => {
    setSelectedLocators(new Set(allLocators));
    setCurrentPage(1);
  };

  const handleClearAllLocators = () => {
    setSelectedLocators(new Set());
    setCurrentPage(1);
  };

  const handleInvertLocators = () => {
    setSelectedLocators(prev => {
      const updated = new Set<string>();
      allLocators.forEach(l => {
        if (!prev.has(l)) updated.add(l);
      });
      return updated;
    });
    setCurrentPage(1);
  };

  const activeLocatorsArray = useMemo(() => {
    return allLocators.filter(l => selectedLocators.has(l));
  }, [allLocators, selectedLocators]);

  // Selected items filtered by active locators (without modifying source items)
  const selectedItems = useMemo(() => {
    return items.filter(it => {
      if (it.isSelected === false) return false;
      const loc = (it.locator && String(it.locator).trim()) || 'UNASSIGNED';
      return selectedLocators.has(loc);
    });
  }, [items, selectedLocators]);

  // Listen for successful print events from standalone print windows
  useEffect(() => {
    const handleMsg = (e: MessageEvent) => {
      if (e.data?.type === 'COUNT_TAGS_PRINTED_SUCCESS' && activeLocatorsArray.length > 0) {
        markLocatorsAsPrinted(activeLocatorsArray);
      }
    };
    window.addEventListener('message', handleMsg);
    return () => window.removeEventListener('message', handleMsg);
  }, [activeLocatorsArray]);

  // Paper dimensions in mm
  const paperDimensions = useMemo(() => {
    let width = 210;
    let height = 297;
    if (config.paperSize === 'LETTER') {
      width = 215.9;
      height = 279.4;
    } else if (config.paperSize === 'CUSTOM') {
      width = Math.max(50, Number(config.customWidthMm) || 210);
      height = Math.max(50, Number(config.customHeightMm) || 297);
    }

    if (config.orientation === 'landscape') {
      return { width: height, height: width };
    }
    return { width, height };
  }, [config.paperSize, config.customWidthMm, config.customHeightMm, config.orientation]);

  // Tags per page calculation and intelligent Count Tag packing
  const { tagsPerPage, cols, rows } = useMemo(() => {
    const availHeight = paperDimensions.height - config.marginTopMm - config.marginBottomMm;
    const cols = Math.max(1, config.columns);
    const tagH = config.tagHeightMm;
    const gapY = config.gapRowMm;

    const rows = Math.max(1, Math.floor((availHeight + gapY) / (tagH + gapY)));
    const tagsPerPage = Math.max(1, cols * rows);

    return { tagsPerPage, cols, rows };
  }, [paperDimensions, config]);

  const packedPages = useMemo(() => {
    return packCountTagPages(selectedItems, tagsPerPage);
  }, [selectedItems, tagsPerPage]);

  const totalPages = Math.max(1, packedPages.length);
  const totalPhysicalTags = useMemo(() => {
    return packedPages.reduce((sum, p) => sum + p.totalTags, 0);
  }, [packedPages]);

  // Active page data and items
  const currentPageData = useMemo(() => {
    return packedPages[currentPage - 1] || null;
  }, [packedPages, currentPage]);

  const currentPageItems = useMemo(() => {
    return currentPageData ? currentPageData.items : [];
  }, [currentPageData]);

  // Handle PDF Generation
  const handleGenerateAndDownloadPdf = async () => {
    setErrorMessage(null);
    if (selectedItems.length === 0) {
      setErrorMessage('No items are currently selected. Please select items in Step 2.');
      return;
    }

    try {
      setIsGeneratingPdf(true);
      setPdfProgress({ currentPage: 1, totalPages, percent: 5 });

      await new Promise(r => setTimeout(r, 80));

      const doc = await generateShelfTagsPdf(selectedItems, config, session, progress => {
        setPdfProgress(progress);
      });

      const dateStr = session.inventoryDate || new Date().toISOString().slice(0, 10);
      const safeBranch = (session.branch || 'Store').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Inventory_Tags_${safeBranch}_${dateStr}.pdf`;

      const blob = doc.output('blob');
      const blobUrl = URL.createObjectURL(blob);

      // Attempt automatic background trigger
      triggerFileDownload(blobUrl, filename);

      // Always show the PDF ready dialog with instant manual fallback & preview
      setGeneratedPdf({
        url: blobUrl,
        filename: filename,
        totalPages: totalPages,
        totalTags: totalPhysicalTags,
        doc: doc,
      });
      setShowPdfModal(true);
      // Mark active locators as printed upon successful PDF generation
      markLocatorsAsPrinted(activeLocatorsArray);
    } catch (err: any) {
      console.error('PDF Generation error:', err);
      setErrorMessage(
        err?.message || 'Failed to generate PDF. Please verify item quantities and tag dimensions.'
      );
    } finally {
      setIsGeneratingPdf(false);
      setPdfProgress(null);
    }
  };

  // 1. Direct High-Fidelity Print Action (Primary Flow)
  const handlePrintTags = async () => {
    if (selectedItems.length === 0) {
      setErrorMessage('No items are currently selected to print. Please select items in Step 2.');
      return;
    }

    setErrorMessage(null);
    setPrintNotification(null);
    setIsPrinting(true);

    // 1. First, synchronously open a new window so popup blockers in browsers allow it
    let printWin: Window | null = null;
    try {
      printWin = window.open('', '_blank');
    } catch (e) {
      console.warn('Direct window.open failed:', e);
    }

    const printHtml = printContainerRef.current?.innerHTML;

    if (printWin && printHtml) {
      try {
        const baseHref = document.baseURI || window.location.href.split('#')[0].split('?')[0].replace(/\/[^\/]*$/, '/');
        const currentStyles = Array.from(
          document.querySelectorAll('style, link[rel="stylesheet"]')
        )
          .map(el => {
            if (el.tagName.toLowerCase() === 'link') {
              const link = el as HTMLLinkElement;
              return `<link rel="stylesheet" href="${link.href}">`;
            }
            return el.outerHTML;
          })
          .join('\n');

        const title = `Print Shelf Tags - ${config.paperSize} (${selectedItems.length} tags)`;

        printWin.document.open();
        printWin.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <base href="${baseHref}">
  <title>${title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${currentStyles}
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    @page {
      size: ${paperDimensions.width}mm ${paperDimensions.height}mm;
      margin: 0;
    }
    html, body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    @media print {
      html, body {
        background: #ffffff !important;
        background-color: #ffffff !important;
      }
      .no-print {
        display: none !important;
      }
      .page-break {
        box-shadow: none !important;
        margin: 0 !important;
        page-break-after: always !important;
        break-after: page !important;
      }
    }
    .no-print-bar {
      position: sticky;
      top: 0;
      z-index: 99999;
      background: #09090b;
      color: #fafafa;
      padding: 10px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 16px rgba(0,0,0,0.25);
      border-bottom: 1px solid #27272a;
    }
    .print-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 8px;
      gap: 24px;
    }
    @media print {
      .print-wrapper {
        padding: 0 !important;
        gap: 0 !important;
        display: block !important;
      }
    }
    .page-break {
      display: block !important;
      background: #ffffff;
      box-shadow: 0 4px 18px rgba(0,0,0,0.12);
      margin: 0 auto;
      box-sizing: border-box;
    }
  </style>
</head>
<body>
  <div class="no-print no-print-bar">
    <div style="display: flex; align-items: center; gap: 14px;">
      <div style="background: #047857; color: white; border-radius: 6px; padding: 4px 8px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">
        PRINT READY
      </div>
      <div>
        <span style="font-weight: 800; font-size: 14px;">SHELF TAG PRINTING</span>
        <span style="font-size: 12px; color: #a1a1aa; margin-left: 8px; font-family: monospace;">
          ${selectedItems.length} tags · ${totalPages} sheet${totalPages > 1 ? 's' : ''} · ${config.paperSize} (${paperDimensions.width}×${paperDimensions.height}mm)
        </span>
      </div>
    </div>
    <div style="display: flex; align-items: center; gap: 8px;">
      <button onclick="window.print()" style="background: #047857; color: white; font-weight: bold; font-size: 12px; padding: 8px 18px; border-radius: 8px; border: none; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(4,120,87,0.4);">
        🖨️ Print Now (Ctrl+P)
      </button>
      <button onclick="window.close()" style="background: #27272a; color: #e4e4e7; font-size: 12px; padding: 8px 14px; border-radius: 8px; border: 1px solid #3f3f46; cursor: pointer;">
        ✕ Close
      </button>
    </div>
  </div>

  <div class="print-wrapper">
    ${printHtml}
  </div>

  <script>
    function triggerPrint() {
      window.focus();
      try {
        window.print();
      } catch (err) {
        console.warn('Auto print call:', err);
      }
    }
    window.onafterprint = function() {
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage({ type: 'COUNT_TAGS_PRINTED_SUCCESS' }, '*');
        }
      } catch (e) {}
    };
    if (document.readyState === 'complete') {
      setTimeout(triggerPrint, 400);
    } else {
      window.addEventListener('load', function() {
        setTimeout(triggerPrint, 400);
      });
    }
  </script>
</body>
</html>`);
        printWin.document.close();
        setIsPrinting(false);
        markLocatorsAsPrinted(activeLocatorsArray);

        setPrintNotification({
          type: 'success',
          message: 'Print window opened and printer dialog initiated! If needed, you can click "Print Now" in the opened tab.',
        });
        return;
      } catch (err) {
        console.warn('Writing to print window failed:', err);
        if (printWin) {
          try {
            printWin.close();
          } catch {}
        }
      }
    }

    // 2. High-reliability fallback if window.open was blocked:
    // Generate the exact vector PDF with doc.autoPrint()!
    try {
      const doc = await generateShelfTagsPdf(selectedItems, config, session);
      (doc as any).autoPrint?.({ variant: 'non-conform' });
      const blob = doc.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      const dateStr = session.inventoryDate || new Date().toISOString().slice(0, 10);
      const filename = `Shelf_Tags_Print_${config.paperSize}_${dateStr}.pdf`;

      triggerFileDownload(blobUrl, filename);

      setPrintNotification({
        type: 'info',
        message: 'Direct popup was restricted by your browser. A high-resolution printable PDF was automatically generated for you.',
        actionUrl: blobUrl,
        actionLabel: 'Open & Print PDF',
      });
    } catch (fallbackErr: any) {
      console.error('Fallback print generation error:', fallbackErr);
      setErrorMessage(
        'Could not initialize print dialog: ' +
          (fallbackErr?.message || 'Please use "Download PDF" instead.')
      );
    } finally {
      setIsPrinting(false);
    }
  };

  // 2. Print via Vector PDF with Auto-Print
  const handlePrintViaPdf = async () => {
    if (selectedItems.length === 0) {
      setErrorMessage('No items selected to print.');
      return;
    }
    setErrorMessage(null);
    setPrintNotification(null);
    setIsGeneratingPdf(true);
    try {
      const doc = await generateShelfTagsPdf(selectedItems, config, session, p => setPdfProgress(p));
      (doc as any).autoPrint?.({ variant: 'non-conform' });
      const blob = doc.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      const dateStr = session.inventoryDate || new Date().toISOString().slice(0, 10);
      const filename = `Shelf_Tags_${config.paperSize}_${dateStr}.pdf`;

      const pdfWin = window.open(blobUrl, '_blank');
      if (!pdfWin) {
        triggerFileDownload(blobUrl, filename);
      }
      setPrintNotification({
        type: 'success',
        message: 'High-resolution PDF generated with auto-print enabled.',
        actionUrl: blobUrl,
        actionLabel: 'Open PDF',
      });
    } catch (e: any) {
      setErrorMessage('Failed to generate PDF: ' + (e?.message || ''));
    } finally {
      setIsGeneratingPdf(false);
      setPdfProgress(null);
    }
  };

  // 3. Direct Browser Print handler (Current page)
  const handleNativePrint = () => {
    setPrintStatusNotice(null);
    try {
      window.print();
    } catch (err) {
      console.warn('Direct window.print() failed or restricted by sandbox:', err);
      setPrintStatusNotice(
        'Direct print dialog was restricted by browser. Please use "Open in New Tab" below.'
      );
      setShowPrintModal(true);
    }
  };

  const handleExportExcel = () => {
    exportInventoryToExcel(items, `Inventory_Tags_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const printStandaloneUrl = `${window.location.origin}${window.location.pathname}?mode=print`;

  return (
    <div className="space-y-6">
      {/* 1. Header with Stats & Actions (Hidden during print) */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-6 print:hidden">
        {errorMessage && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-500 hover:text-red-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {printNotification && (
          <div
            className={`mb-4 p-3.5 rounded-lg border text-xs flex items-center justify-between gap-3 ${
              printNotification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : printNotification.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2
                className={`w-4 h-4 shrink-0 ${
                  printNotification.type === 'success'
                    ? 'text-emerald-600'
                    : printNotification.type === 'warning'
                    ? 'text-amber-600'
                    : 'text-blue-600'
                }`}
              />
              <span>{printNotification.message}</span>
            </div>

            <div className="flex items-center gap-2">
              {printNotification.actionUrl && (
                <a
                  href={printNotification.actionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-white border border-zinc-300 font-bold rounded-md hover:bg-zinc-50 transition-colors inline-flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3 h-3" />
                  {printNotification.actionLabel || 'View'}
                </a>
              )}
              <button
                type="button"
                onClick={() => setPrintNotification(null)}
                className="text-zinc-500 hover:text-zinc-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                STEP 4 — PRINT PREVIEW
              </span>
              <span className="text-xs text-zinc-500 font-medium">Ready for Physical Inventory</span>
            </div>
            <h2 className="text-2xl font-black text-zinc-900 mt-2">Print Preview & Export</h2>
            <p className="text-sm text-zinc-600 mt-0.5">
              Verify tag alignment and sheet layout before sending to printer or downloading PDF.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onBackToConfig}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Adjust Layout
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-lg transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-600" />
              Export Excel
            </button>

            {/* DOWNLOAD PDF BUTTON */}
            <button
              type="button"
              disabled={isGeneratingPdf}
              onClick={handleGenerateAndDownloadPdf}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-emerald-400" />
              {isGeneratingPdf ? 'Building PDF...' : 'Download PDF'}
            </button>

            {/* DIRECT PRINT TAGS SPLIT BUTTON */}
            <div className="relative inline-flex items-center rounded-lg shadow-sm">
              <button
                type="button"
                onClick={handlePrintTags}
                disabled={isPrinting}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-600 rounded-l-lg transition-colors cursor-pointer"
                title="Print shelf tags directly to your printer"
              >
                <Printer className={`w-4 h-4 ${isPrinting ? 'animate-spin' : ''}`} />
                {isPrinting ? 'Opening Print Dialog...' : 'Print Tags'}
              </button>

              <button
                type="button"
                onClick={() => setShowPrintDropdown(prev => !prev)}
                className="px-2.5 py-2 text-white bg-emerald-800 hover:bg-emerald-900 border-l border-emerald-600 rounded-r-lg transition-colors cursor-pointer"
                title="More print methods"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showPrintDropdown && (
                <div
                  className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-zinc-200 py-1.5 z-50 text-xs font-medium text-zinc-700"
                  onClick={() => setShowPrintDropdown(false)}
                >
                  <button
                    type="button"
                    onClick={handlePrintTags}
                    className="w-full px-4 py-2.5 text-left hover:bg-emerald-50 hover:text-emerald-900 flex items-center gap-2.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-emerald-700 shrink-0" />
                    <div>
                      <div className="font-bold">Direct Print Window</div>
                      <div className="text-[10px] text-zinc-500">Auto-launches native print dialog</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintViaPdf}
                    className="w-full px-4 py-2.5 text-left hover:bg-zinc-50 flex items-center gap-2.5 cursor-pointer border-t border-zinc-100"
                  >
                    <FileDown className="w-4 h-4 text-zinc-700 shrink-0" />
                    <div>
                      <div className="font-bold">Print via Vector PDF</div>
                      <div className="text-[10px] text-zinc-500">Millimeter-precise vector barcodes</div>
                    </div>
                  </button>

                  <a
                    href={printStandaloneUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full px-4 py-2.5 text-left hover:bg-zinc-50 flex items-center gap-2.5 cursor-pointer border-t border-zinc-100 text-zinc-700"
                  >
                    <ExternalLink className="w-4 h-4 text-zinc-500 shrink-0" />
                    <div>
                      <div className="font-bold">Open Standalone Tab</div>
                      <div className="text-[10px] text-zinc-500">Dedicated window without layout header</div>
                    </div>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setShowPrintDropdown(false);
                      setShowPrintModal(true);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-zinc-50 flex items-center gap-2 cursor-pointer border-t border-zinc-100 text-zinc-500 text-[11px]"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>Print Troubleshooting & Options</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Metric Pill Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 text-xs">
          <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
            <span className="text-zinc-500 font-medium block">Paper Format</span>
            <span className="font-bold text-zinc-900 mt-0.5 block font-mono">
              {config.paperSize} ({paperDimensions.width}×{paperDimensions.height}mm)
            </span>
          </div>

          <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
            <span className="text-zinc-500 font-medium block">Orientation</span>
            <span className="font-bold text-zinc-900 mt-0.5 block capitalize">
              {config.orientation}
            </span>
          </div>

          <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
            <span className="text-zinc-500 font-medium block">Tags Per Page</span>
            <span className="font-bold text-zinc-900 mt-0.5 block font-mono">
              {tagsPerPage} ({cols} cols × {rows} rows)
            </span>
          </div>

          <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
            <span className="text-zinc-500 font-medium block">Total Items</span>
            <span className="font-bold text-emerald-800 mt-0.5 block font-mono">
              {selectedItems.length} tags selected
            </span>
          </div>

          <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-200 col-span-2 sm:col-span-1">
            <span className="text-zinc-500 font-medium block">Total Sheets</span>
            <span className="font-bold text-zinc-900 mt-0.5 block font-mono">
              {totalPages} page{totalPages > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* PDF Generation Progress Bar */}
        {isGeneratingPdf && pdfProgress && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-1.5">
            <div className="flex justify-between font-bold text-emerald-900">
              <span>Rendering high-resolution vector PDF pages...</span>
              <span>
                Page {pdfProgress.currentPage} of {pdfProgress.totalPages} ({pdfProgress.percent}%)
              </span>
            </div>
            <div className="w-full bg-emerald-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-1.5 rounded-full transition-all duration-150"
                style={{ width: `${pdfProgress.percent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* COUNT TAG FILTER LOCATOR & PRINTED INDICATOR PANEL */}
      {locatorCounts.length > 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-4 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
                <Filter className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs font-bold text-zinc-900 tracking-wide uppercase">
                    Count Tag Filter Locator
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 font-mono">
                    {selectedLocators.size} of {allLocators.length} Locators Selected
                  </span>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    ({selectedItems.length} tags · {totalPages} sheets)
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Select specific locators to print. Filtered views do not modify imported Excel data. Printed status updates automatically on print or PDF export.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleSelectAllLocators}
                className="px-2.5 py-1 text-xs font-semibold text-zinc-700 bg-zinc-50 hover:bg-zinc-100 border border-zinc-300 rounded-lg transition-colors cursor-pointer"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleClearAllLocators}
                className="px-2.5 py-1 text-xs font-semibold text-zinc-700 bg-zinc-50 hover:bg-zinc-100 border border-zinc-300 rounded-lg transition-colors cursor-pointer"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={handleInvertLocators}
                className="px-2.5 py-1 text-xs font-semibold text-zinc-700 bg-zinc-50 hover:bg-zinc-100 border border-zinc-300 rounded-lg transition-colors cursor-pointer"
              >
                Invert
              </button>
              {printedLocators.size > 0 && (
                <button
                  type="button"
                  onClick={handleResetPrintStatus}
                  title="Reset printed marks for this dataset"
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-zinc-600 hover:text-rose-600 bg-zinc-50 hover:bg-rose-50 border border-zinc-300 hover:border-rose-300 rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset Printed Marks ({printedLocators.size})
                </button>
              )}
            </div>
          </div>

          {/* Search bar if many locators */}
          {locatorCounts.length > 5 && (
            <div className="pt-3">
              <input
                type="text"
                value={locatorSearch}
                onChange={e => setLocatorSearch(e.target.value)}
                placeholder="Search locator code..."
                className="w-full sm:w-64 px-2.5 py-1 text-xs border border-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
              />
            </div>
          )}

          {/* Locator Checkbox Grid */}
          <div className="mt-3 max-h-52 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {filteredLocatorCounts.map(({ locator, count }) => {
              const isChecked = selectedLocators.has(locator);
              const isPrinted = printedLocators.has(locator);

              return (
                <div
                  key={locator}
                  onClick={() => handleToggleLocator(locator)}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-emerald-50/60 border-emerald-300 text-zinc-900 shadow-2xs'
                      : 'bg-zinc-50/70 border-zinc-200 text-zinc-500 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${
                        isChecked
                          ? 'bg-emerald-700 border-emerald-700 text-white'
                          : 'border-zinc-300 bg-white text-transparent'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold font-mono truncate text-zinc-900" title={locator}>
                        {locator}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {count} tag{count > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  {/* Printed Indicator Badge */}
                  <div className="shrink-0 ml-1.5">
                    {isPrinted ? (
                      <span
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-600 text-white shadow-2xs"
                        title="Printed — can still be reprinted at any time"
                      >
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        PRINTED
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-zinc-200 text-zinc-600">
                        PENDING
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Interactive Navigation & Zoom Bar (Hidden during print) */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-3 flex flex-wrap items-center justify-between gap-3 print:hidden">
        {/* Pagination Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1 || viewMode === 'all'}
            className="p-1.5 rounded-lg border border-zinc-300 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-800 font-mono px-1">
              SHEET {currentPage} OF {totalPages}
            </span>
            {currentPageData && currentPageData.locators.length > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-zinc-100 text-zinc-800 border border-zinc-200">
                <span className="text-zinc-500 font-medium">Loc:</span>
                <span className="font-mono text-zinc-950">
                  {currentPageData.locators.join(', ')}
                </span>
                <span className="text-zinc-500 font-normal">
                  ({currentPageData.totalTags} tag{currentPageData.totalTags > 1 ? 's' : ''})
                </span>
              </span>
            )}
            {currentPageData?.isMixedLocators && (
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Sparkles className="w-3 h-3" />
                Paper-Saving Packed
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages || viewMode === 'all'}
            className="p-1.5 rounded-lg border border-zinc-300 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* View Mode & Zoom Controls */}
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="inline-flex bg-zinc-100 p-0.5 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => setViewMode('single')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                viewMode === 'single' ? 'bg-white font-bold text-zinc-900 shadow-xs' : 'text-zinc-600'
              }`}
            >
              Single Sheet
            </button>
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                viewMode === 'all' ? 'bg-white font-bold text-zinc-900 shadow-xs' : 'text-zinc-600'
              }`}
            >
              All Sheets ({totalPages})
            </button>
          </div>

          {/* Zoom Buttons */}
          <div className="flex items-center gap-1 border-l border-zinc-200 pl-3">
            <button
              type="button"
              onClick={() => setZoomScale(s => Math.max(0.4, s - 0.1))}
              className="p-1.5 rounded-lg text-zinc-600 hover:bg-zinc-100 cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-zinc-700 min-w-[45px] text-center">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomScale(s => Math.min(1.5, s + 0.1))}
              className="p-1.5 rounded-lg text-zinc-600 hover:bg-zinc-100 cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoomScale(0.85)}
              className="p-1.5 rounded-lg text-zinc-600 hover:bg-zinc-100 cursor-pointer text-xs"
              title="Reset Zoom"
            >
              <Maximize className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Screen Preview Canvas (PRINT:HIDDEN to avoid double printing and scaling errors) */}
      <div className="flex flex-col items-center justify-center p-6 bg-zinc-200/70 rounded-2xl border border-zinc-300 min-h-[600px] overflow-auto print:hidden">
        {viewMode === 'single' ? (
          /* Single Page View */
          <div
            className="bg-white shadow-2xl transition-transform duration-100 ease-out origin-top border border-zinc-300"
            style={{
              width: `${paperDimensions.width * zoomScale}mm`,
              minHeight: `${paperDimensions.height * zoomScale}mm`,
              paddingTop: `${config.marginTopMm * zoomScale}mm`,
              paddingBottom: `${config.marginBottomMm * zoomScale}mm`,
              paddingLeft: `${config.marginLeftMm * zoomScale}mm`,
              paddingRight: `${config.marginRightMm * zoomScale}mm`,
              boxSizing: 'border-box',
            }}
          >
            {/* Optional Sheet Top Header */}
            {config.showSessionHeader && session.branch && (
              <div
                className="text-zinc-500 font-mono flex items-center justify-between pb-1 mb-2 border-b border-zinc-200"
                style={{ fontSize: `${9 * zoomScale}px` }}
              >
                <div>
                  <strong className="text-zinc-800">{session.branch}</strong>
                  {session.store && ` | Store: ${session.store}`}
                  {session.inventoryDate && ` | Date: ${session.inventoryDate}`}
                  {currentPageData && currentPageData.locators.length > 0 && (
                    <span className="ml-2 text-zinc-700">
                      | Locator: {currentPageData.locators.join(', ')}
                    </span>
                  )}
                </div>
                <div>
                  Page {currentPage} of {totalPages}
                </div>
              </div>
            )}

            {/* Tags Grid */}
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${config.columns}, ${config.tagWidthMm * zoomScale}mm)`,
                gap: `${config.gapRowMm * zoomScale}mm ${config.gapColMm * zoomScale}mm`,
              }}
            >
              {currentPageItems.map(item => (
                <ShelfTag key={item.id} item={item} config={config} scale={zoomScale} />
              ))}
            </div>
          </div>
        ) : (
          /* All Sheets View */
          <div className="space-y-8">
            {packedPages.map((pageData, pageIdx) => {
              const pageItems = pageData.items;

              return (
                <div key={pageIdx} className="space-y-2">
                  <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider text-center flex flex-wrap items-center justify-center gap-2">
                    <span>Sheet {pageIdx + 1} of {totalPages}</span>
                    {pageData.locators.length > 0 && (
                      <span className="font-mono text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-xs">
                        Locator: {pageData.locators.join(', ')} ({pageData.totalTags} tag{pageData.totalTags > 1 ? 's' : ''})
                      </span>
                    )}
                    {pageData.isMixedLocators && (
                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 text-[10px] px-1.5 py-0.5 rounded-full">
                        Paper-Saving Packed
                      </span>
                    )}
                  </div>
                  <div
                    className="bg-white shadow-xl origin-top border border-zinc-300"
                    style={{
                      width: `${paperDimensions.width * zoomScale}mm`,
                      minHeight: `${paperDimensions.height * zoomScale}mm`,
                      paddingTop: `${config.marginTopMm * zoomScale}mm`,
                      paddingBottom: `${config.marginBottomMm * zoomScale}mm`,
                      paddingLeft: `${config.marginLeftMm * zoomScale}mm`,
                      paddingRight: `${config.marginRightMm * zoomScale}mm`,
                      boxSizing: 'border-box',
                    }}
                  >
                    {config.showSessionHeader && session.branch && (
                      <div
                        className="text-zinc-500 font-mono flex items-center justify-between pb-1 mb-2 border-b border-zinc-200"
                        style={{ fontSize: `${9 * zoomScale}px` }}
                      >
                        <div>
                          <strong className="text-zinc-800">{session.branch}</strong>
                          {session.store && ` | Store: ${session.store}`}
                          {pageData.locators.length > 0 && (
                            <span className="ml-2 text-zinc-700">
                              | Locator: {pageData.locators.join(', ')}
                            </span>
                          )}
                        </div>
                        <div>
                          Page {pageIdx + 1} of {totalPages}
                        </div>
                      </div>
                    )}

                    <div
                      className="grid"
                      style={{
                        gridTemplateColumns: `repeat(${config.columns}, ${config.tagWidthMm * zoomScale}mm)`,
                        gap: `${config.gapRowMm * zoomScale}mm ${config.gapColMm * zoomScale}mm`,
                      }}
                    >
                      {pageItems.map(item => (
                        <ShelfTag key={item.id} item={item} config={config} scale={zoomScale} />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. DEDICATED NATIVE PRINT CONTAINER (Hidden on screen, rendered into print window and during @media print) */}
      <div ref={printContainerRef} className="hidden print:block print:w-full print:m-0 print:p-0">
        {packedPages.map((pageData, pageIdx) => {
          const pageItems = pageData.items;

          return (
            <div
              key={pageIdx}
              className="page-break"
              style={{
                width: `${paperDimensions.width}mm`,
                minHeight: `${paperDimensions.height}mm`,
                paddingTop: `${config.marginTopMm}mm`,
                paddingBottom: `${config.marginBottomMm}mm`,
                paddingLeft: `${config.marginLeftMm}mm`,
                paddingRight: `${config.marginRightMm}mm`,
                boxSizing: 'border-box',
                pageBreakAfter: 'always',
                breakAfter: 'page',
              }}
            >
              {config.showSessionHeader && session.branch && (
                <div className="text-zinc-500 text-[8pt] font-mono flex items-center justify-between pb-1 mb-2 border-b border-zinc-300">
                  <div>
                    <strong className="text-black">{session.branch}</strong>
                    {session.store && ` | Store: ${session.store}`}
                    {session.inventoryDate && ` | Date: ${session.inventoryDate}`}
                    {pageData.locators.length > 0 && (
                      <span className="ml-2 text-zinc-700">
                        | Locator: {pageData.locators.join(', ')}
                      </span>
                    )}
                  </div>
                  <div>
                    Page {pageIdx + 1} of {totalPages}
                  </div>
                </div>
              )}

              <div
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(${config.columns}, ${config.tagWidthMm}mm)`,
                  gap: `${config.gapRowMm}mm ${config.gapColMm}mm`,
                }}
              >
                {pageItems.map(item => (
                  <ShelfTag key={item.id} item={item} config={config} scale={1} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: PDF DOWNLOAD & EXPORT READY MODAL */}
      {showPdfModal && generatedPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-emerald-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-800 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">High-Resolution PDF Ready</h3>
                  <p className="text-xs text-emerald-100">
                    {generatedPdf.totalPages} sheet{generatedPdf.totalPages > 1 ? 's' : ''} · {generatedPdf.totalTags} tags generated
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPdfModal(false)}
                className="text-emerald-200 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs flex items-center justify-between">
                <div>
                  <span className="text-zinc-500 font-medium block">File Name</span>
                  <span className="font-mono font-bold text-zinc-900">{generatedPdf.filename}</span>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-md uppercase text-[10px]">
                  Ready
                </span>
              </div>

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Direct Download Anchor */}
                <a
                  href={generatedPdf.url}
                  download={generatedPdf.filename}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl shadow-sm transition-colors text-center cursor-pointer"
                >
                  <FileDown className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Download PDF File</span>
                </a>

                {/* Open in New Window / Tab */}
                <a
                  href={generatedPdf.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm transition-colors text-center cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 shrink-0" />
                  <span>Open in Browser PDF Viewer</span>
                </a>
              </div>

              {/* Embedded PDF Preview */}
              <div className="border border-zinc-300 rounded-xl overflow-hidden bg-zinc-100">
                <div className="px-3 py-2 bg-zinc-200 text-zinc-700 text-xs font-semibold flex items-center justify-between border-b border-zinc-300">
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" /> PDF Live Viewer
                  </span>
                  <span className="text-[10px] text-zinc-500">Scroll to view sheets</span>
                </div>
                <iframe
                  src={generatedPdf.url}
                  title="PDF Preview"
                  className="w-full h-64 border-none bg-white"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Preview note:</strong> If your browser blocks automatic downloads inside this preview frame, simply click <strong>"Open in Browser PDF Viewer"</strong> above to view, save, or print with your browser's native controls.
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-zinc-50 border-t border-zinc-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPdfModal(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PRINT OPTIONS & SANDBOX BYPASS MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-zinc-200 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 bg-zinc-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-zinc-800 rounded-lg">
                  <Printer className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">Print Shelf Tags</h3>
                  <p className="text-xs text-zinc-400">
                    Choose printing method for physical counting sheets
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {printStatusNotice && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{printStatusNotice}</span>
                </div>
              )}

              {/* Option 1: Direct Print Window */}
              <div className="p-4 border-2 border-emerald-600 bg-emerald-50/50 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Recommended (Fast & Reliable)
                  </span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-1.5 py-0.5 rounded">
                    1-Click Print
                  </span>
                </div>
                <h4 className="font-bold text-zinc-900 text-sm">Direct High-Fidelity Print Window</h4>
                <p className="text-xs text-zinc-600">
                  Opens a clean print window with all barcodes, locators, and styles, and triggers your printer dialog automatically.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPrintModal(false);
                      handlePrintTags();
                    }}
                    className="inline-flex items-center justify-center gap-2 flex-1 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    Launch Print Window
                  </button>
                  <a
                    href={printStandaloneUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowPrintModal(false)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-800 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                    title="Open pure URL in new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    New Tab
                  </a>
                </div>
              </div>

              {/* Option 2: Print via Generated PDF */}
              <div className="p-4 border border-zinc-200 bg-zinc-50 rounded-xl space-y-2">
                <h4 className="font-bold text-zinc-900 text-sm">Print via Vector PDF (Auto-Print)</h4>
                <p className="text-xs text-zinc-600">
                  Generates an exact millimeter-precise vector PDF with embedded printer instructions.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowPrintModal(false);
                    handlePrintViaPdf();
                  }}
                  className="mt-1 inline-flex items-center justify-center gap-2 w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  <FileDown className="w-4 h-4 text-emerald-400" />
                  Generate PDF & Launch Print
                </button>
              </div>

              {/* Option 3: Quick Browser Print in Current Frame */}
              <div className="p-4 border border-zinc-200 bg-zinc-50 rounded-xl space-y-2">
                <h4 className="font-bold text-zinc-900 text-sm">Direct Browser Print (Current Page)</h4>
                <p className="text-xs text-zinc-600">
                  Calls standard browser print in this view (may be blocked if viewed inside restricted iframes).
                </p>
                <button
                  type="button"
                  onClick={() => {
                    handleNativePrint();
                  }}
                  className="mt-1 inline-flex items-center justify-center gap-2 w-full px-4 py-2 bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-800 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-zinc-600" />
                  Trigger window.print()
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-zinc-50 border-t border-zinc-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
