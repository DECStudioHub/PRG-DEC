import React, { useState, useMemo, useRef } from 'react';
import {
  Printer,
  Download,
  Sparkles,
  Tag,
  Sliders,
  Eye,
  Loader2,
  Maximize2,
  Palette,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';
import {
  InventoryItem,
  InventorySession,
  Module2Config,
  Module2TagType,
  ShelfTagItem,
  YellowTagItem,
  WhiteTagItem,
} from '../../types';
import {
  DEFAULT_MODULE2_CONFIG,
  SAMPLE_SHELF_TAGS,
  SAMPLE_LAYOUT2_TAGS,
} from './constants';
import {
  SAMPLE_YELLOW_TAGS,
  SAMPLE_WHITE_TAGS,
} from '../../utils/module2ExcelService';
import {
  DEFAULT_YELLOW_TAG_PRESET,
  DEFAULT_WHITE_TAG_PRESET,
  DEFAULT_SHELFTAG_PRESETS,
  DEFAULT_PPTAG_PRESETS,
  loadPresetsFromStorage,
} from './fieldDefaults';
import { YellowTagImportTable } from './YellowTagImportTable';
import { WhiteTagImportTable } from './WhiteTagImportTable';
import { TagFieldLayoutEditorTab } from './TagFieldLayoutEditorTab';
import { LayoutColorSetupTab } from './LayoutColorSetupTab';
import { LiveSheetPreviewTab } from './LiveSheetPreviewTab';
import { ShelftagCardRenderer } from './ShelftagCardRenderer';
import { generateShelftagPdf } from '../../utils/shelftagPdfService';
import { computeShelftagSheetLayout } from '../../utils/shelftagLayoutEngine';
import { executeShelftagPrint } from '../../utils/shelftagPrintService';
import { formatBuyPerAndUp, getEffectivePrintItems, getTotalPhysicalCopies } from '../../utils/shelftagExpansion';

interface ShelfTagPPModuleProps {
  items: InventoryItem[];
  session: InventorySession;
  onUpdateItems: (newItems: InventoryItem[]) => void;
  onLoadSampleData: () => void;
  onSwitchToImport: () => void;
}

export const ShelfTagPPModule: React.FC<ShelfTagPPModuleProps> = ({
  items: _m1Items,
  session: _session,
  onUpdateItems: _onUpdateItems,
  onLoadSampleData: _onLoadSampleData,
  onSwitchToImport: _onSwitchToImport,
}) => {
  // Navigation Tabs: 'items' | 'field_editor' | 'layout' | 'preview'
  const [activeTab, setActiveTab] = useState<'items' | 'field_editor' | 'layout' | 'preview'>('items');

  // Active Tag Mode: 'pp_tag' (Yellow Tag) vs 'shelftag' (White Tag)
  const [activeTagType, setActiveTagType] = useState<Module2TagType>('pp_tag');

  // Dedicated data collections for Yellow Tag and White Tag
  const [yellowItems, setYellowItems] = useState<YellowTagItem[]>(SAMPLE_YELLOW_TAGS);
  const [whiteItems, setWhiteItems] = useState<WhiteTagItem[]>(SAMPLE_WHITE_TAGS);

  // Dedicated config for Yellow Tag (85x38mm, 7 fields, yellow palette)
  const [yellowConfig, setYellowConfig] = useState<Module2Config>(() => ({
    ...DEFAULT_MODULE2_CONFIG,
    activeTagType: 'pp_tag',
    tagWidthMm: DEFAULT_YELLOW_TAG_PRESET.tagWidthMm,
    tagHeightMm: DEFAULT_YELLOW_TAG_PRESET.tagHeightMm,
    columns: DEFAULT_YELLOW_TAG_PRESET.columns,
    rowGapMm: DEFAULT_YELLOW_TAG_PRESET.rowGapMm,
    colGapMm: DEFAULT_YELLOW_TAG_PRESET.colGapMm,
    topMarginMm: DEFAULT_YELLOW_TAG_PRESET.topMarginMm,
    sideMarginMm: DEFAULT_YELLOW_TAG_PRESET.sideMarginMm,
    ppTagConfig: DEFAULT_YELLOW_TAG_PRESET,
    ppTagPresets: [DEFAULT_YELLOW_TAG_PRESET, ...DEFAULT_PPTAG_PRESETS],
  }));

  // Dedicated config for White Tag (70x32mm, 6 fields, white background, barcode lines)
  const [whiteConfig, setWhiteConfig] = useState<Module2Config>(() => ({
    ...DEFAULT_MODULE2_CONFIG,
    activeTagType: 'shelftag',
    tagWidthMm: DEFAULT_WHITE_TAG_PRESET.tagWidthMm,
    tagHeightMm: DEFAULT_WHITE_TAG_PRESET.tagHeightMm,
    columns: DEFAULT_WHITE_TAG_PRESET.columns,
    rowGapMm: DEFAULT_WHITE_TAG_PRESET.rowGapMm,
    colGapMm: DEFAULT_WHITE_TAG_PRESET.colGapMm,
    topMarginMm: DEFAULT_WHITE_TAG_PRESET.topMarginMm,
    sideMarginMm: DEFAULT_WHITE_TAG_PRESET.sideMarginMm,
    shelftagConfig: DEFAULT_WHITE_TAG_PRESET,
    shelftagPresets: [DEFAULT_WHITE_TAG_PRESET, ...DEFAULT_SHELFTAG_PRESETS],
  }));

  // Dynamic accessors based on current tag type
  const isYellow = activeTagType === 'pp_tag';
  const config = isYellow ? yellowConfig : whiteConfig;
  const setConfig = isYellow ? setYellowConfig : setWhiteConfig;

  // Transform active items into ShelfTagItem for preview, PDF, and print engine
  // Sorted by Description (A to Z) case-insensitively BEFORE physical copy expansion
  const shelfTagItems: ShelfTagItem[] = useMemo(() => {
    if (isYellow) {
      const sorted = [...yellowItems].sort((a, b) =>
        (a.description || '').localeCompare(b.description || '', undefined, {
          sensitivity: 'base',
          numeric: true,
        })
      );
      return sorted.map(y => ({
        id: y.id,
        tagStyle: 'yellow',
        barcode: y.upc,
        description: y.description,
        regularPrice: y.price,
        buyPerAndUp: `${y.buy || 'BUY'} ${y.qty} ${y.uom || 'PCS AND UP'}`,
        priceUnit: y.per,
        copies: y.copies || 1,
        isSelected: y.isSelected !== false,
        // Direct field values for unified renderer
        upc: y.upc,
        buy: y.buy,
        qty: y.qty,
        uom: y.uom,
        price: y.price,
        per: y.per,
      }));
    } else {
      const sorted = [...whiteItems].sort((a, b) =>
        (a.description || '').localeCompare(b.description || '', undefined, {
          sensitivity: 'base',
          numeric: true,
        })
      );
      return sorted.map(w => ({
        id: w.id,
        tagStyle: 'white',
        barcode: w.upc,
        description: w.description,
        regularPrice: w.price,
        sku: w.sku,
        tagDate: w.date,
        copies: w.copies || 1,
        isSelected: w.isSelected !== false,
        // Direct field values
        upc: w.upc,
        date: w.date,
        price: w.price,
      }));
    }
  }, [isYellow, yellowItems, whiteItems]);

  // Selected counts
  const totalCount = isYellow ? yellowItems.length : whiteItems.length;
  const selectedCount = useMemo(
    () => shelfTagItems.filter(i => i.isSelected !== false).length,
    [shelfTagItems]
  );

  // Total physical print copies
  const totalPhysicalCopies = useMemo(() => {
    const selected = shelfTagItems.filter(i => i.isSelected !== false);
    return getTotalPhysicalCopies(selected, config.layoutOption);
  }, [shelfTagItems, config.layoutOption]);

  // Filtered printable items expanded by individual SKU copy quantity
  const effectivePrintItems = useMemo(() => {
    const selected = shelfTagItems.filter(i => i.isSelected !== false);
    return getEffectivePrintItems(selected, config.layoutOption);
  }, [shelfTagItems, config.layoutOption]);

  // Compute live sheet layout for printing and preview
  const sheetLayout = useMemo(() => {
    return computeShelftagSheetLayout(config, effectivePrintItems.length);
  }, [config, effectivePrintItems.length]);

  // Partition printable items into page chunks for multi-page print document
  const allPagesChunks = useMemo(() => {
    const chunks: ShelfTagItem[][] = [];
    const perSheet = sheetLayout.tagsPerSheet || 1;
    for (let i = 0; i < effectivePrintItems.length; i += perSheet) {
      chunks.push(effectivePrintItems.slice(i, i + perSheet));
    }
    if (chunks.length === 0) chunks.push([]);
    return chunks;
  }, [effectivePrintItems, sheetLayout.tagsPerSheet]);

  const printContainerRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Top header print & export handlers
  const handlePrintSheet = () => {
    if (effectivePrintItems.length === 0) {
      alert('Please select at least one tag to print.');
      return;
    }
    const container = printContainerRef.current || document.getElementById('shelftag-print-container');
    executeShelftagPrint(container, sheetLayout);
  };

  const handleExportPdf = async () => {
    if (effectivePrintItems.length === 0) {
      alert('Please select at least one tag to export as PDF.');
      return;
    }

    try {
      setIsExportingPdf(true);
      const pdf = await generateShelftagPdf(
        effectivePrintItems,
        config,
        undefined,
        isYellow ? 'yellow' : 'white'
      );
      pdf.save(`PRG-${isYellow ? 'YellowTag' : 'WhiteShelfTag'}-${Date.now()}.pdf`);
    } catch (err: any) {
      console.error(err);
      alert('Failed to generate PDF: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Top Header Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-zinc-200 shadow-2xs print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 text-xs font-black uppercase tracking-wider rounded-md bg-amber-400 text-zinc-950">
                MODULE 2 • v2.0.3
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
                <span>🏷️</span>
                <span>Shelftag / PP Tag Printing Workflow</span>
              </h1>
            </div>
            <p className="text-xs text-zinc-600 max-w-3xl leading-relaxed">
              Unified retail tag printing with physical millimeter precision. Seamlessly switch between Yellow Promo Tags (7 fields) and White ShelfTags (6 fields with barcode).
            </p>
          </div>

          {/* Top Right: Tag Mode Toggle & Quick Print Actions */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center shrink-0">
            {/* Tag Mode Selector Toggle */}
            <div className="inline-flex rounded-xl border border-zinc-300 p-1 bg-zinc-100 shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTagType('pp_tag')}
                className={`px-3.5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                  isYellow
                    ? 'bg-amber-400 text-zinc-950 shadow-xs border border-amber-500 ring-2 ring-amber-300/50'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50'
                }`}
              >
                <span>🟡</span>
                <span>Yellow Tag (PP Tag)</span>
                {isYellow && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 font-bold">
                    85×38mm
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTagType('shelftag')}
                className={`px-3.5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                  !isYellow
                    ? 'bg-zinc-900 text-white shadow-xs ring-2 ring-zinc-500/50'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50'
                }`}
              >
                <span>⚪</span>
                <span>White Tag (ShelfTag)</span>
                {!isYellow && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 font-bold">
                    70×32mm
                  </span>
                )}
              </button>
            </div>

            {/* Print & PDF Action Buttons */}
            <button
              type="button"
              onClick={handlePrintSheet}
              disabled={effectivePrintItems.length === 0}
              className="px-4 py-2 bg-zinc-900 hover:bg-black disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
              title="Direct Physical Print Sheet"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Print ({totalPhysicalCopies})</span>
            </button>

            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf || effectivePrintItems.length === 0}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-zinc-950 font-black text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
              title="Download Printable PDF Document"
            >
              {isExportingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* 5-Step Retail Workflow Navigation */}
        <div className="mt-6 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            {/* Step 1: Tag Selection Indicator / Button */}
            <div className="pb-3 px-2 sm:px-3 text-xs font-black flex items-center gap-1.5 border-b-2 border-transparent text-zinc-600 bg-zinc-50 rounded-t-lg">
              <Tag className="w-3.5 h-3.5 text-amber-600" />
              <span>1. Tag:</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-black ${isYellow ? 'bg-amber-400 text-zinc-950' : 'bg-zinc-900 text-white'}`}>
                {isYellow ? '🟡 Yellow Tag' : '⚪ White Tag'}
              </span>
            </div>

            {/* Step 2: Data & Import */}
            <button
              type="button"
              onClick={() => setActiveTab('items')}
              className={`pb-3 px-2 sm:px-3 text-xs font-black flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'items'
                  ? 'border-amber-500 text-zinc-950'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
              <span>2. Data & Import ({totalCount})</span>
            </button>

            {/* Step 3: Field Layout Visual Editor */}
            <button
              type="button"
              onClick={() => setActiveTab('field_editor')}
              className={`pb-3 px-2 sm:px-3 text-xs font-black flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'field_editor'
                  ? 'border-amber-500 text-zinc-950'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-amber-600" />
              <span>3. Field Layout Editor</span>
            </button>

            {/* Step 4: Sheet & Margin Setup */}
            <button
              type="button"
              onClick={() => setActiveTab('layout')}
              className={`pb-3 px-2 sm:px-3 text-xs font-black flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'layout'
                  ? 'border-amber-500 text-zinc-950'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300'
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-amber-600" />
              <span>4. Paper & Sheet Setup</span>
            </button>

            {/* Step 5: Live Sheet Preview & Print */}
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`pb-3 px-2 sm:px-3 text-xs font-black flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'preview'
                  ? 'border-amber-500 text-zinc-950'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-amber-600" />
              <span>5. Live Preview & Print</span>
            </button>
          </div>

          {/* Right Status Indicator */}
          <div className="pb-3 text-xs font-bold text-zinc-700 flex items-center gap-3">
            <span>
              Selected SKUs:{' '}
              <strong className="text-zinc-900 font-extrabold">
                {selectedCount} / {totalCount}
              </strong>
            </span>
            <span>•</span>
            <span>
              Total Physical Tags:{' '}
              <strong className="text-amber-700 font-black">
                {totalPhysicalCopies}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="print:m-0">
        {/* Tab 1: Dedicated Import Table based on Active Tag Type */}
        {activeTab === 'items' && (
          isYellow ? (
            <YellowTagImportTable
              items={yellowItems}
              setItems={setYellowItems}
              onUpdateItems={setYellowItems}
              onLoadSampleData={() => setYellowItems(SAMPLE_YELLOW_TAGS)}
              onClearData={() => setYellowItems([])}
              onSwitchToWhite={() => setActiveTagType('shelftag')}
            />
          ) : (
            <WhiteTagImportTable
              items={whiteItems}
              setItems={setWhiteItems}
              onUpdateItems={setWhiteItems}
              onLoadSampleData={() => setWhiteItems(SAMPLE_WHITE_TAGS)}
              onClearData={() => setWhiteItems([])}
              onSwitchToYellow={() => setActiveTagType('pp_tag')}
            />
          )
        )}

        {/* Tab 2: Visual Layout & Field Property Editor */}
        {activeTab === 'field_editor' && (
          <TagFieldLayoutEditorTab
            config={config}
            setConfig={setConfig}
            activeTagType={activeTagType}
            setActiveTagType={setActiveTagType}
            sampleWhiteItem={shelfTagItems.find(i => i.tagStyle === 'white')}
            sampleYellowItem={shelfTagItems.find(i => i.tagStyle === 'yellow')}
          />
        )}

        {/* Tab 3: Sheet Paper & Millimeter Margins */}
        {activeTab === 'layout' && (
          <LayoutColorSetupTab
            config={config}
            setConfig={setConfig}
            availableItems={shelfTagItems}
            sampleWhiteItem={shelfTagItems.find(i => i.tagStyle === 'white')}
            sampleYellowItem={shelfTagItems.find(i => i.tagStyle === 'yellow')}
          />
        )}

        {/* Tab 4: Live Sheet Preview with 1:1 Rendering */}
        {activeTab === 'preview' && (
          <LiveSheetPreviewTab
            items={shelfTagItems}
            config={config}
            onDirectPrint={handlePrintSheet}
          />
        )}
      </div>

      {/* Multi-Page Browser Print Container */}
      <div
        id="shelftag-print-container"
        ref={printContainerRef}
        className="shelftag-print-container hidden print:block print:w-full print:m-0 print:p-0"
      >
        {allPagesChunks.map((chunk, pageIdx) => (
          <div
            key={`shelftag-print-page-${pageIdx}`}
            className="shelftag-print-page bg-white"
            style={{
              width: `${sheetLayout.paperWidthMm}mm`,
              height: `${sheetLayout.paperHeightMm}mm`,
              paddingTop: `${sheetLayout.topMarginMm}mm`,
              paddingBottom: `${sheetLayout.bottomMarginMm}mm`,
              paddingLeft: `${sheetLayout.effectiveLeftMarginMm}mm`,
              paddingRight: `${sheetLayout.rightMarginMm}mm`,
              boxSizing: 'border-box',
              position: 'relative',
              overflow: 'hidden',
              pageBreakAfter: pageIdx < allPagesChunks.length - 1 ? 'always' : 'auto',
              breakAfter: pageIdx < allPagesChunks.length - 1 ? 'page' : 'auto',
              pageBreakInside: 'avoid',
              breakInside: 'avoid',
            }}
          >
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${sheetLayout.columns}, ${sheetLayout.tagWidthMm}mm)`,
                columnGap: `${sheetLayout.colGapMm}mm`,
                rowGap: `${sheetLayout.rowGapMm}mm`,
                width: 'fit-content',
              }}
            >
              {chunk.map(item => (
                <div
                  key={`tag-print-${item.id}`}
                  style={{
                    width: `${sheetLayout.tagWidthMm}mm`,
                    height: `${sheetLayout.tagHeightMm}mm`,
                    overflow: 'hidden',
                  }}
                >
                  <ShelftagCardRenderer
                    item={item}
                    config={config}
                    scale={1}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
