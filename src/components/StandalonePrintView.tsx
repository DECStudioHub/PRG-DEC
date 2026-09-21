import React, { useEffect, useMemo, useState } from 'react';
import { Printer, ArrowLeft, X, RefreshCw } from 'lucide-react';
import { InventoryItem, LayoutConfig, InventorySession, SystemSettings } from '../types';
import { DEFAULT_PRINCE_LOGO } from '../utils/theme';
import { ShelfTag } from './ShelfTag';
import { packCountTagPages } from '../utils/countTagLayoutEngine';

interface StandalonePrintViewProps {
  initialItems?: InventoryItem[];
  initialConfig?: LayoutConfig;
  initialSession?: InventorySession;
  settings?: SystemSettings;
}

export const StandalonePrintView: React.FC<StandalonePrintViewProps> = ({
  initialItems,
  initialConfig,
  initialSession,
}) => {
  const [items, setItems] = useState<InventoryItem[]>(() => {
    if (initialItems && initialItems.length > 0) return initialItems;
    try {
      const saved = localStorage.getItem('inv_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [config, setConfig] = useState<LayoutConfig>(() => {
    if (initialConfig) return initialConfig;
    try {
      const saved = localStorage.getItem('inv_config');
      return saved
        ? JSON.parse(saved)
        : {
            paperSize: 'A4',
            customWidthMm: 210,
            customHeightMm: 297,
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
            barcodeType: 'CODE128',
            barcodeHeightMm: 14,
            fontSizeDesc: 10,
            fontSizeSku: 8.5,
            fontSizeLocator: 10.5,
            fontSizeFields: 7.5,
            printBlankCountFields: true,
            showCutGuides: true,
            showBorders: true,
            showSessionHeader: false,
            headerStyle: 'filled',
            showLogo: true,
            logoUrl: DEFAULT_PRINCE_LOGO,
            logoHeightMm: 6,
            showTagNumber: true,
            countBoxHeightMm: 12,
            countBoxWidthPercent: 94,
            countBoxGapTopMm: 2.5,
            countBoxFontSize: 13,
            countBoxBorderWidth: 2,
            showBarcodeText: true,
            locatorBarcodeEnabled: true,
            locatorBarcodeWidthMm: 42,
            locatorBarcodeHeightMm: 10,
            showLocatorText: true,
          };
    } catch {
      return {
        paperSize: 'A4',
        customWidthMm: 210,
        customHeightMm: 297,
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
        barcodeType: 'CODE128',
        barcodeHeightMm: 14,
        fontSizeDesc: 10,
        fontSizeSku: 8.5,
        fontSizeLocator: 10.5,
        fontSizeFields: 7.5,
        printBlankCountFields: true,
        showCutGuides: true,
        showBorders: true,
        showSessionHeader: false,
        headerStyle: 'filled',
        showLogo: true,
        logoUrl: DEFAULT_PRINCE_LOGO,
        logoHeightMm: 6,
        showTagNumber: true,
        countBoxHeightMm: 12,
        countBoxWidthPercent: 94,
        countBoxGapTopMm: 2.5,
        countBoxFontSize: 13,
        countBoxBorderWidth: 2,
      };
    }
  });

  const [session, setSession] = useState<InventorySession>(() => {
    if (initialSession) return initialSession;
    try {
      const saved = localStorage.getItem('inv_session');
      return saved
        ? JSON.parse(saved)
        : {
            branch: 'Main Distribution Hub',
            store: 'Store #01 - Retail',
            inventoryDate: new Date().toISOString().slice(0, 10),
            preparedBy: 'Inventory Lead',
          };
    } catch {
      return {
        branch: 'Main Distribution Hub',
        store: 'Store #01 - Retail',
        inventoryDate: new Date().toISOString().slice(0, 10),
        preparedBy: 'Inventory Lead',
      };
    }
  });

  const selectedItems = useMemo(() => {
    return items.filter(it => it.isSelected !== false);
  }, [items]);

  // Paper dimensions
  const paperDimensions = useMemo(() => {
    let width = 210;
    let height = 297;
    if (config.paperSize === 'LETTER') {
      width = 215.9;
      height = 279.4;
    } else if (config.paperSize === 'CUSTOM') {
      width = Number(config.customWidthMm) || 210;
      height = Number(config.customHeightMm) || 297;
    }

    if (config.orientation === 'landscape') {
      return { width: height, height: width };
    }
    return { width, height };
  }, [config]);

  // Calculation for tags per page and paper-saving packing
  const { tagsPerPage, packedPages, totalPages } = useMemo(() => {
    const availHeight = paperDimensions.height - config.marginTopMm - config.marginBottomMm;
    const cols = Math.max(1, config.columns);
    const tagH = config.tagHeightMm;
    const gapY = config.gapRowMm;

    const rows = Math.max(1, Math.floor((availHeight + gapY) / (tagH + gapY)));
    const tagsPerPage = Math.max(1, cols * rows);
    const packedPages = packCountTagPages(selectedItems, tagsPerPage);
    const totalPages = Math.max(1, packedPages.length);

    return { tagsPerPage, packedPages, totalPages };
  }, [paperDimensions, config, selectedItems]);

  // Trigger print automatically after load
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        window.print();
      } catch (e) {
        console.warn('Auto print error:', e);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const handlePrint = () => {
    try {
      window.print();
    } catch (e) {
      console.warn('Print trigger error:', e);
    }
  };

  const handleBack = () => {
    window.location.href = window.location.pathname;
  };

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 print:bg-white print:m-0 print:p-0">
      {/* Floating Action Bar (Hidden in Print) */}
      <div className="sticky top-0 z-50 bg-zinc-900 text-white px-4 py-3 shadow-lg border-b border-zinc-800 print:hidden flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Editor
          </button>
          <div>
            <span className="font-bold text-sm text-white">Standalone Print View</span>
            <span className="text-xs text-zinc-400 ml-2 font-mono">
              ({selectedItems.length} tags · {totalPages} sheets · {config.paperSize})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Now (Ctrl+P)
          </button>
        </div>
      </div>

      {/* Sheets Printable Container */}
      <div className="flex flex-col items-center py-8 gap-8 print:p-0 print:m-0 print:gap-0">
        {packedPages.map((pageData, pageIdx) => {
          const pageItems = pageData.items;

          return (
            <div
              key={pageIdx}
              className="bg-white shadow-xl border border-zinc-300 print:shadow-none print:border-none page-break"
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
    </div>
  );
};
