import React, { useState } from 'react';
import {
  Sliders,
  Plus,
  Save,
  Trash2,
  RotateCcw,
  Check,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertTriangle,
  Info,
} from 'lucide-react';
import {
  Module2Config,
  Module2TagType,
  PaperSize,
  ShelfTagItem,
  TagFieldConfig,
  TagFieldId,
  TagLayoutPreset,
  YellowPaletteId,
} from '../../types';
import { TagFieldVisualEditor } from './TagFieldVisualEditor';
import { TagFieldPropertyPanel } from './TagFieldPropertyPanel';
import {
  createDefaultFieldsForShelftag,
  createDefaultFieldsForPPTag,
  createDefaultYellowTagFields,
  createDefaultWhiteTagFields,
  DEFAULT_SHELFTAG_PRESETS,
  DEFAULT_PPTAG_PRESETS,
  DEFAULT_YELLOW_TAG_PRESET,
  DEFAULT_WHITE_TAG_PRESET,
  savePresetsToStorage,
  saveActivePreset,
} from './fieldDefaults';
import { YELLOW_PALETTES } from './constants';
import { ShelftagCardRenderer } from './ShelftagCardRenderer';
import { computeShelftagSheetLayout } from '../../utils/shelftagLayoutEngine';

interface TagFieldLayoutEditorTabProps {
  config: Module2Config;
  setConfig: React.Dispatch<React.SetStateAction<Module2Config>>;
  activeTagType?: Module2TagType;
  setActiveTagType?: (type: Module2TagType) => void;
  sampleWhiteItem?: ShelfTagItem;
  sampleYellowItem?: ShelfTagItem;
}

