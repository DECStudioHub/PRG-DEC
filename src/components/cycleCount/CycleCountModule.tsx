import React, { useState, useMemo, useEffect } from 'react';
import {
  InventoryItem,
  InventorySession,
  LayoutConfig,
  SystemSettings,
  ValidationSummary,
} from '../../types';
import { CountSheetGenerator } from '../countSheet/CountSheetGenerator';
import { Step3Configure } from '../Step3Configure';
import { Step4Preview } from '../Step4Preview';
import { DEFAULT_PRINCE_LOGO } from '../../utils/theme';
import {
  TableProperties,
  Tag,
  Filter,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Database,
  Printer,
  Sparkles,
  Search,
} from 'lucide-react';

interface CycleCountModuleProps {
  items: InventoryItem[];
  session: InventorySession;
  settings: SystemSettings;
  onUpdateItems: (newItems: InventoryItem[]) => void;
  onLoadSampleData: () => void;
  onDataLoaded: (newItems: InventoryItem[], newFilename: string, summary: ValidationSummary) => void;
  onUpdateSession: (newSession: InventorySession) => void;
  onSwitchToCentralImport: () => void;
}

const DEFAULT_CYCLE_COUNT_CONFIG: LayoutConfig = {
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
  barcodeWidthMm: 42,
  showBarcodeText: true,
  locatorBarcodeEnabled: true,
  locatorBarcodeWidthMm: 42,
  locatorBarcodeHeightMm: 10,
  showLocatorText: true,
  showDeptCode: true,
};

