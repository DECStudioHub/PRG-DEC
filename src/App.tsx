import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Step1Import } from './components/Step1Import';
import { Step2Validate } from './components/Step2Validate';
import { Step3Configure } from './components/Step3Configure';
import { Step4Preview } from './components/Step4Preview';
import { SettingsTab } from './components/SettingsTab';
import { StandalonePrintView } from './components/StandalonePrintView';
import { CountSheetGenerator } from './components/countSheet/CountSheetGenerator';
import {
  InventoryItem,
  ValidationSummary,
  LayoutConfig,
  InventorySession,
  AppStep,
  SystemSettings,
  AppModuleId,
} from './types';
import { DEMO_ITEMS, revalidateItems } from './utils/excelParser';
import {
  DEFAULT_SYSTEM_SETTINGS,
  DEFAULT_PRINCE_LOGO,
  getEffectiveLogoUrl,
  getPaletteTheme,
  applyThemeToDocument,
} from './utils/theme';
import { ShelfTagPPModule } from './components/module2/ShelfTagPPModule';
import { WelcomeModal } from './components/WelcomeModal';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { CreditContributionModal } from './components/CreditContributionModal';

const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
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
};

const DEFAULT_SESSION: InventorySession = {
  branch: 'Main Distribution Hub',
  store: 'Store #01 - Retail',
  inventoryDate: new Date().toISOString().slice(0, 10),
  preparedBy: 'Inventory Lead',
  sessionNotes: '',
};