export const TagFieldLayoutEditorTab: React.FC<TagFieldLayoutEditorTabProps> = ({
  config,
  setConfig,
  activeTagType: propActiveTagType,
  setActiveTagType: propSetActiveTagType,
  sampleWhiteItem,
  sampleYellowItem,
}) => {
  // Active Tag Type toggle (ShelfTag vs PP Tag)
  const [localActiveTagType, setLocalActiveTagType] = useState<Module2TagType>(
    propActiveTagType || config.activeTagType || 'pp_tag'
  );

  const activeTagType = propActiveTagType || localActiveTagType;
  const setActiveTagType = (t: Module2TagType) => {
    setLocalActiveTagType(t);
    if (propSetActiveTagType) {
      propSetActiveTagType(t);
    }
  };

  // Selected Field for Property Inspector
  const [selectedFieldId, setSelectedFieldId] = useState<TagFieldId>('description');

  // Collapsible Tag & Sheet Dimension controls
  const [showDimensionsCard, setShowDimensionsCard] = useState<boolean>(false);

  // Modal States
  const [showAddPresetModal, setShowAddPresetModal] = useState<boolean>(false);
  const [newPresetName, setNewPresetName] = useState<string>('');
  const [newPresetDesc, setNewPresetDesc] = useState<string>('');

  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Get active preset and presets list based on tag type
  const isShelftag = activeTagType === 'shelftag';
  const defaultPresets = isShelftag
    ? [DEFAULT_WHITE_TAG_PRESET, ...DEFAULT_SHELFTAG_PRESETS]
    : [DEFAULT_YELLOW_TAG_PRESET, ...DEFAULT_PPTAG_PRESETS];

  const currentPresets = isShelftag
    ? config.shelftagPresets || defaultPresets
    : config.ppTagPresets || defaultPresets;

  const currentActivePreset = isShelftag
    ? config.shelftagConfig || currentPresets[0]
    : config.ppTagConfig || currentPresets[0];

  // Helper to update current active preset
  const updateActivePreset = (updater: (prev: TagLayoutPreset) => TagLayoutPreset) => {
    setConfig(prev => {
      const active = isShelftag
        ? prev.shelftagConfig || prev.shelftagPresets?.[0] || defaultPresets[0]
        : prev.ppTagConfig || prev.ppTagPresets?.[0] || defaultPresets[0];

      const updated = updater(active);

      // Keep root config dimensions in sync if it's the active type
      const nextConfig: Module2Config = {
        ...prev,
        activeTagType,
        tagWidthMm: updated.tagWidthMm,
        tagHeightMm: updated.tagHeightMm,
        columns: updated.columns,
        paperSize: updated.paperSize,
        rowGapMm: updated.rowGapMm,
        colGapMm: updated.colGapMm,
        topMarginMm: updated.topMarginMm,
        sideMarginMm: updated.sideMarginMm,
        yellowPalette: updated.yellowPalette,
        currencySymbol: updated.currencySymbol,
        showBorder: updated.showBorder,
        showCutGuides: updated.showCutGuides,
        showLogo: updated.showLogo,
      };

      if (isShelftag) {
        nextConfig.shelftagConfig = updated;
      } else {
        nextConfig.ppTagConfig = updated;
      }

      return nextConfig;
    });
  };

  // Handle Tag Type Switch
  const handleSwitchTagType = (type: Module2TagType) => {
    setActiveTagType(type);
    setConfig(prev => ({ ...prev, activeTagType: type }));
    setSelectedFieldId(type === 'pp_tag' ? 'description' : 'description');
  };

  // Handle Preset Selection (USE PRESET)
  const handleSelectPreset = (presetId: string) => {
    const found = currentPresets.find(p => p.id === presetId);
    if (!found) return;

    setConfig(prev => {
      const nextConfig: Module2Config = {
        ...prev,
        tagWidthMm: found.tagWidthMm,
        tagHeightMm: found.tagHeightMm,
        columns: found.columns,
        paperSize: found.paperSize,
        rowGapMm: found.rowGapMm,
        colGapMm: found.colGapMm,
        topMarginMm: found.topMarginMm,
        sideMarginMm: found.sideMarginMm,
        yellowPalette: found.yellowPalette,
        currencySymbol: found.currencySymbol,
        showBorder: found.showBorder,
        showCutGuides: found.showCutGuides,
        showLogo: found.showLogo,
      };

      if (isShelftag) {
        nextConfig.shelftagConfig = found;
      } else {
        nextConfig.ppTagConfig = found;
      }

      return nextConfig;
    });

    showToast(`Preset "${found.name}" loaded successfully.`);
  };

  // Update Active Preset (UPDATE PRESET)
  const handleUpdateCurrentPreset = () => {
    const updatedPresets = currentPresets.map(p => {
      if (p.id === currentActivePreset.id) {
        return {
          ...currentActivePreset,
          isBuiltIn: p.isBuiltIn, // preserve built-in flag
        };
      }
      return p;
    });

    setConfig(prev => {
      const next = { ...prev };
      if (isShelftag) {
        next.shelftagPresets = updatedPresets;
        next.shelftagConfig = currentActivePreset;
        savePresetsToStorage('shelftag', updatedPresets);
      } else {
        next.ppTagPresets = updatedPresets;
        next.ppTagConfig = currentActivePreset;
        savePresetsToStorage('pp_tag', updatedPresets);
      }
      return next;
    });

    showToast(`Preset "${currentActivePreset.name}" updated and saved.`);
  };

  // Add New Preset (ADD PRESET)
  const handleAddNewPreset = () => {
    if (!newPresetName.trim()) return;

    const newId = `${activeTagType}-custom-${Date.now()}`;
    const newPreset: TagLayoutPreset = {
      ...currentActivePreset,
      id: newId,
      name: newPresetName.trim(),
      description: newPresetDesc.trim() || `${currentActivePreset.tagWidthMm} × ${currentActivePreset.tagHeightMm} mm custom layout`,
      isBuiltIn: false,
    };

    const updatedPresets = [...currentPresets, newPreset];

    setConfig(prev => {
      const next = { ...prev };
      if (isShelftag) {
        next.shelftagPresets = updatedPresets;
        next.shelftagConfig = newPreset;
        savePresetsToStorage('shelftag', updatedPresets);
      } else {
        next.ppTagPresets = updatedPresets;
        next.ppTagConfig = newPreset;
        savePresetsToStorage('pp_tag', updatedPresets);
      }
      return next;
    });

    setShowAddPresetModal(false);
    setNewPresetName('');
    setNewPresetDesc('');
    showToast(`New preset "${newPreset.name}" saved!`);
  };

  // Delete Preset (DELETE PRESET)
  const handleDeleteCurrentPreset = () => {
    if (currentActivePreset.isBuiltIn) {
      showToast('Standard built-in presets cannot be deleted.');
      setShowDeleteConfirmModal(false);
      return;
    }

    const updatedPresets = currentPresets.filter(p => p.id !== currentActivePreset.id);
    const fallback = updatedPresets[0] || defaultPresets[0];

    setConfig(prev => {
      const next = { ...prev };
      if (isShelftag) {
        next.shelftagPresets = updatedPresets;
        next.shelftagConfig = fallback;
        savePresetsToStorage('shelftag', updatedPresets);
      } else {
        next.ppTagPresets = updatedPresets;
        next.ppTagConfig = fallback;
        savePresetsToStorage('pp_tag', updatedPresets);
      }
      return next;
    });

    setShowDeleteConfirmModal(false);
    showToast(`Preset deleted. Switched to "${fallback.name}".`);
  };

  // Reset Single Field to Default (RESET FIELD)
  const handleResetSingleField = (fieldId: TagFieldId) => {
    const defaults = isShelftag
      ? createDefaultWhiteTagFields(currentActivePreset.tagWidthMm, currentActivePreset.tagHeightMm)
      : createDefaultYellowTagFields(currentActivePreset.tagWidthMm, currentActivePreset.tagHeightMm);

    if (defaults[fieldId]) {
      updateActivePreset(prev => ({
        ...prev,
        fields: {
          ...prev.fields,
          [fieldId]: defaults[fieldId],
        },
      }));
      showToast(`Reset ${defaults[fieldId].name} to default configuration.`);
    }
  };

  // Reset Entire Layout (RESET ENTIRE LAYOUT)
  const handleResetEntireLayout = () => {
    const defaultFields = isShelftag
      ? createDefaultWhiteTagFields(currentActivePreset.tagWidthMm, currentActivePreset.tagHeightMm)
      : createDefaultYellowTagFields(currentActivePreset.tagWidthMm, currentActivePreset.tagHeightMm);

    updateActivePreset(prev => ({
      ...prev,
      fields: defaultFields,
    }));

    setShowResetConfirmModal(false);
    showToast(`Reset the entire ${isShelftag ? 'ShelfTag' : 'PP Tag'} field layout to default.`);
  };

  // Update Individual Field Property
  const handleUpdateField = (fieldId: TagFieldId, updates: Partial<TagFieldConfig>) => {
    updateActivePreset(prev => {
      const current = prev.fields[fieldId];
      if (!current) return prev;
      return {
        ...prev,
        fields: {
          ...prev.fields,
          [fieldId]: {
            ...current,
            ...updates,
          },
        },
      };
    });
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-zinc-900 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 border border-zinc-700 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
          <span className="font-bold text-xs">{toastMessage}</span>
        </div>
      )}

      {/* 1. Master Tag Type Switcher Bar */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-100 text-amber-900">
              <Sliders className="w-4 h-4" />
            </span>
            <h2 className="text-sm font-black text-zinc-900">
              Tag Field Layout Editor
            </h2>
          </div>
          <p className="text-zinc-500 text-[11px] mt-0.5">
            Configure positions, millimeter dimensions, typography, barcode, and visibility for every field.
          </p>
        </div>

        {/* Tag Type Selector Buttons (White Shelftag vs Yellow PP Tag) */}
        <div className="flex items-center p-1 bg-zinc-100 rounded-xl border border-zinc-200 w-full md:w-auto">
          <button
            type="button"
            onClick={() => handleSwitchTagType('shelftag')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isShelftag
                ? 'bg-white text-zinc-950 shadow-xs border border-zinc-200'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <span>⚪</span>
            <span>ShelfTag (Regular Retail)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchTagType('pp_tag')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              !isShelftag
                ? 'bg-amber-400 text-zinc-950 shadow-xs border border-amber-500'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <span>🟡</span>
            <span>PP Tag (Yellow Promo)</span>
          </button>
        </div>
      </div>

      {/* 2. Preset Toolbar: USE, ADD, UPDATE, DELETE, RESET */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          {/* Preset Selector Dropdown */}
          <div className="flex-1 w-full lg:w-auto flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 shrink-0">
              Active Preset:
            </label>
            <div className="relative flex-1 max-w-md">
              <select
                value={currentActivePreset.id}
                onChange={e => handleSelectPreset(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl font-bold text-xs text-zinc-900 focus:ring-2 focus:ring-amber-500 focus:bg-white"
              >
                {currentPresets.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.tagWidthMm} × {p.tagHeightMm} mm) {p.isBuiltIn ? '• Standard' : '• Custom'}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-[11px] text-zinc-500 font-mono">
              {currentActivePreset.description}
            </span>
          </div>

          {/* Action Buttons: Add, Update, Delete, Reset Layout */}
          <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto justify-end">
            <button
              type="button"
              onClick={() => setShowAddPresetModal(true)}
              className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Save current layout as a new preset"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Preset</span>
            </button>

            <button
              type="button"
              onClick={handleUpdateCurrentPreset}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              title="Save changes into current preset"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Update Preset</span>
            </button>

            {!currentActivePreset.isBuiltIn && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(true)}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                title="Delete this custom preset"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowResetConfirmModal(true)}
              className="px-3 py-2 bg-zinc-100 hover:bg-amber-100 hover:text-amber-900 text-zinc-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Reset the entire tag layout to default"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Layout</span>
            </button>
          </div>
        </div>

        {/* Collapsible Tag Dimensions & Sheet Settings Button */}
        <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowDimensionsCard(!showDimensionsCard)}
            className="text-[11.5px] font-bold text-zinc-600 hover:text-zinc-900 flex items-center gap-1 cursor-pointer"
          >
            {showDimensionsCard ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>
              {showDimensionsCard ? 'Hide Tag & Sheet Dimensions' : 'Adjust Tag Physical Dimensions & Paper Margins'}
            </span>
          </button>
          <div className="flex items-center gap-2">
            {computeShelftagSheetLayout(currentActivePreset as any).fitsWidth ? (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                ✓ Fits {currentActivePreset.columns || 3} Cols
              </span>
            ) : (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300">
                ⚠️ Exceeds Width
              </span>
            )}
            <span className="text-[10.5px] text-zinc-400 font-mono">
              {currentActivePreset.tagWidthMm}mm × {currentActivePreset.tagHeightMm}mm on {currentActivePreset.paperSize} ({currentActivePreset.columns} cols)
            </span>
          </div>
        </div>

        {/* Collapsible Dimensions Panel */}
        {showDimensionsCard && (
          <div className="p-4 bg-zinc-50/80 rounded-xl border border-zinc-200 space-y-4 animate-in fade-in">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-[10.5px] font-bold text-zinc-600 mb-1">Tag Width (mm)</label>
                <input
                  type="number"
                  min="30"
                  max="150"
                  value={currentActivePreset.tagWidthMm}
                  onChange={e => {
                    const w = parseFloat(e.target.value) || 68;
                    updateActivePreset(p => ({ ...p, tagWidthMm: w }));
                  }}
                  className="w-full px-2.5 py-1.5 font-mono font-bold bg-white border border-zinc-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-zinc-600 mb-1">Tag Height (mm)</label>
                <input
                  type="number"
                  min="20"
                  max="120"
                  value={currentActivePreset.tagHeightMm}
                  onChange={e => {
                    const h = parseFloat(e.target.value) || 42;
                    updateActivePreset(p => ({ ...p, tagHeightMm: h }));
                  }}
                  className="w-full px-2.5 py-1.5 font-mono font-bold bg-white border border-zinc-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-zinc-600 mb-1">Paper Size</label>
                <select
                  value={currentActivePreset.paperSize}
                  onChange={e => updateActivePreset(p => ({ ...p, paperSize: e.target.value as PaperSize }))}
                  className="w-full px-2.5 py-1.5 font-bold bg-white border border-zinc-300 rounded-lg text-xs"
                >
                  <option value="A4">A4 (210 × 297 mm)</option>
                  <option value="SHORT_BOND">Short Bond (8.5 × 11 in)</option>
                  <option value="LETTER">Letter (8.5 × 11 in)</option>
                  <option value="LONG_BOND">Long Bond (8.5 × 13 in)</option>
                  <option value="LEGAL">Legal (8.5 × 14 in)</option>
                  <option value="CUSTOM">Custom Dimensions</option>
                </select>
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-zinc-600 mb-1">Columns</label>
                <select
                  value={currentActivePreset.columns}
                  onChange={e => updateActivePreset(p => ({ ...p, columns: parseInt(e.target.value, 10) || 3 }))}
                  className="w-full px-2.5 py-1.5 font-bold bg-white border border-zinc-300 rounded-lg text-xs"
                >
                  <option value="1">1 Column</option>
                  <option value="2">2 Columns</option>
                  <option value="3">3 Columns</option>
                  <option value="4">4 Columns</option>
                </select>
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-zinc-600 mb-1">Col Gap (mm)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={currentActivePreset.colGapMm}
                  onChange={e => updateActivePreset(p => ({ ...p, colGapMm: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-2.5 py-1.5 font-mono font-bold bg-white border border-zinc-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-zinc-600 mb-1">Row Gap (mm)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={currentActivePreset.rowGapMm}
                  onChange={e => updateActivePreset(p => ({ ...p, rowGapMm: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-2.5 py-1.5 font-mono font-bold bg-white border border-zinc-300 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Additional Toggles */}
            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-zinc-200">
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentActivePreset.showCutGuides}
                  onChange={e => updateActivePreset(p => ({ ...p, showCutGuides: e.target.checked }))}
                  className="rounded accent-amber-500"
                />
                <span className="font-bold text-zinc-700">Corner Cutting Guides</span>
              </label>

              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentActivePreset.showBorder}
                  onChange={e => updateActivePreset(p => ({ ...p, showBorder: e.target.checked }))}
                  className="rounded accent-amber-500"
                />
                <span className="font-bold text-zinc-700">Outer Tag Border</span>
              </label>

              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentActivePreset.showLogo}
                  onChange={e => updateActivePreset(p => ({ ...p, showLogo: e.target.checked }))}
                  className="rounded accent-amber-500"
                />
                <span className="font-bold text-zinc-700">Prince Store Brand Logo</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* 3. Main Split View: Visual Canvas (Left) & Property Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Visual Drag & Drop Layout Editor Canvas */}
        <div className="lg:col-span-7 h-[580px] sm:h-[640px]">
          <TagFieldVisualEditor
            tagType={activeTagType}
            layoutOption={config.layoutOption}
            preset={currentActivePreset}
            selectedFieldId={selectedFieldId}
            onSelectField={setSelectedFieldId}
            onUpdateField={handleUpdateField}
            onResetField={handleResetSingleField}
          />
        </div>

        {/* Dedicated Property Panel */}
        <div className="lg:col-span-5 h-[580px] sm:h-[640px]">
          <TagFieldPropertyPanel
            tagType={activeTagType}
            layoutOption={config.layoutOption}
            tagWidthMm={currentActivePreset.tagWidthMm}
            tagHeightMm={currentActivePreset.tagHeightMm}
            fields={currentActivePreset.fields}
            selectedFieldId={selectedFieldId}
            onSelectField={setSelectedFieldId}
            onUpdateField={handleUpdateField}
            onResetField={handleResetSingleField}
          />
        </div>
      </div>

      {/* 4. Live Comparison Card Preview */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-zinc-900 text-sm flex items-center gap-1.5">
              <span>🏷️</span>
              <span>Live Render Output Comparison</span>
            </h3>
            <p className="text-zinc-500 text-[11px]">
              Actual tags rendered dynamically using the customized field coordinates, typography, and dimensions.
            </p>
          </div>
          <span className="font-mono text-zinc-400 text-xs">
            100% Scale Preview
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-around gap-6 p-6 bg-zinc-50/80 rounded-xl border border-zinc-200 overflow-x-auto">
          {/* White Tag Preview */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1">
              <span>⚪</span> ShelfTag (White Regular)
            </span>
            <div className="shadow-md rounded">
              <ShelftagCardRenderer
                item={
                  sampleWhiteItem || {
                    id: 'sample-white',
                    tagStyle: 'white',
                    sku: '480001600123',
                    description: 'SAN MIGUEL PALE PILSEN 330ML CAN',
                    barcode: '480001600123',
                    regularPrice: 199.0,
                    promoPrice: null,
                    unit: 'PER CAN',
                    locator: 'A02-04-12',
                    category: 'Beverages',
                  }
                }
                config={config}
                scale={1}
              />
            </div>
          </div>

          {/* Yellow Tag Preview */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
              <span>🟡</span> PP Tag (Yellow Promo)
            </span>
            <div className="shadow-md rounded">
              <ShelftagCardRenderer
                item={
                  sampleYellowItem || {
                    id: 'sample-yellow',
                    tagStyle: 'yellow',
                    sku: '396758268186',
                    description: config.layoutOption === 2 ? 'ROLD HVN HBMONO MSLPRA STD 11' : 'COCA-COLA 1.5L PET BOTTLE ZERO SUGAR',
                    barcode: config.layoutOption === 2 ? '396758268186' : '480001600456',
                    regularPrice: 64.0,
                    promoPrice: 64.0,
                    unit: config.layoutOption === 2 ? 'PR1' : 'PER BOTTLE',
                    buyPerAndUp: config.layoutOption === 2 ? 'BUY 3 PR1 AND UP' : undefined,
                    locator: 'B01-02-08',
                    promoHeader: currentActivePreset.promoHeader || 'SPECIAL BUY',
                    promoValidity: 'Valid until supplies last',
                  }
                }
                config={config}
                scale={1}
              />
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: ADD PRESET */}
      {showAddPresetModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-zinc-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-blue-100 text-blue-800">
                <Plus className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900">
                  Save as New {isShelftag ? 'ShelfTag' : 'PP Tag'} Preset
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Save current tag size and field layout into a reusable preset.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">Preset Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Aisle End-Cap Feature Tag"
                  value={newPresetName}
                  onChange={e => setNewPresetName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl font-bold text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 68 × 42 mm for beverage section"
                  value={newPresetDesc}
                  onChange={e => setNewPresetDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="p-2.5 bg-zinc-100 rounded-xl text-[11px] text-zinc-600 font-mono">
                Stores {currentActivePreset.tagWidthMm} × {currentActivePreset.tagHeightMm} mm dimensions, paper layout, and 7 field configurations.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setShowAddPresetModal(false)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddNewPreset}
                disabled={!newPresetName.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition cursor-pointer shadow-xs"
              >
                Save Preset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RESET ENTIRE LAYOUT CONFIRMATION (Section 17) */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-zinc-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900">
                  Reset Entire Tag Layout?
                </h3>
                <p className="text-[11px] text-zinc-600 mt-1 leading-relaxed">
                  Reset the entire tag layout to the default configuration? All customized field positions, sizes, and fonts will return to defaults.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetEntireLayout}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 rounded-xl font-black text-xs transition cursor-pointer shadow-xs"
              >
                Reset Layout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE PRESET CONFIRMATION */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-zinc-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900">
                  Delete Preset?
                </h3>
                <p className="text-[11px] text-zinc-600 mt-1">
                  Are you sure you want to delete &quot;{currentActivePreset.name}&quot;? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(false)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCurrentPreset}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition cursor-pointer shadow-xs"
              >
                Delete Preset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