export const CycleCountModule: React.FC<CycleCountModuleProps> = ({
  items,
  session,
  settings,
  onUpdateItems,
  onLoadSampleData,
  onDataLoaded,
  onUpdateSession,
  onSwitchToCentralImport,
}) => {
  // Cycle Count Sub-Tabs: 'sheet' (Count Sheet), 'tags' (Count Tags), 'filter' (Target Audit Selector)
  const [subTab, setSubTab] = useState<'sheet' | 'tags' | 'filter'>(() => {
    try {
      const saved = localStorage.getItem('cycle_count_active_tab');
      if (saved === 'sheet' || saved === 'tags' || saved === 'filter') {
        return saved;
      }
    } catch {}
    return 'sheet';
  });

  // Tag workflow view within 'tags' tab: 'configure' | 'preview'
  const [tagWorkflowStep, setTagWorkflowStep] = useState<'configure' | 'preview'>('preview');

  // Independent Tag Layout Configuration for Cycle Count
  const [cycleTagConfig, setCycleTagConfig] = useState<LayoutConfig>(() => {
    try {
      const saved = localStorage.getItem('inv_config_cycle_count');
      if (saved) {
        return {
          ...DEFAULT_CYCLE_COUNT_CONFIG,
          ...JSON.parse(saved),
        };
      }
    } catch {}
    return DEFAULT_CYCLE_COUNT_CONFIG;
  });

  const handleUpdateCycleTagConfig = (newConfig: LayoutConfig) => {
    setCycleTagConfig(newConfig);
    try {
      localStorage.setItem('inv_config_cycle_count', JSON.stringify(newConfig));
    } catch (e) {
      console.warn('Failed saving cycle count tag config:', e);
    }
  };

  const handleSelectTab = (tab: 'sheet' | 'tags' | 'filter') => {
    setSubTab(tab);
    try {
      localStorage.setItem('cycle_count_active_tab', tab);
    } catch {}
  };

  // Distinct metrics from shared dataset
  const uniqueLocators = useMemo(() => {
    const set = new Set<string>();
    items.forEach(it => {
      const loc = String(it.locator || '').trim().toUpperCase();
      if (loc) set.add(loc);
    });
    return Array.from(set).sort();
  }, [items]);

  const uniqueDepts = useMemo(() => {
    const set = new Set<string>();
    items.forEach(it => {
      const dept = String(it.deptCode || '').trim();
      if (dept) set.add(dept);
    });
    return Array.from(set).sort();
  }, [items]);

  // Selected item count
  const activeSelectedCount = useMemo(() => {
    return items.filter(it => it.isSelected !== false).length;
  }, [items]);

  // Quick department filter within Cycle Count
  const [filterSearch, setFilterSearch] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');

  const filteredItems = useMemo(() => {
    return items.filter(it => {
      if (selectedDeptFilter !== 'ALL' && String(it.deptCode || '').trim() !== selectedDeptFilter) {
        return false;
      }
      if (filterSearch.trim()) {
        const query = filterSearch.toLowerCase().trim();
        const sku = String(it.sku || '').toLowerCase();
        const desc = String(it.description || '').toLowerCase();
        const loc = String(it.locator || '').toLowerCase();
        const dept = String(it.deptCode || '').toLowerCase();
        return sku.includes(query) || desc.includes(query) || loc.includes(query) || dept.includes(query);
      }
      return true;
    });
  }, [items, selectedDeptFilter, filterSearch]);

  // Removed 'No Excel Dataset Imported Yet' design card per user request so CYCLE COUNT view renders directly
  return (
    <div className="space-y-4">
      {/* 1. CYCLE COUNT PRIMARY MODULE HEADER */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <h1 className="text-lg font-black tracking-tight text-zinc-900 uppercase">
              CYCLE COUNT
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-amber-100 text-amber-900 rounded-full border border-amber-300">
              v2.0.7 MODULE
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 rounded-full border border-emerald-300">
              CENTRAL DATASET SHARED
            </span>
          </div>

          <p className="text-xs text-zinc-500 mt-1">
            Periodic inventory audit with continuous multi-locator page-filling to eliminate wasted bond paper.
          </p>

          {/* Central Shared Dataset Status Banner */}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
            <span className="text-zinc-500 font-medium">Shared Dataset:</span>
            <span className="font-mono font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
              {activeSelectedCount} / {items.length} items
            </span>
            <span className="text-zinc-300">•</span>
            <span className="text-zinc-600 font-medium font-mono">
              {uniqueLocators.length} Locators
            </span>
            {uniqueDepts.length > 0 && (
              <>
                <span className="text-zinc-300">•</span>
                <span className="text-zinc-600 font-medium font-mono">
                  {uniqueDepts.length} DEPT Codes
                </span>
              </>
            )}
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl border border-zinc-200 shadow-2xs self-stretch md:self-auto">
          <button
            type="button"
            onClick={() => handleSelectTab('sheet')}
            className={`flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === 'sheet'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200/50'
            }`}
          >
            <TableProperties className="w-3.5 h-3.5" />
            <span>Count Sheet</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${
              subTab === 'sheet' ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-100 text-emerald-800'
            }`}>
              Continuous Fill
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTab('tags')}
            className={`flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === 'tags'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200/50'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Count Tags</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTab('filter')}
            className={`flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === 'filter'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200/50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Target Audit</span>
          </button>
        </div>
      </div>

      {/* 2. SUB-VIEW: CYCLE COUNT SHEET (Continuous Page Filling Active) */}
      {subTab === 'sheet' && (
        <div className="space-y-4">
          <CountSheetGenerator
            items={items}
            session={session}
            settings={settings}
            moduleContext="cycle_count"
            onBackToValidate={() => handleSelectTab('filter')}
            onSwitchToCountTags={() => handleSelectTab('tags')}
          />
        </div>
      )}

      {/* 3. SUB-VIEW: CYCLE COUNT TAGS (Independent Layout Config) */}
      {subTab === 'tags' && (
        <div className="space-y-4">
          {/* Sub-step selector for Count Tags */}
          <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs flex items-center justify-between gap-4 print:hidden">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-700">Cycle Count Tag Mode:</span>
              <span className="text-[10px] text-zinc-500 hidden sm:inline">
                Independent layout configuration (changes do not alter PCOUNT W2W)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTagWorkflowStep('configure')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  tagWorkflowStep === 'configure'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                Layout Setup
              </button>
              <button
                type="button"
                onClick={() => setTagWorkflowStep('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  tagWorkflowStep === 'preview'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                Preview & Print
              </button>
            </div>
          </div>

          {tagWorkflowStep === 'configure' ? (
            <Step3Configure
              config={cycleTagConfig}
              onUpdateConfig={handleUpdateCycleTagConfig}
              selectedItems={items.filter(it => it.isSelected !== false)}
              onGenerateLayout={() => setTagWorkflowStep('preview')}
              onBack={() => handleSelectTab('sheet')}
            />
          ) : (
            <Step4Preview
              items={items}
              config={cycleTagConfig}
              session={session}
              settings={settings}
              onBackToConfig={() => setTagWorkflowStep('configure')}
            />
          )}
        </div>
      )}

      {/* 4. SUB-VIEW: TARGET AUDIT SELECTOR (Quick Locator & Department Selection) */}
      {subTab === 'filter' && (
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
            <div>
              <h2 className="text-base font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-700" />
                Target Items for Cycle Count Audit
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Quickly select which locators or departments to include in this cycle count run.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const updated = items.map(it => ({ ...it, isSelected: true }));
                  onUpdateItems(updated);
                }}
                className="px-2.5 py-1 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-md transition-colors cursor-pointer"
              >
                Select All ({items.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  const updated = items.map(it => ({ ...it, isSelected: false }));
                  onUpdateItems(updated);
                }}
                className="px-2.5 py-1 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-md transition-colors cursor-pointer"
              >
                Deselect All
              </button>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Filter by DEPT CODE:
              </label>
              <select
                value={selectedDeptFilter}
                onChange={e => setSelectedDeptFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-zinc-300 rounded-md bg-white font-medium text-zinc-800"
              >
                <option value="ALL">All Departments ({uniqueDepts.length})</option>
                {uniqueDepts.map(dept => (
                  <option key={dept} value={dept}>
                    DEPT {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Search SKU / Description / Locator:
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-400" />
                <input
                  type="text"
                  value={filterSearch}
                  onChange={e => setFilterSearch(e.target.value)}
                  placeholder="Type to filter..."
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-zinc-300 rounded-md bg-white font-medium"
                />
              </div>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => handleSelectTab('sheet')}
                className="w-full px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-md shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>OPEN CYCLE COUNT SHEET</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Filtered items table preview */}
          <div className="border border-zinc-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-zinc-50 border-b border-zinc-200 sticky top-0 font-bold text-zinc-700">
                <tr>
                  <th className="p-2 w-10 text-center">Include</th>
                  <th className="p-2 w-28">DEPT CODE</th>
                  <th className="p-2 w-32">LOCATOR</th>
                  <th className="p-2 w-28">SKU</th>
                  <th className="p-2">DESCRIPTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {filteredItems.slice(0, 100).map(item => (
                  <tr key={item.id} className="hover:bg-zinc-50">
                    <td className="p-2 text-center">
                      <input
                        type="checkbox"
                        checked={item.isSelected !== false}
                        onChange={e => {
                          const updated = items.map(it =>
                            it.id === item.id ? { ...it, isSelected: e.target.checked } : it
                          );
                          onUpdateItems(updated);
                        }}
                        className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                      />
                    </td>
                    <td className="p-2 font-mono font-bold text-zinc-700">
                      {item.deptCode || '-'}
                    </td>
                    <td className="p-2 font-mono font-bold text-zinc-900">
                      {item.locator || 'UNASSIGNED'}
                    </td>
                    <td className="p-2 font-mono text-zinc-800">
                      {item.sku || '-'}
                    </td>
                    <td className="p-2 font-medium text-zinc-900 truncate max-w-xs">
                      {item.description || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredItems.length > 100 && (
            <p className="text-[11px] text-zinc-400 text-center">
              Showing first 100 of {filteredItems.length} matching items.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
