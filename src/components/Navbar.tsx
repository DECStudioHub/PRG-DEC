import React from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  Sliders,
  Printer,
  RotateCcw,
  Tag,
  ExternalLink,
  Settings,
  Layers,
  ClipboardList,
  TableProperties,
  HelpCircle,
  Database,
} from 'lucide-react';
import { AppStep, InventorySession, SystemSettings, AppModuleId } from '../types';
import { getPaletteTheme, DEFAULT_PRINCE_LOGO, PRINCE_LOGO_INLINE_SVG, getEffectiveLogoUrl } from '../utils/theme';
import { VersionBadge } from './VersionBadge';

interface NavbarProps {
  activeModule: AppModuleId;
  onSelectModule: (module: AppModuleId) => void;
  currentStep: AppStep;
  onSelectStep: (step: AppStep) => void;
  itemCount: number;
  selectedCount: number;
  session: InventorySession;
  settings: SystemSettings;
  onReset: () => void;
  onOpenWelcome?: () => void;
  onOpenBackup?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeModule,
  onSelectModule,
  currentStep,
  onSelectStep,
  itemCount,
  selectedCount,
  session,
  settings,
  onReset,
  onOpenWelcome,
  onOpenBackup,
}) => {
  const activeTheme = getPaletteTheme(settings.paletteId, settings.customPrimaryColor);

  const module1Steps: { id: AppStep; label: string; number: number; icon: any }[] = [
    { id: 'import', label: '1. Import Excel', number: 1, icon: FileSpreadsheet },
    { id: 'validate', label: '2. Validate & Edit', number: 2, icon: CheckCircle2 },
    { id: 'configure', label: '3. Configure Layout', number: 3, icon: Sliders },
    { id: 'preview', label: '4. Preview & Print', number: 4, icon: Printer },
  ];

  const getStepStatus = (stepId: AppStep) => {
    const stepOrder: AppStep[] = ['import', 'validate', 'configure', 'preview'];
    const currentIdx = stepOrder.indexOf(currentStep);
    const targetIdx = stepOrder.indexOf(stepId);

    if (currentIdx === targetIdx) return 'current';
    if (targetIdx < currentIdx || (itemCount > 0 && targetIdx <= 2)) return 'accessible';
    return 'disabled';
  };

  return (
    <header className="bg-white border-b border-zinc-200 sticky top-0 z-30 shadow-2xs print:hidden">
      {/* Top Bar: Brand, Module Selector & Global Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo & Name */}
          <div
            onClick={() => {
              if (activeModule === 'count_tag') {
                onSelectStep('import');
              }
            }}
            className="flex items-center gap-3 shrink-0 cursor-pointer group"
            title={`${settings.systemName || 'DEC'} — ${settings.systemTagline || 'Digital Efficiency & Continuity System'}`}
          >
            <div className="w-10 h-10 rounded-lg bg-white border border-zinc-200 shadow-2xs flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105 p-1 shrink-0">
              <img
                src={getEffectiveLogoUrl(settings.customLogoUrl)}
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
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-base sm:text-lg tracking-tight text-zinc-900 group-hover:text-black">
                  {settings.systemName || 'DEC'}
                </span>
                <span
                  className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-sm border transition-colors hidden sm:inline-block"
                  style={{
                    backgroundColor: activeTheme.primaryLight,
                    borderColor: activeTheme.primaryBorder,
                    color: activeTheme.primaryText,
                  }}
                >
                  {settings.systemTagline || 'Digital Efficiency & Continuity System'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 font-medium truncate max-w-[240px] sm:max-w-none">
                {settings.systemSubtitle || 'Backup • Continuity • Alternative Process • Process Improvement'}
              </p>
            </div>
          </div>

          {/* Center: Module Selector */}
          <div className="hidden md:flex items-center p-1 bg-zinc-100/90 rounded-xl border border-zinc-200 shadow-2xs">
            <button
              type="button"
              onClick={() => onSelectModule('count_tag')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeModule === 'count_tag'
                  ? 'bg-white text-zinc-950 shadow-xs ring-1 ring-zinc-200'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>PCOUNT W2W</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectModule('shelftag_pp')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeModule === 'shelftag_pp'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>SHELFTAG / PP TAG</span>
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {itemCount > 0 && (
              <div className="hidden lg:flex items-center gap-2 text-xs bg-zinc-100/80 px-2.5 py-1.5 rounded-lg border border-zinc-200">
                <span className="text-zinc-500 font-medium">Data:</span>
                <span className="font-mono font-bold text-zinc-900">
                  {selectedCount} / {itemCount} items
                </span>
                {session.branch && (
                  <span className="border-l border-zinc-300 pl-2 text-zinc-600 font-medium truncate max-w-[110px]">
                    {session.branch}
                  </span>
                )}
              </div>
            )}

            {/* Interactive System Version Badge & Popover */}
            <VersionBadge />

            {/* System Backup Action */}
            {onOpenBackup && (
              <button
                type="button"
                onClick={onOpenBackup}
                title="System Backup & Restore (JSON)"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden sm:inline">Backup</span>
              </button>
            )}

            {/* Quick Settings Icon Button */}
            <button
              type="button"
              onClick={() => onSelectStep('settings')}
              title="Open System Settings & Customization"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer border ${
                currentStep === 'settings'
                  ? 'text-white border-transparent'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border-zinc-200'
              }`}
              style={{
                backgroundColor: currentStep === 'settings' ? activeTheme.primary : 'transparent',
              }}
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Settings</span>
            </button>

            {/* Welcome / Guide Help Button */}
            {onOpenWelcome && (
              <button
                type="button"
                onClick={onOpenWelcome}
                title="Open System Quick Guide & Overview"
                className="inline-flex items-center justify-center p-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors border border-transparent hover:border-zinc-200 cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-zinc-500" />
              </button>
            )}

            {itemCount > 0 && (
              <button
                type="button"
                onClick={onReset}
                title="Start over with a new Excel file"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors border border-transparent hover:border-zinc-300 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New File</span>
              </button>
            )}

            <a
              href={typeof window !== 'undefined' ? window.location.href : '#'}
              target="_blank"
              rel="noopener noreferrer"
              title="Open full app in a new browser tab (recommended for printing and downloading)"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors border border-transparent hover:border-zinc-300 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Tab</span>
            </a>
          </div>
        </div>

        {/* Mobile Module Selector Bar */}
        <div className="flex md:hidden items-center justify-center pb-3 gap-2 border-t border-zinc-100 pt-2">
          <button
            type="button"
            onClick={() => onSelectModule('count_tag')}
            className={`flex-1 py-1.5 px-2 text-center text-xs font-bold rounded-lg transition-all ${
              activeModule === 'count_tag'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'bg-zinc-100 text-zinc-700'
            }`}
          >
            PCOUNT W2W
          </button>
          <button
            type="button"
            onClick={() => onSelectModule('shelftag_pp')}
            className={`flex-1 py-1.5 px-2 text-center text-xs font-bold rounded-lg transition-all ${
              activeModule === 'shelftag_pp'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'bg-zinc-100 text-zinc-700'
            }`}
          >
            SHELFTAG / PP TAG
          </button>
        </div>

        {/* Count Tag Sub-Navigation: 4-Step Stepper */}
        {activeModule === 'count_tag' && currentStep !== 'settings' && (
          <div className="py-2.5 border-t border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider">
                Count Tag Workflow:
              </span>
            </div>

            <nav className="flex items-center gap-1 overflow-x-auto">
              {module1Steps.map((step, idx) => {
                const status = getStepStatus(step.id);
                const isCurrent = status === 'current';
                const isAccessible = status === 'accessible' || itemCount > 0;
                const Icon = step.icon;

                return (
                  <React.Fragment key={step.id}>
                    {idx > 0 && (
                      <div
                        className="w-3 h-0.5 mx-0.5 transition-colors hidden sm:block"
                        style={{
                          backgroundColor:
                            getStepStatus(module1Steps[idx - 1].id) === 'accessible' || isCurrent
                              ? activeTheme.primary
                              : '#e4e4e7',
                        }}
                      />
                    )}

                    <button
                      type="button"
                      disabled={!isAccessible}
                      onClick={() => onSelectStep(step.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        isCurrent
                          ? 'text-white shadow-xs'
                          : isAccessible
                          ? 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
                          : 'text-zinc-400 cursor-not-allowed opacity-50'
                      }`}
                      style={{
                        backgroundColor: isCurrent ? activeTheme.primary : 'transparent',
                      }}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{step.label}</span>
                    </button>
                  </React.Fragment>
                );
              })}

              {/* Dedicated Count Sheet Generator Action */}
              <div className="border-l border-zinc-200 pl-2 ml-1.5 flex items-center">
                <button
                  type="button"
                  disabled={itemCount === 0}
                  onClick={() => onSelectStep('count_sheet')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    currentStep === 'count_sheet'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : itemCount > 0
                      ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300'
                      : 'text-zinc-400 cursor-not-allowed opacity-50'
                  }`}
                  title="Generate printable Count Sheet form for selling area"
                >
                  <TableProperties className="w-3.5 h-3.5" />
                  <span>Count Sheet</span>
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
