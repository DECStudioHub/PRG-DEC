import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CountSheetConfig,
  CountSheetPageData,
  CountSheetPreset,
  InventoryItem,
  InventorySession,
  SystemSettings,
} from '../../types';
import {
  calculateCountSheetSummary,
  DEFAULT_COUNT_SHEET_CONFIG,
  DEFAULT_CYCLE_COUNT_SHEET_CONFIG,
  DEFAULT_COUNT_SHEET_PRESETS,
  getCountSheetPaperDimensions,
  paginateCountSheetItems,
} from '../../utils/countSheetLayoutEngine';
import { CountSheetPage } from './CountSheetPage';
import { CountSheetConfigPanel } from './CountSheetConfigPanel';
import {
  downloadCountSheetPdf,
  CountSheetPdfProgress,
} from '../../utils/countSheetPdfGenerator';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileSpreadsheet,
  Filter,
  Grid,
  Loader2,
  Maximize2,
  Printer,
  RotateCcw,
  Sliders,
  Square,
  Tag,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface CountSheetGeneratorProps {
  items: InventoryItem[];
  session: InventorySession;
  settings: SystemSettings;
  moduleContext?: 'pcount' | 'cycle_count';
  onBackToValidate?: () => void;
  onSwitchToCountTags?: () => void;
}

