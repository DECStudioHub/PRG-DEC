import React, { useMemo } from 'react';
import {
  Module2Config,
  ShelfTagItem,
  YellowTagItem,
  WhiteTagItem,
  TagFieldConfig,
  TagFieldId,
} from '../../types';
import { generateBarcodeSvgString } from '../../utils/barcode';
import { DEFAULT_PRINCE_LOGO, PRINCE_LOGO_INLINE_SVG, getEffectiveLogoUrl } from '../../utils/theme';
import { getFormattedReferenceDate, formatBuyPerAndUp } from '../../utils/shelftagExpansion';
import { YELLOW_PALETTES } from './constants';
import {
  ALL_TAG_FIELDS,
  YELLOW_TAG_FIELD_METAS,
  WHITE_TAG_FIELD_METAS,
  createDefaultYellowTagFields,
  createDefaultWhiteTagFields,
} from './fieldDefaults';
import { getFormattedTodayDate } from '../../utils/module2ExcelService';

interface ShelftagCardRendererProps {
  item: YellowTagItem | WhiteTagItem | ShelfTagItem;
  config: Module2Config;
  scale?: number;
  className?: string;
  tagTypeOverride?: 'yellow' | 'white';
}

export const ShelftagCardRenderer: React.FC<ShelftagCardRendererProps> = ({
  item,
  config,
  scale = 1,
  className = '',
  tagTypeOverride,
}) => {
  // Determine if Yellow or White
  const isYellow = useMemo(() => {
    if (tagTypeOverride) return tagTypeOverride === 'yellow';
    if ('tagStyle' in item) return item.tagStyle === 'yellow';
    if ('qty' in item && !('sku' in item && (item as any).sku)) return true;
    if (config.activeTagType === 'pp_tag') return true;
    return false;
  }, [tagTypeOverride, item, config.activeTagType]);

  // Active preset and field layout
  const layoutPreset = useMemo(() => {
    if (isYellow) {
      return (
        config.ppTagConfig || {
          tagWidthMm: config.tagWidthMm || 60,
          tagHeightMm: config.tagHeightMm || 42,
          yellowPalette: config.yellowPalette || 'golden',
          currencySymbol: config.currencySymbol || '₱',
          showBorder: config.showBorder,
          showCutGuides: config.showCutGuides,
          fields: createDefaultYellowTagFields(config.tagWidthMm || 60, config.tagHeightMm || 42),
        }
      );
    } else {
      return (
        config.shelftagConfig || {
          tagWidthMm: config.tagWidthMm || 60,
          tagHeightMm: config.tagHeightMm || 42,
          yellowPalette: 'golden',
          currencySymbol: config.currencySymbol || '₱',
          showBorder: config.showBorder,
          showCutGuides: config.showCutGuides,
          showLogo: config.showLogo,
          fields: createDefaultWhiteTagFields(config.tagWidthMm || 60, config.tagHeightMm || 42),
        }
      );
    }
  }, [isYellow, config]);

  const tagWidthMm = layoutPreset.tagWidthMm || config.tagWidthMm || (isYellow ? 60 : 60);
  const tagHeightMm = layoutPreset.tagHeightMm || config.tagHeightMm || (isYellow ? 42 : 42);
  const fields = layoutPreset.fields;

  // Background color
  const bgColor = useMemo(() => {
    if (!isYellow) return '#ffffff';
    const palId = layoutPreset.yellowPalette || config.yellowPalette || 'golden';
    const palette = YELLOW_PALETTES.find(p => p.id === palId) || YELLOW_PALETTES[0];
    return palette.bgHex;
  }, [isYellow, layoutPreset.yellowPalette, config.yellowPalette]);

  // Barcode SVG calculation for White Tag
  const barcodeSvg = useMemo(() => {
    if (isYellow) return '';
    const barcodeField = fields?.barcode;
    const format = barcodeField?.barcodeFormat || config.barcodeFormat || 'CODE128';
    const showText = barcodeField?.showBarcodeText !== false;
    const textSize = barcodeField?.barcodeTextSizePt
      ? Math.max(7, Math.round(barcodeField.barcodeTextSizePt * scale * 1.33))
      : Math.max(8, Math.round(9 * scale));

    const heightPx = Math.max(16, Math.round((barcodeField?.height || 14) * 2.8 * scale));
    const codeVal = (item as any).barcode || (item as any).upc || (item as any).sku || '00000000';

    return generateBarcodeSvgString(codeVal, format, heightPx, showText, textSize);
  }, [isYellow, fields?.barcode, config.barcodeFormat, scale, item]);

  // Currency
  const currency = layoutPreset.currencySymbol || config.currencySymbol || '₱';

  // Resolved values for fields
  const itemUpc = (item as any).upc || (item as any).barcode || (item as any).sku || '';
  const itemDesc = item.description || '';
  const itemQty = (item as any).qty != null ? String((item as any).qty) : '3';
  const itemBuy = (item as any).buy || 'BUY';
  const itemUom = (item as any).uom || 'PCS AND UP';
  const itemPer = (item as any).per || '/PC';
  const itemSku = (item as any).sku || itemUpc.slice(-6);
  const itemDate = (item as any).date || (item as any).tagDate || getFormattedTodayDate();

  const itemPriceNum = useMemo(() => {
    if ('price' in item && typeof item.price === 'number') return item.price;
    if ('promoPrice' in item && typeof item.promoPrice === 'number' && item.promoPrice > 0)
      return item.promoPrice;
    if ('regularPrice' in item && typeof item.regularPrice === 'number') return item.regularPrice;
    return 0;
  }, [item]);

  // Determine active field metas to render
  const activeMetas = useMemo(() => {
    if (isYellow) {
      return YELLOW_TAG_FIELD_METAS;
    } else {
      return WHITE_TAG_FIELD_METAS;
    }
  }, [isYellow]);

  return (
    <div
      className={`relative select-none overflow-hidden transition-shadow ${className}`}
      style={{
        width: `${tagWidthMm * scale}mm`,
        height: `${tagHeightMm * scale}mm`,
        boxSizing: 'border-box',
        backgroundColor: bgColor,
        border:
          layoutPreset.showBorder !== false && config.showBorder !== false
            ? isYellow
              ? `${Math.max(1.5, 1.5 * scale)}px solid #000000`
              : `${Math.max(1, 1 * scale)}px solid #18181b`
            : '1px dashed #d4d4d8',
      }}
    >
      {/* Corner Cutting Guides */}
      {(layoutPreset.showCutGuides ?? config.showCutGuides) && (
        <>
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-500 pointer-events-none z-30" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-500 pointer-events-none z-30" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-zinc-500 pointer-events-none z-30" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-zinc-500 pointer-events-none z-30" />
        </>
      )}

      {/* DYNAMIC FIELD RENDERING */}
      {activeMetas.map(meta => {
        // Look up field configuration directly or via aliases
        let field = fields?.[meta.id];
        if (!field) {
          if (meta.id === 'price') field = fields?.regularPrice;
          else if (meta.id === 'upc') field = fields?.barcode;
          else if (meta.id === 'date') field = fields?.tagDate;
          else if (meta.id === 'buy' || meta.id === 'uom') field = fields?.buyPerAndUp;
          else if (meta.id === 'per') field = fields?.priceUnit;
        }

        if (!field || field.visible === false) return null;

        const leftMm = field.x * scale;
        const topMm = field.y * scale;
        const widthMm = field.width * scale;
        const heightMm = field.height * scale;

        const fontSizePx = Math.max(6, Math.round(field.fontSizePt * 1.333 * scale));

        return (
          <div
            key={meta.id}
            id={`tag-field-${meta.id}`}
            style={{
              position: 'absolute',
              left: `${leftMm}mm`,
              top: `${topMm}mm`,
              width: `${widthMm}mm`,
              height: `${heightMm}mm`,
              fontFamily: field.fontFamily || 'Arial',
              color: field.textColor || '#000000',
              fontWeight: field.fontWeight === 'bold' ? 800 : 400,
              fontStyle: field.fontStyle || 'normal',
              textDecoration: field.textDecoration || 'none',
              textAlign: field.textAlign || 'left',
              textTransform: field.textTransform || 'none',
              overflow: 'hidden',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent:
                field.verticalAlign === 'middle'
                  ? 'center'
                  : field.verticalAlign === 'bottom'
                  ? 'flex-end'
                  : 'flex-start',
              alignItems:
                field.textAlign === 'center'
                  ? 'center'
                  : field.textAlign === 'right'
                  ? 'flex-end'
                  : 'flex-start',
              paddingTop: `${(field.paddingTopMm || 0) * scale}mm`,
              paddingBottom: `${(field.paddingBottomMm || 0) * scale}mm`,
              paddingLeft: `${(field.paddingLeftMm || 0) * scale}mm`,
              paddingRight: `${(field.paddingRightMm || 0) * scale}mm`,
              border:
                field.borderStyle && field.borderStyle !== 'none'
                  ? `${(field.borderWidthPx || 1) * scale}px ${field.borderStyle} ${field.borderColor || '#000'}`
                  : 'none',
              borderRadius: field.borderRadiusMm ? `${field.borderRadiusMm * scale}mm` : undefined,
              backgroundColor: field.backgroundColor || 'transparent',
              zIndex: meta.id === 'price' ? 10 : 5,
            }}
          >
            {/* 1. DESCRIPTION */}
            {meta.id === 'description' && (
              <div
                className="w-full tracking-tight leading-snug"
                style={{
                  fontSize: `${fontSizePx}px`,
                  lineHeight: field.lineHeightPt
                    ? `${field.lineHeightPt * 1.333 * scale}px`
                    : '1.18',
                  wordBreak: 'break-word',
                  whiteSpace: field.textWrap ? 'normal' : 'nowrap',
                  display: '-webkit-box',
                  WebkitLineClamp: field.maxLines || 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {itemDesc}
              </div>
            )}

            {/* 2. YELLOW UPC (Bold numbers, no barcode lines) */}
            {meta.id === 'upc' && isYellow && (
              <div
                className="w-full font-mono font-black tracking-wider truncate leading-none select-none"
                style={{
                  fontSize: `${fontSizePx}px`,
                  textAlign: field.textAlign || 'right',
                  lineHeight: 1,
                }}
              >
                {itemUpc}
              </div>
            )}

            {/* 3. YELLOW BUY */}
            {meta.id === 'buy' && isYellow && (
              <div
                className="w-full font-black tracking-normal leading-none select-none"
                style={{
                  fontSize: `${fontSizePx}px`,
                  textAlign: field.textAlign || 'left',
                  lineHeight: 1,
                }}
              >
                {itemBuy}
              </div>
            )}

            {/* 4. YELLOW QTY */}
            {meta.id === 'qty' && isYellow && (
              <div
                className="w-full font-black tracking-normal leading-none select-none"
                style={{
                  fontSize: `${fontSizePx}px`,
                  textAlign: field.textAlign || 'left',
                  lineHeight: 1,
                }}
              >
                {itemQty}
              </div>
            )}

            {/* 5. YELLOW UOM */}
            {meta.id === 'uom' && isYellow && (
              <div
                className="w-full font-black tracking-normal leading-none select-none uppercase"
                style={{
                  fontSize: `${fontSizePx}px`,
                  textAlign: field.textAlign || 'left',
                  lineHeight: 1,
                }}
              >
                {itemUom}
              </div>
            )}

            {/* 6. PRICE (Yellow & White - Fixed Piso sign alignment) */}
            {meta.id === 'price' && (
              <div
                className="w-full flex items-baseline leading-none whitespace-nowrap"
                style={{
                  justifyContent:
                    field.textAlign === 'left'
                      ? 'flex-start'
                      : field.textAlign === 'center'
                      ? 'center'
                      : 'flex-end',
                }}
              >
                {field.showCurrencySymbol !== false && (
                  <span
                    className="font-black select-none leading-none mr-0.5"
                    style={{
                      fontSize: `${Math.max(8, Math.round(fontSizePx * 0.72))}px`,
                      lineHeight: 1,
                    }}
                  >
                    {field.currencySymbol || currency}
                  </span>
                )}
                <span
                  className="font-black leading-none whitespace-nowrap"
                  style={{
                    fontSize: `${fontSizePx}px`,
                    lineHeight: 1,
                  }}
                >
                  {field.decimalPlaces === 0
                    ? Math.floor(itemPriceNum).toLocaleString('en-US')
                    : itemPriceNum.toLocaleString('en-US', {
                        minimumFractionDigits: field.decimalPlaces ?? 2,
                        maximumFractionDigits: field.decimalPlaces ?? 2,
                      })}
                </span>
              </div>
            )}

            {/* 7. YELLOW PER */}
            {meta.id === 'per' && isYellow && (
              <div
                className="w-full font-black tracking-normal leading-none select-none uppercase"
                style={{
                  fontSize: `${fontSizePx}px`,
                  textAlign: field.textAlign || 'left',
                  lineHeight: 1,
                }}
              >
                {itemPer}
              </div>
            )}

            {/* 8. WHITE DATE */}
            {meta.id === 'date' && !isYellow && (
              <div
                className="w-full font-bold truncate leading-none select-none"
                style={{
                  fontSize: `${fontSizePx}px`,
                  textAlign: field.textAlign || 'center',
                  lineHeight: 1,
                }}
              >
                {itemDate}
              </div>
            )}

            {/* 9. WHITE LOGO */}
            {meta.id === 'logo' && !isYellow && (
              <div
                className="w-full h-full flex items-center justify-start overflow-hidden select-none"
                style={{ maxHeight: `${heightMm}mm` }}
              >
                <img
                  src={getEffectiveLogoUrl(config.storeLogoUrl)}
                  alt="Prince Retail"
                  className="max-h-full max-w-full object-contain select-none"
                  referrerPolicy="no-referrer"
                  onError={e => {
                    (e.currentTarget as HTMLImageElement).src = PRINCE_LOGO_INLINE_SVG;
                  }}
                />
              </div>
            )}

            {/* 10. WHITE BARCODE (Scannable bars + UPC number) */}
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
                  dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                />
              </div>
            )}

            {/* 11. WHITE SKU */}
            {meta.id === 'sku' && !isYellow && (
              <div
                className="w-full font-mono font-black tracking-wider truncate leading-none select-none uppercase"
                style={{
                  fontSize: `${fontSizePx}px`,
                  textAlign: field.textAlign || 'left',
                  lineHeight: 1,
                }}
              >
                {itemSku}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
