import React, { useEffect } from 'react';
import {
  Eye,
  EyeOff,
  RotateCcw,
  Type,
  Maximize,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Sliders,
  Barcode as BarcodeIcon,
  Tag as TagIcon,
  DollarSign,
  MapPin,
  Square,
  Sparkles,
} from 'lucide-react';
import {
  BarcodeType,
  Module2TagType,
  TagFieldConfig,
  TagFieldId,
  TextTransformMode,
} from '../../types';
import {
  ALL_TAG_FIELDS,
  AVAILABLE_FONTS,
  YELLOW_TAG_FIELD_METAS,
  WHITE_TAG_FIELD_METAS,
} from './fieldDefaults';

interface TagFieldPropertyPanelProps {
  tagType: Module2TagType;
  layoutOption?: 1 | 2;
  tagWidthMm: number;
  tagHeightMm: number;
  fields: Record<TagFieldId, TagFieldConfig>;
  selectedFieldId: TagFieldId;
  onSelectField: (id: TagFieldId) => void;
  onUpdateField: (id: TagFieldId, updates: Partial<TagFieldConfig>) => void;
  onResetField: (id: TagFieldId) => void;
}

export const TagFieldPropertyPanel: React.FC<TagFieldPropertyPanelProps> = ({
  tagType,
  layoutOption = 1,
  tagWidthMm,
  tagHeightMm,
  fields,
  selectedFieldId,
  onSelectField,
  onUpdateField,
  onResetField,
}) => {
  const isYellow = tagType === 'pp_tag';
  const availableFields = isYellow ? YELLOW_TAG_FIELD_METAS : WHITE_TAG_FIELD_METAS;

  // Auto-switch to first valid field if current selection is not in active list
  useEffect(() => {
    const validIds = availableFields.map(f => f.id);
    if (!validIds.includes(selectedFieldId)) {
      onSelectField(validIds[0]);
    }
  }, [tagType, availableFields, selectedFieldId, onSelectField]);

  let field = fields[selectedFieldId];
  if (!field) {
    // Alias lookups
    if (selectedFieldId === 'price') field = fields.regularPrice;
    else if (selectedFieldId === 'upc') field = fields.barcode;
    else if (selectedFieldId === 'date') field = fields.tagDate;
    else if (selectedFieldId === 'buy' || selectedFieldId === 'uom') field = fields.buyPerAndUp;
    else if (selectedFieldId === 'per') field = fields.priceUnit;
    else field = fields['description'];
  }

  if (!field) {
    return (
      <div className="p-6 text-center text-zinc-400 text-xs">
        Select a field on the canvas to configure properties.
      </div>
    );
  }

  const isBarcode = selectedFieldId === 'barcode';
  const isPrice = selectedFieldId === 'price' || selectedFieldId === 'regularPrice';
  const isUpc = selectedFieldId === 'upc';
  const isDescription = selectedFieldId === 'description';

  const fieldDisplayLabel = field.name || selectedFieldId.toUpperCase();

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs text-xs">
      {/* 1. Field Selector Strip */}
      <div className="p-3 border-b border-zinc-200 bg-zinc-50/70">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-[10.5px] font-extrabold uppercase tracking-wider text-zinc-600">
            {isYellow ? 'Yellow Tag Fields (7)' : 'White Tag Fields (6)'}
          </label>
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
            {isYellow ? 'PP Tag Mode' : 'ShelfTag Mode'}
          </span>
        </div>

        <div className="space-y-1.5">
          {availableFields.map(meta => {
            const isSelected = selectedFieldId === meta.id;
            let currentF = fields[meta.id];
            if (!currentF) {
              if (meta.id === 'price') currentF = fields.regularPrice;
              else if (meta.id === 'upc') currentF = fields.barcode;
              else if (meta.id === 'date') currentF = fields.tagDate;
              else if (meta.id === 'buy' || meta.id === 'uom') currentF = fields.buyPerAndUp;
              else if (meta.id === 'per') currentF = fields.priceUnit;
            }
            const isVisible = currentF?.visible !== false;

            return (
              <div
                key={meta.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectField(meta.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectField(meta.id);
                  }
                }}
                className={`w-full px-3 py-2 rounded-xl text-left font-bold text-xs flex items-center justify-between transition-all cursor-pointer ${
                  isSelected
                    ? isYellow
                      ? 'bg-amber-400 text-zinc-950 shadow-xs border border-amber-500 font-black'
                      : 'bg-zinc-900 text-white shadow-xs font-black'
                    : 'bg-white border border-zinc-200 text-zinc-800 hover:bg-zinc-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? isYellow
                          ? 'border-zinc-950 bg-zinc-950'
                          : 'border-white bg-white'
                        : 'border-zinc-400 bg-white'
                    }`}
                  >
                    {isSelected && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isYellow ? 'bg-amber-400' : 'bg-zinc-900'
                        }`}
                      />
                    )}
                  </span>
                  <span className="font-extrabold tracking-tight">{meta.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10.5px] opacity-75 font-medium hidden sm:inline">
                    {meta.description}
                  </span>
                  <button
                    type="button"
                    title={isVisible ? 'Hide field' : 'Show field'}
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateField(meta.id, { visible: !isVisible });
                    }}
                    className={`p-1 rounded-md cursor-pointer ${
                      isVisible
                        ? isSelected
                          ? isYellow
                            ? 'text-zinc-950 hover:bg-amber-500'
                            : 'text-white hover:bg-zinc-800'
                          : 'text-emerald-700 hover:bg-emerald-100'
                        : 'text-zinc-400 hover:bg-zinc-200'
                    }`}
                  >
                    {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Selected Field Header with Visibility & Reset */}
      <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-md bg-amber-100 text-amber-900">
            {isBarcode ? (
              <BarcodeIcon className="w-4 h-4" />
            ) : isPrice ? (
              <DollarSign className="w-4 h-4" />
            ) : (
              <Type className="w-4 h-4" />
            )}
          </span>
          <div>
            <h3 className="font-extrabold text-zinc-900 text-[13px] leading-tight">
              {fieldDisplayLabel}
            </h3>
            <span className="text-[10.5px] text-zinc-500 font-mono">
              X: {field.x}mm, Y: {field.y}mm • {field.width} × {field.height}mm
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onUpdateField(selectedFieldId, { visible: !field.visible })}
            className={`px-2 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition cursor-pointer ${
              field.visible
                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300'
            }`}
          >
            {field.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{field.visible ? 'Visible' : 'Hidden'}</span>
          </button>

          <button
            type="button"
            onClick={() => onResetField(selectedFieldId)}
            className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 rounded-lg cursor-pointer"
            title="Reset field position & font to default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Property Controls (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Physical Coordinates (Millimeters) */}
        <div>
          <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-2 flex items-center gap-1.5">
            <Maximize className="w-3.5 h-3.5 text-zinc-500" />
            <span>Position & Size (mm)</span>
          </label>
          <div className="grid grid-cols-2 gap-2 font-mono">
            <div>
              <span className="text-[10px] text-zinc-500 block mb-0.5">X Pos (Left)</span>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max={tagWidthMm}
                  value={field.x}
                  onChange={e =>
                    onUpdateField(selectedFieldId, {
                      x: Math.max(0, parseFloat(e.target.value) || 0),
                    })
                  }
                  className="w-full px-2 py-1 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold text-zinc-900 focus:bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400">
                  mm
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-zinc-500 block mb-0.5">Y Pos (Top)</span>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max={tagHeightMm}
                  value={field.y}
                  onChange={e =>
                    onUpdateField(selectedFieldId, {
                      y: Math.max(0, parseFloat(e.target.value) || 0),
                    })
                  }
                  className="w-full px-2 py-1 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold text-zinc-900 focus:bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400">
                  mm
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-zinc-500 block mb-0.5">Width</span>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="4"
                  max={tagWidthMm}
                  value={field.width}
                  onChange={e =>
                    onUpdateField(selectedFieldId, {
                      width: Math.max(4, parseFloat(e.target.value) || 4),
                    })
                  }
                  className="w-full px-2 py-1 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold text-zinc-900 focus:bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400">
                  mm
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-zinc-500 block mb-0.5">Height</span>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="3"
                  max={tagHeightMm}
                  value={field.height}
                  onChange={e =>
                    onUpdateField(selectedFieldId, {
                      height: Math.max(3, parseFloat(e.target.value) || 3),
                    })
                  }
                  className="w-full px-2 py-1 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold text-zinc-900 focus:bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400">
                  mm
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Typography Section */}
        {selectedFieldId !== 'logo' && (
          <div className="space-y-3 pt-2 border-t border-zinc-100">
            <label className="block text-[11px] font-bold text-zinc-700 uppercase flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-zinc-500" />
              <span>Typography</span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-zinc-500 block mb-0.5">Font Family</span>
                <select
                  value={field.fontFamily || 'Arial'}
                  onChange={e => onUpdateField(selectedFieldId, { fontFamily: e.target.value })}
                  className="w-full px-2 py-1 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-900 focus:bg-white focus:outline-none"
                >
                  {AVAILABLE_FONTS.map(font => (
                    <option key={font.id} value={font.id}>
                      {font.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-[10px] text-zinc-500 block mb-0.5">Font Size (pt)</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.5"
                    min="5"
                    max="72"
                    value={field.fontSizePt}
                    onChange={e =>
                      onUpdateField(selectedFieldId, {
                        fontSizePt: Math.max(5, parseFloat(e.target.value) || 9),
                      })
                    }
                    className="w-full px-2 py-1 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold font-mono text-zinc-900 focus:bg-white focus:outline-none"
                  />
                  <span className="text-[10px] text-zinc-400">pt</span>
                </div>
              </div>
            </div>

            {/* Alignment & Weight Buttons */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center bg-zinc-100 p-0.5 rounded-lg border border-zinc-200">
                <button
                  type="button"
                  onClick={() => onUpdateField(selectedFieldId, { textAlign: 'left' })}
                  className={`p-1.5 rounded cursor-pointer ${
                    field.textAlign === 'left'
                      ? 'bg-white text-zinc-900 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                  title="Align Left"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateField(selectedFieldId, { textAlign: 'center' })}
                  className={`p-1.5 rounded cursor-pointer ${
                    field.textAlign === 'center'
                      ? 'bg-white text-zinc-900 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                  title="Align Center"
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateField(selectedFieldId, { textAlign: 'right' })}
                  className={`p-1.5 rounded cursor-pointer ${
                    field.textAlign === 'right'
                      ? 'bg-white text-zinc-900 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                  title="Align Right"
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center bg-zinc-100 p-0.5 rounded-lg border border-zinc-200">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateField(selectedFieldId, {
                      fontWeight: field.fontWeight === 'bold' ? 'normal' : 'bold',
                    })
                  }
                  className={`p-1.5 rounded cursor-pointer ${
                    field.fontWeight === 'bold'
                      ? 'bg-white text-zinc-900 shadow-xs font-bold'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                  title="Bold Font"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateField(selectedFieldId, {
                      textTransform: field.textTransform === 'uppercase' ? 'none' : 'uppercase',
                    })
                  }
                  className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${
                    field.textTransform === 'uppercase'
                      ? 'bg-white text-zinc-900 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                  title="Uppercase"
                >
                  AA
                </button>
              </div>
            </div>

            {/* Text & Background Color */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100">
              <div>
                <span className="text-[10px] text-zinc-500 block mb-0.5">Text Color</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={field.textColor || '#000000'}
                    onChange={e => onUpdateField(selectedFieldId, { textColor: e.target.value })}
                    className="w-7 h-7 rounded border border-zinc-200 cursor-pointer p-0.5 bg-white shrink-0"
                  />
                  <input
                    type="text"
                    value={field.textColor || '#000000'}
                    onChange={e => onUpdateField(selectedFieldId, { textColor: e.target.value })}
                    className="w-full px-2 py-1 bg-zinc-50 border border-zinc-200 rounded text-xs font-mono text-zinc-800"
                  />
                </div>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block mb-0.5">Field BG</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={field.backgroundColor && field.backgroundColor !== 'transparent' ? field.backgroundColor : '#ffffff'}
                    onChange={e => onUpdateField(selectedFieldId, { backgroundColor: e.target.value })}
                    className="w-7 h-7 rounded border border-zinc-200 cursor-pointer p-0.5 bg-white shrink-0"
                  />
                  <button
                    type="button"
                    onClick={() => onUpdateField(selectedFieldId, { backgroundColor: 'transparent' })}
                    className="text-[10.5px] px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Price Specific Properties */}
        {isPrice && (
          <div className="space-y-3 pt-3 border-t border-zinc-100 bg-amber-50/50 p-3 rounded-xl border border-amber-200">
            <label className="block text-[11px] font-bold text-amber-950 uppercase flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-amber-700" />
              <span>Price Display Settings</span>
            </label>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={field.showCurrencySymbol}
                  onChange={e =>
                    onUpdateField(selectedFieldId, { showCurrencySymbol: e.target.checked })
                  }
                  className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <span className="text-zinc-800 font-semibold text-xs">
                  Show Currency Symbol (₱)
                </span>
              </label>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-[10px] text-zinc-600 block mb-0.5">Currency Sign</span>
                  <input
                    type="text"
                    value={field.currencySymbol || '₱'}
                    onChange={e =>
                      onUpdateField(selectedFieldId, { currencySymbol: e.target.value })
                    }
                    className="w-full px-2 py-1 bg-white border border-amber-300 rounded-lg text-xs font-bold text-zinc-900 focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-600 block mb-0.5">Decimal Places</span>
                  <select
                    value={field.decimalPlaces ?? 2}
                    onChange={e =>
                      onUpdateField(selectedFieldId, {
                        decimalPlaces: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full px-2 py-1 bg-white border border-amber-300 rounded-lg text-xs font-bold text-zinc-900 focus:outline-none"
                  >
                    <option value={2}>2 Decimals (.00)</option>
                    <option value={0}>0 Decimals (Whole)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Barcode Specific Properties (White Tag) */}
        {isBarcode && !isYellow && (
          <div className="space-y-3 pt-3 border-t border-zinc-100 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
            <label className="block text-[11px] font-bold text-zinc-900 uppercase flex items-center gap-1.5">
              <BarcodeIcon className="w-3.5 h-3.5 text-zinc-700" />
              <span>Barcode Barcode Settings</span>
            </label>

            <div className="space-y-2">
              <div>
                <span className="text-[10px] text-zinc-500 block mb-0.5">Barcode Symbology</span>
                <select
                  value={field.barcodeFormat || 'CODE128'}
                  onChange={e =>
                    onUpdateField(selectedFieldId, {
                      barcodeFormat: e.target.value as BarcodeType,
                    })
                  }
                  className="w-full px-2 py-1 bg-white border border-zinc-300 rounded-lg text-xs font-medium text-zinc-900 focus:outline-none"
                >
                  <option value="CODE128">CODE 128 (Standard)</option>
                  <option value="EAN13">EAN-13</option>
                  <option value="UPCA">UPC-A</option>
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={field.showBarcodeText !== false}
                  onChange={e =>
                    onUpdateField(selectedFieldId, { showBarcodeText: e.target.checked })
                  }
                  className="rounded text-zinc-900 focus:ring-zinc-500 cursor-pointer"
                />
                <span className="text-zinc-800 font-semibold text-xs">
                  Show Human-Readable UPC Text Below Bars
                </span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