export const CountSheetGenerator: React.FC<CountSheetGeneratorProps> = ({
  items,
  session,
  settings,
  moduleContext = 'pcount',
  onBackToValidate,
  onSwitchToCountTags,
}) => {
  const isCycleCount = moduleContext === 'cycle_count';
  const configStorageKey = isCycleCount
    ? 'count_sheet_active_config_cycle_count'
    : 'count_sheet_active_config';

  // Preset management stored in localStorage
  const [presets, setPresets] = useState<CountSheetPreset[]>(() => {
    try {
      const saved = localStorage.getItem('count_sheet_presets');
      if (saved) {
        const parsed: CountSheetPreset[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return DEFAULT_COUNT_SHEET_PRESETS;
  });

  // Active configuration (Independent per module)
  const [config, setConfig] = useState<CountSheetConfig>(() => {
    const baseDefault = isCycleCount
      ? DEFAULT_CYCLE_COUNT_SHEET_CONFIG
      : DEFAULT_COUNT_SHEET_CONFIG;

    try {
      const saved = localStorage.getItem(configStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged: CountSheetConfig = {
          ...baseDefault,
          ...parsed,
          barcodeWidthMm: parsed.barcodeWidthMm || baseDefault.barcodeWidthMm || 36,
          sortField: parsed.sortField || 'description',
          sortOrder: parsed.sortOrder || 'asc',
        };

        // For Cycle Count, ensure user request requirements are enforced:
        if (isCycleCount) {
          merged.mixLocators = true;
          merged.showLocatorBarcode = false;
          merged.showLocatorText = false;
          merged.showLocatorBarcodeText = false;
          if (!merged.columnOrder || !merged.columnOrder.includes('locator')) {
            merged.columnOrder = ['locator', ...(merged.columnOrder || ['sku', 'barcode', 'description', 'count'])];
          }
          if (!merged.columnVisibility) {
            merged.columnVisibility = { ...DEFAULT_CYCLE_COUNT_SHEET_CONFIG.columnVisibility };
          } else {
            merged.columnVisibility.locator = true;
          }
        }
        return merged;
      }
    } catch {}
    return { ...baseDefault };
  });

  // Calculate summary statistics
  const summary = useMemo(() => {
    return calculateCountSheetSummary(items, config.rowsPerPage, Boolean(config.mixLocators));
  }, [items, config.rowsPerPage, config.mixLocators]);

  // List of all distinct available locators in the imported dataset
  const allLocators = useMemo(() => {
    return summary.locatorCounts.map(lc => lc.locator);
  }, [summary.locatorCounts]);

  // Dataset fingerprint to isolate printed statuses between different imported Excel datasets
  const datasetFingerprint = useMemo(() => {
    if (!items || items.length === 0) return 'empty';
    const first = items[0];
    const last = items[items.length - 1];
    const firstKey = first ? `${first.sku || first.id || ''}_${first.locator || ''}` : '';
    const lastKey = last ? `${last.sku || last.id || ''}_${last.locator || ''}` : '';
    return `cs_ds_${items.length}_${firstKey}_${lastKey}`;
  }, [items]);

  // Selected locators for printing (checked = included, unchecked = excluded)
  const [selectedLocators, setSelectedLocators] = useState<Set<string>>(() => {
    return new Set(summary.locatorCounts.map(lc => lc.locator));
  });

  // Track dataset fingerprint to re-initialize selections on newly imported dataset
  const prevFingerprintRef = useRef<string>(datasetFingerprint);
  useEffect(() => {
    if (prevFingerprintRef.current !== datasetFingerprint) {
      prevFingerprintRef.current = datasetFingerprint;
      setSelectedLocators(new Set(allLocators));
      setActivePageIndex(0);
    }
  }, [datasetFingerprint, allLocators]);

  // Set of printed locators (persisted per datasetFingerprint)
  const [printedLocators, setPrintedLocators] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(`count_sheet_printed_${datasetFingerprint}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return new Set(parsed);
        }
      }
    } catch {}
    return new Set<string>();
  });

  // Reload printed locators when dataset changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`count_sheet_printed_${datasetFingerprint}`);
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

  // Helper to persist printed locators
  const savePrintedLocators = (newSet: Set<string>) => {
    setPrintedLocators(newSet);
    try {
      localStorage.setItem(
        `count_sheet_printed_${datasetFingerprint}`,
        JSON.stringify(Array.from(newSet))
      );
    } catch (e) {
      console.warn('Could not persist printed locators:', e);
    }
  };

  const markLocatorsAsPrinted = (locatorsToMark: string[]) => {
    if (locatorsToMark.length === 0) return;
    setPrintedLocators(prev => {
      const updated = new Set(prev);
      locatorsToMark.forEach(l => updated.add(l));
      try {
        localStorage.setItem(
          `count_sheet_printed_${datasetFingerprint}`,
          JSON.stringify(Array.from(updated))
        );
      } catch {}
      return updated;
    });
  };

  // Reset confirmation modal & search filter
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [locatorSearch, setLocatorSearch] = useState<string>('');

  // Filtered locators list for search UI
  const filteredLocatorCounts = useMemo(() => {
    if (!locatorSearch.trim()) return summary.locatorCounts;
    const q = locatorSearch.trim().toLowerCase();
    return summary.locatorCounts.filter(lc => lc.locator.toLowerCase().includes(q));
  }, [summary.locatorCounts, locatorSearch]);

  // Selected locators ordered according to original dataset locator sequence
  const selectedLocatorsArray = useMemo(() => {
    return allLocators.filter(loc => selectedLocators.has(loc));
  }, [allLocators, selectedLocators]);

  // View state
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [zoomScale, setZoomScale] = useState<number>(0.85);
  const [showConfigDrawer, setShowConfigDrawer] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'single' | 'continuous' | 'grid'>('continuous');

  // Print & PDF states
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfProgress, setPdfProgress] = useState<CountSheetPdfProgress | null>(null);
  const [printNotice, setPrintNotice] = useState<{
    type: 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);

  const printContainerRef = useRef<HTMLDivElement>(null);

  // Selection handlers
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
    setActivePageIndex(0);
  };

  const handleSelectAllLocators = () => {
    setSelectedLocators(new Set(allLocators));
    setActivePageIndex(0);
  };

  const handleClearAllLocators = () => {
    setSelectedLocators(new Set());
    setActivePageIndex(0);
  };

  const handleInvertSelection = () => {
    setSelectedLocators(prev => {
      const updated = new Set<string>();
      allLocators.forEach(loc => {
        if (!prev.has(loc)) {
          updated.add(loc);
        }
      });
      return updated;
    });
    setActivePageIndex(0);
  };

  const handleConfirmResetPrintStatus = () => {
    savePrintedLocators(new Set());
    setShowResetConfirm(false);
    setPrintNotice({
      type: 'info',
      message: 'Printed status has been reset for all locators.',
    });
  };

  // Listen to print completion events
  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      if (event.data?.type === 'COUNT_SHEET_PRINTED_SUCCESS') {
        if (selectedLocatorsArray.length > 0) {
          markLocatorsAsPrinted(selectedLocatorsArray);
        }
      }
    };
    const handleAfterPrint = () => {
      if (selectedLocatorsArray.length > 0) {
        markLocatorsAsPrinted(selectedLocatorsArray);
      }
    };

    window.addEventListener('message', handleWindowMessage);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('message', handleWindowMessage);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [selectedLocatorsArray]);

  // Persist config on update
  const handleUpdateConfig = (newConfig: CountSheetConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem(configStorageKey, JSON.stringify(newConfig));
    } catch (e) {
      console.warn('Could not save count sheet config:', e);
    }
  };

  const handleSelectPreset = (preset: CountSheetPreset) => {
    handleUpdateConfig(preset.config);
  };

  const handleSaveNewPreset = (name: string, description: string) => {
    const newPreset: CountSheetPreset = {
      id: `custom_${Date.now()}`,
      name,
      description,
      config: { ...config },
    };
    const updated = [...presets, newPreset];
    setPresets(updated);
    try {
      localStorage.setItem('count_sheet_presets', JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save preset:', e);
    }
  };

  const handleDeletePreset = (presetId: string) => {
    const updated = presets.filter(p => p.id !== presetId);
    setPresets(updated);
    try {
      localStorage.setItem('count_sheet_presets', JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save presets after deletion:', e);
    }
  };

  const handleResetToDefaults = () => {
    handleUpdateConfig(
      isCycleCount
        ? { ...DEFAULT_CYCLE_COUNT_SHEET_CONFIG }
        : { ...DEFAULT_COUNT_SHEET_CONFIG }
    );
  };

  // Generate paginated pages strictly for selected locators
  const pages: CountSheetPageData[] = useMemo(() => {
    if (selectedLocatorsArray.length === 0) return [];
    return paginateCountSheetItems(
      items,
      config.rowsPerPage,
      selectedLocatorsArray,
      config.sortField,
      config.sortOrder,
      Boolean(config.mixLocators)
    );
  }, [items, config.rowsPerPage, selectedLocatorsArray, config.sortField, config.sortOrder, config.mixLocators]);

  // Paper dimensions
  const paperDims = useMemo(() => {
    return getCountSheetPaperDimensions(
      config.paperSize,
      config.customWidthMm,
      config.customHeightMm,
      config.orientation
    );
  }, [config.paperSize, config.customWidthMm, config.customHeightMm, config.orientation]);

  // Adjust active page index if out of range
  useEffect(() => {
    if (activePageIndex >= pages.length) {
      setActivePageIndex(Math.max(0, pages.length - 1));
    }
  }, [pages.length, activePageIndex]);

  // Handle PDF Generation & Download
  const handleDownloadPdf = async () => {
    if (isGeneratingPdf || pages.length === 0 || selectedLocatorsArray.length === 0) return;
    setPrintNotice(null);
    setIsGeneratingPdf(true);
    setPdfProgress({ currentPage: 1, totalPages: pages.length, percent: 10 });

    const locsToMark = [...selectedLocatorsArray];

    try {
      await downloadCountSheetPdf(
        items,
        config,
        session,
        locsToMark,
        progress => setPdfProgress(progress)
      );
      markLocatorsAsPrinted(locsToMark);
      setPrintNotice({
        type: 'info',
        message: `PDF generated successfully. ${locsToMark.length} locator${locsToMark.length > 1 ? 's' : ''} marked as PRINTED.`,
      });
    } catch (err: any) {
      console.error('Download Count Sheet PDF error:', err);
      setPrintNotice({
        type: 'error',
        message: err?.message || 'Unable to generate the Count Sheet PDF. Please try again.',
      });
    } finally {
      setIsGeneratingPdf(false);
      setPdfProgress(null);
    }
  };

  // Handle printing with multi-strategy support (direct window.print + standalone print window fallback for sandboxed iframes)
  const handlePrint = () => {
    if (isPrinting || isGeneratingPdf || pages.length === 0 || selectedLocatorsArray.length === 0) return;
    setPrintNotice(null);
    setIsPrinting(true);

    const locsToMark = [...selectedLocatorsArray];
    const isIframe = typeof window !== 'undefined' && window.self !== window.top;

    // Strategy 1: In standard top-level tab, direct window.print() is preferred
    if (!isIframe) {
      try {
        window.print();
        setIsPrinting(false);
        markLocatorsAsPrinted(locsToMark);
        return;
      } catch (err) {
        console.warn('Direct window.print failed, attempting standalone window:', err);
      }
    }

    // Strategy 2: Standalone print window (bypasses iframe sandbox restrictions and guarantees 100% clean print)
    let printWin: Window | null = null;
    try {
      printWin = window.open('', '_blank');
    } catch (e) {
      console.warn('window.open blocked:', e);
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

        const paperDims = getCountSheetPaperDimensions(
          config.paperSize,
          config.customWidthMm,
          config.customHeightMm,
          config.orientation
        );

        printWin.document.open();
        printWin.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <base href="${baseHref}">
  <title>Count Sheet - ${config.paperSize} (${pages.length} Pages)</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${currentStyles}
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    @page {
      size: ${config.orientation === 'landscape' ? 'landscape' : 'portrait'};
      margin: 0;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: #f1f5f9;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    @media print {
      html, body {
        background: #ffffff !important;
        background-color: #ffffff !important;
      }
      .count-sheet-print-container {
        display: block !important;
        width: 100% !important;
      }
      .count-sheet-print-page,
      .page-break {
        page-break-after: always !important;
        break-after: page !important;
        box-shadow: none !important;
        margin: 0 auto !important;
        border: none !important;
      }
      .count-sheet-print-page:last-child,
      .page-break:last-child {
        page-break-after: auto !important;
        break-after: auto !important;
      }
      .print-wrapper {
        padding: 0 !important;
        gap: 0 !important;
        display: block !important;
        background: #ffffff !important;
      }
    }
    .print-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 8px;
      gap: 24px;
    }
  </style>
</head>
<body>
  <div class="print-wrapper">
    ${printHtml}
  </div>

  <script>
    function triggerPrint() {
      window.focus();
      try {
        window.print();
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage({ type: 'COUNT_SHEET_PRINTED_SUCCESS' }, '*');
        }
      } catch (err) {
        console.warn('Auto-print error in window:', err);
      }
    }
    window.onafterprint = function() {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: 'COUNT_SHEET_PRINTED_SUCCESS' }, '*');
      }
    };
    if (document.readyState === 'complete') {
      setTimeout(triggerPrint, 350);
    } else {
      window.addEventListener('load', function() {
        setTimeout(triggerPrint, 350);
      });
    }
  </script>
</body>
</html>`);
        printWin.document.close();
        setIsPrinting(false);
        markLocatorsAsPrinted(locsToMark);
        return;
      } catch (writeErr) {
        console.warn('Failed writing to print window:', writeErr);
        if (printWin) {
          try { printWin.close(); } catch {}
        }
      }
    }

    // Strategy 3: Fallback direct call
    try {
      window.print();
      markLocatorsAsPrinted(locsToMark);
    } catch (finalErr: any) {
      console.error('Final window.print call error:', finalErr);
      setPrintNotice({
        type: 'warning',
        message: 'The browser restricted opening the print dialog inside this preview window. Please click "Download PDF" for a high-quality printable document, or open the app in a new tab.',
      });
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="space-y-4 print:space-y-0 print:m-0 print:p-0 print:block">
      {/* 1. TOP SUMMARY & ACTION BAR (MANDATED SECTION 27) */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            {onBackToValidate && (
              <button
                type="button"
                onClick={onBackToValidate}
                className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                title="Back to item validation"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
              <h1 className="text-lg font-black tracking-tight text-zinc-900 uppercase">
                {isCycleCount ? 'CYCLE COUNT SHEET GENERATOR' : 'COUNT SHEET GENERATOR'}
              </h1>
            </div>
            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border ${
              isCycleCount
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-emerald-100 text-emerald-800 border-emerald-200'
            }`}>
              {isCycleCount
                ? config.mixLocators ? 'CYCLE COUNT • CONTINUOUS FILL' : 'CYCLE COUNT • SPLIT LOCATORS'
                : 'PHYSICAL INVENTORY FORM'}
            </span>
          </div>

          {/* Mandatory Summary Metrics */}
          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-zinc-600">
            <div>
              <span className="text-zinc-400 font-medium">Total Items: </span>
              <span className="font-mono font-bold text-zinc-900">{summary.totalItems}</span>
            </div>
            <span className="text-zinc-300">•</span>
            <div>
              <span className="text-zinc-400 font-medium">Total Locators: </span>
              <span className="font-mono font-bold text-zinc-900">{summary.totalLocators}</span>
            </div>
            <span className="text-zinc-300">•</span>
            <div>
              <span className="text-zinc-400 font-medium">Selected Locators: </span>
              <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                {selectedLocatorsArray.length} of {allLocators.length}
              </span>
            </div>
            <span className="text-zinc-300">•</span>
            <div>
              <span className="text-zinc-400 font-medium">Rows Per Page: </span>
              <span className="font-mono font-bold text-zinc-900 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                {config.rowsPerPage}
              </span>
            </div>
            <span className="text-zinc-300">•</span>
            <div>
              <span className="text-zinc-400 font-medium">Pages to Print: </span>
              <span className="font-mono font-bold text-zinc-900">{pages.length}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-end">
          {/* Switch to Count Tags */}
          <button
            type="button"
            onClick={onSwitchToCountTags}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-300 rounded-lg transition-colors cursor-pointer"
            title="Generate Count Tags using the same Excel data"
          >
            <Tag className="w-3.5 h-3.5 text-zinc-500" />
            <span>Generate Count Tags</span>
          </button>

          {/* Toggle Config Drawer */}
          <button
            type="button"
            onClick={() => setShowConfigDrawer(!showConfigDrawer)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
              showConfigDrawer
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{showConfigDrawer ? 'Hide Settings' : 'Layout Settings'}</span>
          </button>

          {/* Download PDF Button */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf || pages.length === 0 || selectedLocatorsArray.length === 0}
            title={selectedLocatorsArray.length === 0 ? 'Select at least one locator to download PDF' : 'Download Count Sheet as a high-resolution, vector PDF document'}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-zinc-900 bg-white hover:bg-zinc-50 border border-zinc-300 hover:border-zinc-400 rounded-lg shadow-2xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span>
                  Generating PDF...
                  {pdfProgress && pdfProgress.totalPages > 1 ? ` (${pdfProgress.percent}%)` : ''}
                </span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-emerald-700" />
                <span>DOWNLOAD PDF</span>
              </>
            )}
          </button>

          {/* Direct Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            disabled={isPrinting || isGeneratingPdf || pages.length === 0 || selectedLocatorsArray.length === 0}
            title={selectedLocatorsArray.length === 0 ? 'Select at least one locator to print' : 'Print Count Sheets'}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isPrinting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Preparing Print...</span>
              </>
            ) : (
              <>
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Print Notice / Error Banner */}
      {printNotice && (
        <div
          className={`px-4 py-3 rounded-xl border flex items-center justify-between gap-3 text-xs print:hidden ${
            printNotice.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : printNotice.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{printNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setPrintNotice(null)}
            className="p-1 hover:bg-black/5 rounded text-current transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. FILTER LOCATOR PANEL (CHECKBOX SELECTION & PRINT STATUS TRACKING) */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs print:hidden space-y-3">
        {/* Header: Title, Selected Count, and Action Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg">
              <Filter className="w-3.5 h-3.5 text-emerald-700" />
              <span className="font-extrabold text-emerald-950 text-xs tracking-wider uppercase">
                FILTER LOCATOR
              </span>
            </div>
            <span className="text-zinc-300 hidden sm:inline">•</span>
            <div className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
              <span>Selected:</span>
              <span className="font-mono font-bold text-zinc-950 px-2 py-0.5 bg-zinc-100 rounded-md border border-zinc-200">
                {selectedLocatorsArray.length} / {allLocators.length} Locators
              </span>
              {selectedLocatorsArray.length > 0 ? (
                <span className="text-[11px] text-zinc-500 font-normal">
                  ({pages.length} {pages.length === 1 ? 'page' : 'pages'} to print)
                </span>
              ) : (
                <span className="text-[11px] text-amber-600 font-bold">
                  (0 pages to print — select locators below)
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSelectAllLocators}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-zinc-700 hover:text-zinc-950 bg-white hover:bg-zinc-50 border border-zinc-300 rounded-md shadow-2xs transition-colors cursor-pointer"
              title="Include all locators in print"
            >
              <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>SELECT ALL</span>
            </button>
            <button
              type="button"
              onClick={handleClearAllLocators}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-zinc-700 hover:text-zinc-950 bg-white hover:bg-zinc-50 border border-zinc-300 rounded-md shadow-2xs transition-colors cursor-pointer"
              title="Deselect all locators"
            >
              <Square className="w-3.5 h-3.5 text-zinc-400" />
              <span>CLEAR ALL</span>
            </button>
            <button
              type="button"
              onClick={handleInvertSelection}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md transition-colors cursor-pointer"
              title="Invert current locator selection"
            >
              <span>INVERT</span>
            </button>
            <span className="text-zinc-300 hidden sm:inline">|</span>
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              disabled={printedLocators.size === 0}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Reset printed status for all locators"
            >
              <RotateCcw className="w-3 h-3" />
              <span>RESET PRINT STATUS</span>
            </button>
          </div>
        </div>

        {/* Section title & search bar */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            AVAILABLE LOCATORS
          </div>
          {allLocators.length > 6 && (
            <input
              type="text"
              value={locatorSearch}
              onChange={e => setLocatorSearch(e.target.value)}
              placeholder="Search locators..."
              className="px-2.5 py-1 text-xs border border-zinc-300 rounded-md bg-white w-48 focus:ring-1 focus:ring-emerald-500 font-mono"
            />
          )}
        </div>

        {/* Locators Checkbox Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
          {filteredLocatorCounts.map(lc => {
            const isChecked = selectedLocators.has(lc.locator);
            const isPrinted = printedLocators.has(lc.locator);

            return (
              <label
                key={lc.locator}
                className={`flex items-center justify-between gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                  isChecked
                    ? 'bg-emerald-50/50 border-emerald-400/80 shadow-2xs'
                    : 'bg-zinc-50/60 border-zinc-200 text-zinc-500 hover:bg-zinc-100/60 hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleLocator(lc.locator)}
                    className="w-4 h-4 text-emerald-600 rounded border-zinc-300 focus:ring-emerald-500 cursor-pointer shrink-0"
                  />
                  <div className="min-w-0 flex flex-col">
                    <span className={`font-mono font-bold truncate text-xs ${isChecked ? 'text-zinc-900' : 'text-zinc-600'}`}>
                      {lc.locator}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {lc.count} items · {lc.pages} {lc.pages === 1 ? 'page' : 'pages'}
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  {isPrinted ? (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300"
                      title="This locator has already been printed. It remains selectable for reprinting at any time."
                    >
                      <Check className="w-2.5 h-2.5 text-emerald-700 stroke-[3]" />
                      PRINTED
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-400 border border-zinc-200"
                      title="Not printed yet"
                    >
                      NOT PRINTED
                    </span>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* 3. SUB-TOOLBAR: PREVIEW CONTROLS */}
      <div className="bg-white border border-zinc-200 rounded-xl px-4 py-2.5 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
        <div className="text-xs font-semibold text-zinc-600">
          Showing <span className="font-mono font-bold text-zinc-900">{pages.length}</span> {pages.length === 1 ? 'sheet' : 'sheets'} across <span className="font-mono font-bold text-zinc-900">{selectedLocatorsArray.length}</span> {selectedLocatorsArray.length === 1 ? 'locator' : 'locators'}
        </div>

        {/* View mode & Zoom controls */}
        <div className="flex items-center gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center border border-zinc-200 rounded-lg p-0.5 bg-zinc-50">
            <button
              type="button"
              onClick={() => setViewMode('continuous')}
              title="Continuous Vertical Scroll"
              className={`p-1.5 rounded-md cursor-pointer ${
                viewMode === 'continuous'
                  ? 'bg-white text-zinc-900 shadow-2xs font-bold'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('single')}
              title="Single Page View"
              className={`p-1.5 rounded-md cursor-pointer ${
                viewMode === 'single'
                  ? 'bg-white text-zinc-900 shadow-2xs font-bold'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              title="Grid Thumbnail View"
              className={`p-1.5 rounded-md cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-zinc-900 shadow-2xs font-bold'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Single Page Pagination controls */}
          {viewMode === 'single' && pages.length > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={activePageIndex === 0}
                onClick={() => setActivePageIndex(prev => Math.max(0, prev - 1))}
                className="p-1 border border-zinc-200 rounded hover:bg-zinc-100 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs px-2 font-bold text-zinc-800">
                {activePageIndex + 1} / {pages.length}
              </span>
              <button
                type="button"
                disabled={activePageIndex >= pages.length - 1}
                onClick={() => setActivePageIndex(prev => Math.min(pages.length - 1, prev + 1))}
                className="p-1 border border-zinc-200 rounded hover:bg-zinc-100 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Zoom controls */}
          <div className="flex items-center gap-1.5 border-l border-zinc-200 pl-3">
            <button
              type="button"
              onClick={() => setZoomScale(prev => Math.max(0.4, Number((prev - 0.1).toFixed(2))))}
              title="Zoom out"
              className="p-1 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-zinc-700 font-bold min-w-[38px] text-center">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomScale(prev => Math.min(1.4, Number((prev + 0.1).toFixed(2))))}
              title="Zoom in"
              className="p-1 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomScale(0.85)}
              className="text-[10px] text-zinc-500 hover:text-zinc-900 font-semibold px-1 rounded cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE: CONFIG DRAWER + LIVE PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start print:hidden">
        {/* Settings Drawer */}
        {showConfigDrawer && (
          <div className="lg:col-span-4 sticky top-4 print:hidden">
            <CountSheetConfigPanel
              config={config}
              onUpdateConfig={handleUpdateConfig}
              presets={presets}
              onSelectPreset={handleSelectPreset}
              onSaveNewPreset={handleSaveNewPreset}
              onDeletePreset={handleDeletePreset}
              onResetToDefaults={handleResetToDefaults}
            />
          </div>
        )}

        {/* Live Sheet Preview Container */}
        <div
          className={`${
            showConfigDrawer ? 'lg:col-span-8' : 'lg:col-span-12'
          } flex flex-col items-center justify-center p-6 bg-zinc-200/70 rounded-xl border border-zinc-300/80 overflow-x-auto print:hidden`}
        >
          {pages.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 max-w-md">
              <FileSpreadsheet className="w-12 h-12 mx-auto text-zinc-300 mb-3" />
              {selectedLocatorsArray.length === 0 ? (
                <>
                  <p className="font-bold text-sm text-zinc-800">No Locators Selected for Printing</p>
                  <p className="text-xs text-zinc-400 mt-1 mb-4">
                    All locators are currently unchecked. Please check one or more locators in the FILTER LOCATOR panel above to preview and print Count Sheets.
                  </p>
                  <button
                    type="button"
                    onClick={handleSelectAllLocators}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>SELECT ALL LOCATORS</span>
                  </button>
                </>
              ) : (
                <>
                  <p className="font-bold text-sm text-zinc-800">No items found for the selected locators.</p>
                  <p className="text-xs text-zinc-400 mt-1">Please check your inventory items or import an Excel file.</p>
                </>
              )}
            </div>
          ) : viewMode === 'single' ? (
            // Single page view
            <div className="flex flex-col items-center">
              <div className="mb-2 text-xs font-bold text-zinc-600">
                Sheet {pages[activePageIndex].globalPageIndex} of {pages[activePageIndex].totalGlobalPages} — Locator:{' '}
                <span className="font-mono text-zinc-900 font-black">
                  {pages[activePageIndex].locator}
                </span>{' '}
                (Page {pages[activePageIndex].pageNumber} of {pages[activePageIndex].totalPagesForLocator})
              </div>
              <div className="shadow-xl rounded-xs">
                <CountSheetPage
                  pageData={pages[activePageIndex]}
                  config={config}
                  session={session}
                  scale={zoomScale}
                  isPrint={false}
                />
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            // Grid layout
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-5xl justify-items-center">
              {pages.map((p, idx) => (
                <div key={`grid-${idx}`} className="flex flex-col items-center">
                  <span className="text-[11px] font-bold text-zinc-600 mb-1">
                    Sheet {p.globalPageIndex} — {p.locator} (P.{p.pageNumber}/{p.totalPagesForLocator})
                  </span>
                  <div
                    className="shadow-lg rounded-xs cursor-pointer hover:ring-2 hover:ring-emerald-500 transition-all"
                    onClick={() => {
                      setActivePageIndex(idx);
                      setViewMode('single');
                    }}
                  >
                    <CountSheetPage
                      pageData={p}
                      config={config}
                      session={session}
                      scale={zoomScale * 0.6}
                      isPrint={false}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Continuous vertical preview (Default)
            <div className="flex flex-col items-center gap-8 w-full">
              {pages.map((p, idx) => (
                <div key={`page-${idx}`} className="flex flex-col items-center">
                  <div className="mb-1 text-[11px] font-bold text-zinc-500 flex items-center gap-2">
                    <span>Sheet {p.globalPageIndex} of {p.totalGlobalPages}</span>
                    <span>•</span>
                    <span>Locator: <strong className="text-zinc-800">{p.locator}</strong></span>
                    <span>•</span>
                    <span>{p.items.length} items</span>
                  </div>
                  <div className="shadow-xl rounded-xs bg-white">
                    <CountSheetPage
                      pageData={p}
                      config={config}
                      session={session}
                      scale={zoomScale}
                      isPrint={false}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. DEDICATED NATIVE PRINT CONTAINER (Hidden on screen, rendered during native print and standalone window) */}
      <div
        id="count-sheet-print-engine"
        ref={printContainerRef}
        className="count-sheet-print-container hidden print:block print:w-full print:m-0 print:p-0"
      >
        {pages.map((p, idx) => (
          <div
            key={`print-page-${idx}`}
            className="count-sheet-print-page page-break bg-white"
            style={{
              width: `${paperDims.widthMm}mm`,
              height: `${paperDims.heightMm}mm`,
              boxSizing: 'border-box',
              margin: '0 auto',
              pageBreakAfter: idx === pages.length - 1 ? 'auto' : 'always',
              breakAfter: idx === pages.length - 1 ? 'auto' : 'page',
            }}
          >
            <CountSheetPage
              pageData={p}
              config={config}
              session={session}
              scale={1}
              isPrint={true}
            />
          </div>
        ))}
      </div>

      {/* 5. RESET PRINT STATUS CONFIRMATION MODAL */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150 print:hidden">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 border border-zinc-200">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">
                Reset Print Status
              </h3>
            </div>
            <p className="text-xs font-semibold text-zinc-800 leading-relaxed mb-2">
              Reset printed status for all locators?
            </p>
            <p className="text-[11px] text-zinc-500 leading-relaxed mb-5">
              This will clear all "PRINTED" indicators for this dataset. Your Excel inventory data, items, and Count Sheet layout settings will not be affected.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200/80 rounded-lg transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleConfirmResetPrintStatus}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                RESET
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
