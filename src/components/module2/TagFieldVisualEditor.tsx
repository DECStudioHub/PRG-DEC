import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Magnet,
  Eye,
  EyeOff,
  Move,
  RotateCcw,
  Layers,
} from 'lucide-react';
import { Module2TagType, TagFieldConfig, TagFieldId, TagLayoutPreset } from '../../types';
import {
  ALL_TAG_FIELDS,
  YELLOW_TAG_FIELD_METAS,
  WHITE_TAG_FIELD_METAS,
  AVAILABLE_FONTS,
} from './fieldDefaults';
import { generateBarcodeSvgString } from '../../utils/barcode';
import { DEFAULT_PRINCE_LOGO, PRINCE_LOGO_INLINE_SVG } from '../../utils/theme';

interface TagFieldVisualEditorProps {
  tagType: Module2TagType;
  layoutOption?: 1 | 2;
  preset: TagLayoutPreset;
  selectedFieldId: TagFieldId;
  onSelectField: (id: TagFieldId) => void;
  onUpdateField: (id: TagFieldId, updates: Partial<TagFieldConfig>) => void;
  onResetField: (id: TagFieldId) => void;
}

export const TagFieldVisualEditor: React.FC<TagFieldVisualEditorProps> = ({
  tagType,
  layoutOption = 1,
  preset,
  selectedFieldId,
  onSelectField,
  onUpdateField,
  onResetField,
}) => {
  const [zoom, setZoom] = useState<number>(1.6); // 1.6x zoom by default for comfortable editing
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [gridStepMm, setGridStepMm] = useState<number>(1); // 1mm snap

  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<string | null>(null); // 'se' | 'e' | 's'
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    initialW: number;
    initialH: number;
  }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    initialW: 0,
    initialH: 0,
  });

  // Millimeters to pixels scale factor
  // 96 DPI: 1 inch = 25.4 mm => 96 / 25.4 = 3.7795 px/mm
  const BASE_PX_PER_MM = 3.7795;
  const pxPerMm = BASE_PX_PER_MM * zoom;

  const tagWidthPx = preset.tagWidthMm * pxPerMm;
  const tagHeightPx = preset.tagHeightMm * pxPerMm;

  const activeField = preset.fields[selectedFieldId];

  // Helper to snap mm to grid
  const snapMm = useCallback(
    (valMm: number): number => {
      if (!snapToGrid) return Math.round(valMm * 10) / 10;
      return Math.round(valMm / gridStepMm) * gridStepMm;
    },
    [snapToGrid, gridStepMm]
  );

  // Mouse / Pointer Dragging Logic
  const handlePointerDownField = (e: React.PointerEvent, fieldId: TagFieldId) => {
    e.stopPropagation();
    onSelectField(fieldId);
    setIsDragging(true);
    setIsResizing(null);

    const f = preset.fields[fieldId];
    if (!f) return;
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: f.x,
      initialY: f.y,
      initialW: f.width,
      initialH: f.height,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerDownResize = (
    e: React.PointerEvent,
    handle: 'se' | 'e' | 's',
    fieldId: TagFieldId
  ) => {
    e.stopPropagation();
    onSelectField(fieldId);
    setIsResizing(handle);
    setIsDragging(false);

    const f = preset.fields[fieldId];
    if (!f) return;
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: f.x,
      initialY: f.y,
      initialW: f.width,
      initialH: f.height,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeField) return;

    if (isDragging) {
      const deltaXpx = e.clientX - dragStartRef.current.startX;
      const deltaYpx = e.clientY - dragStartRef.current.startY;

      const deltaXmm = deltaXpx / pxPerMm;
      const deltaYmm = deltaYpx / pxPerMm;

      let newX = snapMm(dragStartRef.current.initialX + deltaXmm);
      let newY = snapMm(dragStartRef.current.initialY + deltaYmm);

      // Clamp inside tag boundaries
      newX = Math.max(0, Math.min(preset.tagWidthMm - activeField.width, newX));
      newY = Math.max(0, Math.min(preset.tagHeightMm - activeField.height, newY));

      onUpdateField(selectedFieldId, {
        x: Math.round(newX * 10) / 10,
        y: Math.round(newY * 10) / 10,
      });
    } else if (isResizing) {
      const deltaXpx = e.clientX - dragStartRef.current.startX;
      const deltaYpx = e.clientY - dragStartRef.current.startY;

      const deltaXmm = deltaXpx / pxPerMm;
      const deltaYmm = deltaYpx / pxPerMm;

      let newW = dragStartRef.current.initialW;
      let newH = dragStartRef.current.initialH;

      if (isResizing === 'se' || isResizing === 'e') {
        newW = snapMm(dragStartRef.current.initialW + deltaXmm);
        newW = Math.max(4, Math.min(preset.tagWidthMm - activeField.x, newW));
      }
      if (isResizing === 'se' || isResizing === 's') {
        newH = snapMm(dragStartRef.current.initialH + deltaYmm);
        newH = Math.max(3, Math.min(preset.tagHeightMm - activeField.y, newH));
      }

      onUpdateField(selectedFieldId, {
        width: Math.round(newW * 10) / 10,
        height: Math.round(newH * 10) / 10,
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    setIsResizing(null);
  };

  // Keyboard Nudge Controls (Arrow keys = 0.5mm or 2mm with Shift)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'SELECT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (!activeField) return;

      const step = e.shiftKey ? 2.0 : 0.5;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          onUpdateField(selectedFieldId, {
            x: Math.max(0, Math.round((activeField.x - step) * 10) / 10),
          });
          break;
        case 'ArrowRight':
          e.preventDefault();
          onUpdateField(selectedFieldId, {
            x: Math.min(
              preset.tagWidthMm - activeField.width,
              Math.round((activeField.x + step) * 10) / 10
            ),
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          onUpdateField(selectedFieldId, {
            y: Math.max(0, Math.round((activeField.y - step) * 10) / 10),
          });
          break;
        case 'ArrowDown':
          e.preventDefault();
          onUpdateField(selectedFieldId, {
            y: Math.min(
              preset.tagHeightMm - activeField.height,
              Math.round((activeField.y + step) * 10) / 10
            ),
          });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeField, selectedFieldId, preset.tagWidthMm, preset.tagHeightMm, onUpdateField]);

  // Generate Barcode SVG for White Tag
  const sampleBarcodeSvg = useMemo(() => {
    const f = preset.fields.barcode;
    if (!f) return '';
    return generateBarcodeSvgString(
      '480001600123',
      f.barcodeFormat || 'CODE128',
      Math.max(14, Math.round(f.height * pxPerMm * 0.7)),
      f.showBarcodeText !== false,
      Math.max(
        8,
        Math.round(f.barcodeTextSizePt ? f.barcodeTextSizePt * (pxPerMm / BASE_PX_PER_MM) : 9)
      )
    );
  }, [preset.fields.barcode, pxPerMm, BASE_PX_PER_MM]);

  // Generate Millimeter Ruler Ticks
  const hRulerTicks = useMemo(() => {
    const ticks = [];
    for (let mm = 0; mm <= preset.tagWidthMm; mm += 5) {
      const isMajor = mm % 10 === 0;
      ticks.push(
        <div
          key={`h-${mm}`}
          className="absolute top-0 flex flex-col items-center select-none pointer-events-none"
          style={{ left: `${mm * pxPerMm}px` }}
        >
          <div
            className={`w-[1px] bg-zinc-400 ${isMajor ? 'h-3.5 bg-zinc-700' : 'h-2'}`}
          />
          {isMajor && (
            <span className="text-[8px] font-mono text-zinc-500 font-bold -mt-0.5 transform -translate-x-1/2">
              {mm}
            </span>
          )}
        </div>
      );
    }
    return ticks;
  }, [preset.tagWidthMm, pxPerMm]);

  const vRulerTicks = useMemo(() => {
    const ticks = [];
    for (let mm = 0; mm <= preset.tagHeightMm; mm += 5) {
      const isMajor = mm % 10 === 0;
      ticks.push(
        <div
          key={`v-${mm}`}
          className="absolute left-0 flex items-center select-none pointer-events-none"
          style={{ top: `${mm * pxPerMm}px` }}
        >
          <div
            className={`h-[1px] bg-zinc-400 ${isMajor ? 'w-3.5 bg-zinc-700' : 'w-2'}`}
          />
          {isMajor && (
            <span className="text-[8px] font-mono text-zinc-500 font-bold -ml-0.5 transform -translate-y-1/2">
              {mm}
            </span>
          )}
        </div>
      );
    }
    return ticks;
  }, [preset.tagHeightMm, pxPerMm]);

  const isYellow = tagType === 'pp_tag';
  const tagBg = isYellow ? '#FEED01' : '#ffffff';
  const activeFieldsList = isYellow ? YELLOW_TAG_FIELD_METAS : WHITE_TAG_FIELD_METAS;

  return (
    <div className="flex flex-col h-full bg-zinc-100/90 rounded-2xl border border-zinc-200 overflow-hidden shadow-xs">
      {/* Top Toolbar */}
      <div className="bg-white px-4 py-2.5 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Current Active Tag & Status */}
        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs ${
              isYellow ? 'bg-amber-400 text-zinc-950' : 'bg-zinc-800 text-white'
            }`}
          >
            <span>{isYellow ? '🟡' : '⚪'}</span>
            <span>{isYellow ? 'Yellow PP Tag Layout' : 'White ShelfTag Layout'}</span>
          </span>

          <span className="text-zinc-500 font-mono text-[11px] font-bold">
            {preset.tagWidthMm} × {preset.tagHeightMm} mm
          </span>

          {activeField && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-mono text-[10.5px]">
              <span className="text-zinc-400">Selected:</span>
              <strong className="text-zinc-900">{activeField.name}</strong>
              <span className="text-amber-600 font-bold ml-1">
                ({activeField.x.toFixed(1)}, {activeField.y.toFixed(1)}) mm
              </span>
            </span>
          )}
        </div>

        {/* Right Controls: Zoom, Grid, Snap */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center bg-zinc-100 rounded-lg p-0.5 border border-zinc-200">
            <button
              type="button"
              onClick={() => setZoom(prev => Math.max(0.75, Math.round((prev - 0.25) * 100) / 100))}
              className="p-1 hover:bg-white rounded text-zinc-700 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] font-bold text-zinc-800">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom(prev => Math.min(3.0, Math.round((prev + 0.25) * 100) / 100))}
              className="p-1 hover:bg-white rounded text-zinc-700 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1.6)}
              className="p-1 hover:bg-white rounded text-zinc-500 hover:text-zinc-800 cursor-pointer ml-0.5"
              title="Reset Zoom to 160%"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Grid Toggle */}
          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center gap-1 text-[11px] font-semibold ${
              showGrid
                ? 'bg-zinc-900 border-zinc-900 text-white'
                : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
            }`}
            title="Toggle Ruler Grid"
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Grid</span>
          </button>

          {/* Snap to Grid Toggle */}
          <button
            type="button"
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center gap-1 text-[11px] font-semibold ${
              snapToGrid
                ? 'bg-amber-100/70 border-amber-300 text-amber-900'
                : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
            }`}
            title="Toggle Snap to Grid (1mm)"
          >
            <Magnet className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Snap</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Work Area with Rulers */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="flex-1 overflow-auto p-8 relative flex items-center justify-center select-none bg-[radial-gradient(#d4d4d8_1px,transparent_1px)] [background-size:16px_16px]"
      >
        <div className="relative inline-block m-auto">
          {/* Top Horizontal Ruler */}
          <div
            className="absolute -top-7 left-7 h-6 bg-zinc-200/90 border border-zinc-300 rounded-t overflow-hidden"
            style={{ width: `${tagWidthPx}px` }}
          >
            {hRulerTicks}
          </div>

          {/* Left Vertical Ruler */}
          <div
            className="absolute top-0 -left-7 w-6 bg-zinc-200/90 border border-zinc-300 rounded-l overflow-hidden"
            style={{ height: `${tagHeightPx}px` }}
          >
            {vRulerTicks}
          </div>

          {/* Ruler Corner Junction Box */}
          <div className="absolute -top-7 -left-7 w-7 h-7 bg-zinc-300 border border-zinc-400 rounded-tl flex items-center justify-center text-[8px] font-mono font-bold text-zinc-600">
            mm
          </div>

          {/* The Actual Physical Tag Canvas */}
          <div
            className="relative border-2 border-zinc-900 shadow-xl transition-colors overflow-hidden"
            style={{
              width: `${tagWidthPx}px`,
              height: `${tagHeightPx}px`,
              backgroundColor: tagBg,
              boxSizing: 'border-box',
            }}
          >
            {/* Grid Overlay Lines (10mm major, 2mm minor) */}
            {showGrid && (
              <div
                className="absolute inset-0 pointer-events-none opacity-30 z-0"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, #71717a 1px, transparent 1px),
                    linear-gradient(to bottom, #71717a 1px, transparent 1px),
                    linear-gradient(to right, #d4d4d8 1px, transparent 1px),
                    linear-gradient(to bottom, #d4d4d8 1px, transparent 1px)
                  `,
                  backgroundSize: `
                    ${10 * pxPerMm}px ${10 * pxPerMm}px,
                    ${10 * pxPerMm}px ${10 * pxPerMm}px,
                    ${2 * pxPerMm}px ${2 * pxPerMm}px,
                    ${2 * pxPerMm}px ${2 * pxPerMm}px
                  `,
                }}
              />
            )}

            {/* Corner Cutting Guides */}
            {preset.showCutGuides && (
              <>
                <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-zinc-600 pointer-events-none z-30" />
                <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-zinc-600 pointer-events-none z-30" />
                <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-zinc-600 pointer-events-none z-30" />
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-zinc-600 pointer-events-none z-30" />
              </>
            )}

            {/* Render Each Field Box */}
            {activeFieldsList.map(meta => {
              let field = preset.fields[meta.id];
              if (!field) {
                if (meta.id === 'price') field = preset.fields.regularPrice;
                else if (meta.id === 'upc') field = preset.fields.barcode;
                else if (meta.id === 'date') field = preset.fields.tagDate;
                else if (meta.id === 'buy' || meta.id === 'uom') field = preset.fields.buyPerAndUp;
                else if (meta.id === 'per') field = preset.fields.priceUnit;
              }

              if (!field) return null;

              const isSelected = selectedFieldId === meta.id;
              const isVisible = field.visible !== false;

              const fXpx = field.x * pxPerMm;
              const fYpx = field.y * pxPerMm;
              const fWpx = field.width * pxPerMm;
              const fHpx = field.height * pxPerMm;

              const fontPx = Math.max(
                6,
                Math.round(field.fontSizePt * 1.333 * (pxPerMm / BASE_PX_PER_MM))
              );

              return (
                <div
                  key={meta.id}
                  id={`canvas-field-${meta.id}`}
                  onPointerDown={e => handlePointerDownField(e, meta.id)}
                  className={`absolute group cursor-move transition-all ${
                    !isVisible ? 'opacity-20 pointer-events-none' : ''
                  }`}
                  style={{
                    left: `${fXpx}px`,
                    top: `${fYpx}px`,
                    width: `${fWpx}px`,
                    height: `${fHpx}px`,
                    zIndex: isSelected ? 40 : 10,
                  }}
                >
                  {/* Outer Field Selection Border */}
                  <div
                    className={`absolute inset-0 rounded-xs transition-all pointer-events-none ${
                      isSelected
                        ? 'ring-2 ring-blue-600 ring-offset-1 ring-offset-white/80 bg-blue-500/10'
                        : 'border border-dashed border-zinc-400/60 group-hover:border-blue-400 group-hover:bg-blue-500/5'
                    }`}
                  />

                  {/* Field Label Badge when Hovered or Selected */}
                  {(isSelected || snapToGrid) && (
                    <div
                      className={`absolute -top-4 left-0 px-1 py-0.2 text-[8px] font-mono font-bold rounded-xs pointer-events-none whitespace-nowrap shadow-2xs z-50 ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-200'
                      }`}
                    >
                      {field.name || meta.label}
                    </div>
                  )}

                  {/* Resizing Handles */}
                  {isSelected && (
                    <>
                      <div
                        onPointerDown={e => handlePointerDownResize(e, 'e', meta.id)}
                        className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-4 bg-blue-600 rounded-full cursor-ew-resize z-50 shadow-xs"
                      />
                      <div
                        onPointerDown={e => handlePointerDownResize(e, 's', meta.id)}
                        className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-4 h-2 bg-blue-600 rounded-full cursor-ns-resize z-50 shadow-xs"
                      />
                      <div
                        onPointerDown={e => handlePointerDownResize(e, 'se', meta.id)}
                        className="absolute right-[-4px] bottom-[-4px] w-3 h-3 bg-blue-600 rounded-full cursor-nwse-resize z-50 shadow-xs ring-2 ring-white"
                      />
                    </>
                  )}

                  {/* Content Preview Container */}
                  <div
                    className="w-full h-full overflow-hidden flex flex-col pointer-events-none select-none"
                    style={{
                      fontFamily: field.fontFamily || 'Arial',
                      fontSize: `${fontPx}px`,
                      fontWeight: field.fontWeight === 'bold' ? 800 : 400,
                      fontStyle: field.fontStyle || 'normal',
                      color: field.textColor || '#000000',
                      textAlign: field.textAlign || 'left',
                      justifyContent:
                        field.verticalAlign === 'middle'
                          ? 'center'
                          : field.verticalAlign === 'bottom'
                          ? 'flex-end'
                          : 'flex-start',
                      alignItems:
                        field.textAlign === 'left'
                          ? 'flex-start'
                          : field.textAlign === 'right'
                          ? 'flex-end'
                          : 'center',
                      textTransform: field.textTransform === 'none' ? undefined : field.textTransform,
                      lineHeight: 1.15,
                    }}
                  >
                    {/* DESCRIPTION */}
                    {meta.id === 'description' && (
                      <div
                        className={
                          field.textWrap ? `line-clamp-${field.maxLines || 2}` : 'truncate w-full'
                        }
                      >
                        {isYellow
                          ? 'ROLD HVN HBMONO MSLPRA STD 11'
                          : 'SAN MIGUEL PALE PILSEN 330ML CAN'}
                      </div>
                    )}

                    {/* YELLOW UPC (Bold numbers, strictly NO barcode lines) */}
                    {meta.id === 'upc' && isYellow && (
                      <div className="font-mono font-black tracking-wider text-right w-full truncate leading-none">
                        396758268186
                      </div>
                    )}

                    {/* YELLOW BUY */}
                    {meta.id === 'buy' && isYellow && (
                      <div className="font-black text-left w-full leading-none">BUY</div>
                    )}

                    {/* YELLOW QTY */}
                    {meta.id === 'qty' && isYellow && (
                      <div className="font-black text-left w-full leading-none">3</div>
                    )}

                    {/* YELLOW UOM */}
                    {meta.id === 'uom' && isYellow && (
                      <div className="font-black text-left w-full leading-none uppercase">
                        PCS AND UP
                      </div>
                    )}

                    {/* YELLOW & WHITE PRICE (Fixed aligned Piso sign) */}
                    {meta.id === 'price' && (
                      <div className="flex items-baseline leading-none whitespace-nowrap">
                        {field.showCurrencySymbol && (
                          <span
                            className="font-black select-none mr-0.5 leading-none"
                            style={{
                              fontSize: `${Math.max(8, Math.round(fontPx * 0.72))}px`,
                              lineHeight: 1,
                            }}
                          >
                            {field.currencySymbol || '₱'}
                          </span>
                        )}
                        <span
                          className="leading-none whitespace-nowrap font-black"
                          style={{ lineHeight: 1 }}
                        >
                          {isYellow ? '64.00' : '69.00'}
                        </span>
                      </div>
                    )}

                    {/* YELLOW PER */}
                    {meta.id === 'per' && isYellow && (
                      <div className="font-black text-left w-full leading-none uppercase">/PC</div>
                    )}

                    {/* WHITE DATE */}
                    {meta.id === 'date' && !isYellow && (
                      <div className="truncate w-full font-bold select-none text-right">
                        2/14/26
                      </div>
                    )}

                    {/* WHITE LOGO */}
                    {meta.id === 'logo' && !isYellow && (
                      <div className="w-full h-full flex items-center justify-start overflow-hidden">
                        <div
                          className="max-h-full max-w-full object-contain"
                          dangerouslySetInnerHTML={{ __html: PRINCE_LOGO_INLINE_SVG }}
                        />
                      </div>
                    )}

                    {/* WHITE BARCODE */}
                    {meta.id === 'barcode' && !isYellow && (
                      <div
                        className="w-full h-full flex flex-col justify-center overflow-hidden"
                        style={{
                          alignItems:
                            field.barcodeAlign === 'center'
                              ? 'center'
                              : field.barcodeAlign === 'right'
                              ? 'flex-end'
                              : 'flex-start',
                        }}
                      >
                        <div
                          className="max-w-full overflow-hidden"
                          dangerouslySetInnerHTML={{ __html: sampleBarcodeSvg }}
                        />
                      </div>
                    )}

                    {/* WHITE SKU */}
                    {meta.id === 'sku' && !isYellow && (
                      <div className="truncate w-full font-mono font-bold uppercase">100452</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