export default function App() {
  const [activeModule, setActiveModule] = useState<AppModuleId>(() => {
    try {
      const saved = localStorage.getItem('inv_active_module');
      if (saved === 'count_tag' || saved === 'shelftag_pp') {
        return saved;
      }
    } catch {}
    return 'count_tag';
  });

  const [isPrintMode, setIsPrintMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.location.search.includes('mode=print');
    }
    return false;
  });

  const [items, setItems] = useState<InventoryItem[]>(() => {
    try {
      const savedItems = localStorage.getItem('inv_items');
      if (savedItems) {
        const parsedItems: InventoryItem[] = JSON.parse(savedItems);
        if (Array.isArray(parsedItems) && parsedItems.length > 0) {
          return parsedItems;
        }
      }
    } catch (e) {
      console.warn('Could not restore items in init:', e);
    }
    return [];
  });

  const [filename, setFilename] = useState<string>(() => {
    try {
      return localStorage.getItem('inv_filename') || '';
    } catch {
      return '';
    }
  });

  const [config, setConfig] = useState<LayoutConfig>(() => {
    try {
      const savedConfig = localStorage.getItem('inv_config');
      if (savedConfig) {
        return { ...DEFAULT_LAYOUT_CONFIG, ...JSON.parse(savedConfig) };
      }
    } catch {}
    return DEFAULT_LAYOUT_CONFIG;
  });

  const [session, setSession] = useState<InventorySession>(() => {
    try {
      const savedSession = localStorage.getItem('inv_session');
      if (savedSession) {
        return { ...DEFAULT_SESSION, ...JSON.parse(savedSession) };
      }
    } catch {}
    return DEFAULT_SESSION;
  });

  const [settings, setSettings] = useState<SystemSettings>(() => {
    try {
      const savedSettings = localStorage.getItem('inv_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        const isLegacyTitle =
          !parsed.systemName ||
          parsed.systemName === 'PRG SHELFTAG & BARCODE GENERATOR' ||
          parsed.systemName === 'SHELF TAG';
        const isLegacySubtitle =
          !parsed.systemSubtitle ||
          parsed.systemSubtitle === 'Count Tags, Shelf Tags & PP Tags' ||
          parsed.systemSubtitle === 'Excel to Printable Barcode Tags';

        return {
          ...DEFAULT_SYSTEM_SETTINGS,
          ...parsed,
          systemName: isLegacyTitle ? 'DEC' : parsed.systemName,
          systemTagline: isLegacyTitle ? 'Digital Efficiency & Continuity System' : (parsed.systemTagline || 'Digital Efficiency & Continuity System'),
          systemSubtitle: isLegacySubtitle ? 'Backup • Continuity • Alternative Process • Process Improvement' : parsed.systemSubtitle,
          customLogoUrl: getEffectiveLogoUrl(parsed.customLogoUrl),
        };
      }
    } catch {}
    return DEFAULT_SYSTEM_SETTINGS;
  });

  const [summary, setSummary] = useState<ValidationSummary>(() => {
    try {
      const savedItems = localStorage.getItem('inv_items');
      if (savedItems) {
        const parsedItems: InventoryItem[] = JSON.parse(savedItems);
        if (Array.isArray(parsedItems) && parsedItems.length > 0) {
          return revalidateItems(parsedItems);
        }
      }
    } catch {}
    return {
      totalRows: 0,
      validItems: 0,
      warningItems: 0,
      errorItems: 0,
      issues: [],
      missingRequiredColumns: [],
      duplicateSKUs: [],
      duplicateUPCs: [],
    };
  });

  const [currentStep, setCurrentStep] = useState<AppStep>(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('mode=print')) {
      return 'preview';
    }
    try {
      const savedItems = localStorage.getItem('inv_items');
      if (savedItems) {
        const parsed = JSON.parse(savedItems);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return 'validate';
        }
      }
    } catch {}
    return 'import';
  });

  const [showWelcome, setShowWelcome] = useState<boolean>(() => {
    try {
      return localStorage.getItem('prg_hide_welcome') !== 'true';
    } catch {
      return true;
    }
  });

  const [showBackupModal, setShowBackupModal] = useState<boolean>(false);
  const [showCreditModal, setShowCreditModal] = useState<boolean>(false);

  // Load initial state from local storage if available
  useEffect(() => {
    try {
      const savedItems = localStorage.getItem('inv_items');
      const savedFilename = localStorage.getItem('inv_filename');
      const savedConfig = localStorage.getItem('inv_config');
      const savedSession = localStorage.getItem('inv_session');
      const savedSettings = localStorage.getItem('inv_settings');

      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSettings(prev => ({ ...prev, ...parsed }));
        } catch (e) {
          console.warn('Could not restore settings:', e);
        }
      }

      if (savedItems) {
        const parsedItems: InventoryItem[] = JSON.parse(savedItems);
        if (Array.isArray(parsedItems) && parsedItems.length > 0) {
          setItems(parsedItems);
          const revalidated = revalidateItems(parsedItems);
          setSummary(revalidated);
          if (savedFilename) setFilename(savedFilename);
          if (!window.location.search.includes('mode=print')) {
            setCurrentStep('validate');
          }
        }
      }

      if (savedConfig) {
        setConfig(prev => ({ ...prev, ...JSON.parse(savedConfig) }));
      }
      if (savedSession) {
        setSession(prev => ({ ...prev, ...JSON.parse(savedSession) }));
      }
    } catch (e) {
      console.warn('Could not restore from localStorage:', e);
    }
  }, []);

  // Update theme colors and document title whenever settings change
  useEffect(() => {
    const theme = getPaletteTheme(settings.paletteId, settings.customPrimaryColor);
    applyThemeToDocument(theme);
    if (typeof document !== 'undefined') {
      document.title = `${settings.systemName || 'SHELF TAG'} - Inventory Shelf Tag System`;
    }
  }, [settings]);

  // Handlers
  const handleDataLoaded = (newItems: InventoryItem[], newSummary: ValidationSummary, newFilename: string) => {
    setItems(newItems);
    setSummary(newSummary);
    setFilename(newFilename);
    setCurrentStep('validate');

    try {
      localStorage.setItem('inv_items', JSON.stringify(newItems));
      localStorage.setItem('inv_filename', newFilename);
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  };

  const handleUpdateItems = (newItems: InventoryItem[], newSummary: ValidationSummary) => {
    setItems(newItems);
    setSummary(newSummary);

    try {
      localStorage.setItem('inv_items', JSON.stringify(newItems));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  };

  const handleUpdateConfig = (newConfig: LayoutConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem('inv_config', JSON.stringify(newConfig));
    } catch (e) {
      console.warn('Failed to save config:', e);
    }
  };

  const handleUpdateSession = (newSession: InventorySession) => {
    setSession(newSession);
    try {
      localStorage.setItem('inv_session', JSON.stringify(newSession));
    } catch (e) {
      console.warn('Failed to save session:', e);
    }
  };

  const handleUpdateSettings = (newSettings: SystemSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('inv_settings', JSON.stringify(newSettings));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }

    // If sync logo to tags is active, update config logo
    if (newSettings.applyLogoToShelfTags && newSettings.customLogoUrl) {
      handleUpdateConfig({
        ...config,
        logoUrl: newSettings.customLogoUrl,
        showLogo: true,
      });
    }
  };

  const handleResetData = () => {
    setItems([]);
    setFilename('');
    setSummary({
      totalRows: 0,
      validItems: 0,
      warningItems: 0,
      errorItems: 0,
      issues: [],
      missingRequiredColumns: [],
      duplicateSKUs: [],
      duplicateUPCs: [],
    });
    setCurrentStep('import');
    try {
      localStorage.removeItem('inv_items');
      localStorage.removeItem('inv_filename');
    } catch (e) {
      console.warn('Error clearing localStorage:', e);
    }
  };

  const handleLoadSampleData = () => {
    const sampleItems = DEMO_ITEMS;
    setItems(sampleItems);
    const revalidated = revalidateItems(sampleItems);
    setSummary(revalidated);
    setFilename('Sample_Supermarket_Inventory.xlsx');

    try {
      localStorage.setItem('inv_items', JSON.stringify(sampleItems));
      localStorage.setItem('inv_filename', 'Sample_Supermarket_Inventory.xlsx');
    } catch (e) {
      console.warn('Failed to save sample demo items:', e);
    }

    setCurrentStep('validate');
  };

  const handleResetLayout = () => {
    const resetConfig: LayoutConfig = {
      ...DEFAULT_LAYOUT_CONFIG,
      logoUrl:
        settings.applyLogoToShelfTags && settings.customLogoUrl
          ? settings.customLogoUrl
          : DEFAULT_LAYOUT_CONFIG.logoUrl,
    };
    setConfig(resetConfig);
    try {
      localStorage.setItem('inv_config', JSON.stringify(resetConfig));
    } catch (e) {
      console.warn('Failed to save config:', e);
    }
  };

  const handleFactoryReset = () => {
    try {
      localStorage.clear();
    } catch (e) {
      console.warn('Error clearing all localStorage:', e);
    }

    setItems([]);
    setFilename('');
    setSummary({
      totalRows: 0,
      validItems: 0,
      warningItems: 0,
      errorItems: 0,
      issues: [],
      missingRequiredColumns: [],
      duplicateSKUs: [],
      duplicateUPCs: [],
    });
    setConfig(DEFAULT_LAYOUT_CONFIG);
    setSession(DEFAULT_SESSION);
    setSettings(DEFAULT_SYSTEM_SETTINGS);
    setCurrentStep('import');
  };

  const handleSelectModule = (mod: AppModuleId) => {
    setActiveModule(mod);
    try {
      localStorage.setItem('inv_active_module', mod);
    } catch (e) {
      console.warn('Failed to save active module:', e);
    }
  };

  // If in standalone print mode, render clean print view
  if (isPrintMode) {
    return (
      <StandalonePrintView
        initialItems={items}
        initialConfig={config}
        initialSession={session}
        settings={settings}
      />
    );
  }

  const selectedCount = items.filter(it => it.isSelected !== false).length;

  return (
    <div className="min-h-screen bg-zinc-100/70 text-zinc-900 flex flex-col font-sans print:block print:min-h-0 print:h-auto print:bg-white print:m-0 print:p-0">
      <Navbar
        activeModule={activeModule}
        onSelectModule={handleSelectModule}
        currentStep={currentStep}
        onSelectStep={step => setCurrentStep(step)}
        itemCount={items.length}
        selectedCount={selectedCount}
        session={session}
        settings={settings}
        onReset={handleResetData}
        onOpenWelcome={() => setShowWelcome(true)}
        onOpenBackup={() => setShowBackupModal(true)}
        onOpenCredits={() => setShowCreditModal(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 print:block print:p-0 print:m-0 print:max-w-none print:w-full">
        {currentStep === 'settings' ? (
          <SettingsTab
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            config={config}
            onUpdateConfig={handleUpdateConfig}
            items={items}
            onResetData={handleResetData}
            onLoadSampleData={handleLoadSampleData}
            onResetLayout={handleResetLayout}
            onFactoryReset={handleFactoryReset}
            onNavigateToStep={step => setCurrentStep(step)}
          />
        ) : activeModule === 'shelftag_pp' ? (
          <ShelfTagPPModule
            items={items}
            session={session}
            onUpdateItems={newItems => {
              const revalidated = revalidateItems(newItems);
              handleUpdateItems(newItems, revalidated);
            }}
            onLoadSampleData={handleLoadSampleData}
            onSwitchToImport={() => {
              setActiveModule('count_tag');
              setCurrentStep('import');
            }}
          />
        ) : (
          <>
            {currentStep === 'import' && (
              <Step1Import
                onDataLoaded={handleDataLoaded}
                session={session}
                settings={settings}
                onUpdateSession={handleUpdateSession}
              />
            )}

            {currentStep === 'validate' && (
              <Step2Validate
                items={items}
                summary={summary}
                filename={filename}
                onUpdateItems={handleUpdateItems}
                onContinue={() => setCurrentStep('configure')}
                onGenerateCountSheet={() => setCurrentStep('count_sheet')}
                onBackToImport={() => setCurrentStep('import')}
              />
            )}

            {currentStep === 'configure' && (
              <Step3Configure
                config={config}
                onUpdateConfig={handleUpdateConfig}
                selectedItems={items.filter(it => it.isSelected !== false)}
                onGenerateLayout={() => setCurrentStep('preview')}
                onBack={() => setCurrentStep('validate')}
              />
            )}

            {currentStep === 'preview' && (
              <Step4Preview
                items={items}
                config={config}
                session={session}
                settings={settings}
                onBackToConfig={() => setCurrentStep('configure')}
              />
            )}

            {currentStep === 'count_sheet' && (
              <CountSheetGenerator
                items={items}
                session={session}
                settings={settings}
                onBackToValidate={() => setCurrentStep('validate')}
                onSwitchToCountTags={() => setCurrentStep('configure')}
              />
            )}
          </>
        )}
      </main>

      {/* Application UI Footer */}
      <footer className="w-full border-t border-zinc-200/80 bg-white/80 backdrop-blur-xs py-3.5 px-4 text-center print:hidden mt-auto">
        <p className="text-xs font-medium text-zinc-500 tracking-tight select-none">
          Powered by DECStudioAiCreation
        </p>
      </footer>

      {/* Startup & Help Welcome UI Modal */}
      <WelcomeModal
        isOpen={showWelcome}
        onClose={() => setShowWelcome(false)}
        onLoadDemoData={handleLoadSampleData}
        onOpenImport={() => {
          setActiveModule('count_tag');
          setCurrentStep('import');
        }}
      />

      {/* Global System Backup & Restore Modal */}
      <BackupRestoreModal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        onRestoreComplete={() => {
          // Trigger re-read from localStorage
          try {
            const savedItems = localStorage.getItem('inv_items');
            if (savedItems) {
              const parsed: InventoryItem[] = JSON.parse(savedItems);
              setItems(parsed);
              setSummary(revalidateItems(parsed));
            }
          } catch {}
        }}
      />

      {/* Credit & Contribution Dedicated Recognition Modal */}
      <CreditContributionModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
      />
    </div>
  );
}
