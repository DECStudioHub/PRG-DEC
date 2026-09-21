import React, { useMemo, useState } from 'react';
import { InventoryItem, LayoutConfig } from '../types';
import { generateBarcodeSvgString, generateLocatorBarcodeSvgString } from '../utils/barcode';
import { DEFAULT_PRINCE_LOGO } from '../utils/theme';

interface ShelfTagProps {
  item: InventoryItem;
  config: LayoutConfig;
  scale?: number;
  className?: string;
}

export const ShelfTag: React.FC<ShelfTagProps> = ({
  item,
  config,
  scale = 1,
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  const barcodeSvg = useMemo(() => {
    const widthMm = Number(config.barcodeWidthMm) > 0 ? Number(config.barcodeWidthMm) : 42;
    const showText = config.showBarcodeText !== false;
    return generateBarcodeSvgString(
      item.barcode || item.upcNo,
      config.barcodeType,
      Math.max(28, Math.round(config.barcodeHeightMm * 2.8)),
      showText,
      11,
      widthMm
    );
  }, [
    item.barcode,
    item.upcNo,
    config.barcodeType,
    config.barcodeHeightMm,
    config.barcodeWidthMm,
    config.showBarcodeText,
  ]);

  const locatorBarcodeSvg = useMemo(() => {
    if (config.locatorBarcodeEnabled === false) return '';
    const locValue = String(item.locator || 'BA-A1-B21L').trim();
    if (!locValue) return '';
    const widthMm = Number(config.locatorBarcodeWidthMm) > 0 ? Number(config.locatorBarcodeWidthMm) : 42;
    const heightMm = Number(config.locatorBarcodeHeightMm) > 0 ? Number(config.locatorBarcodeHeightMm) : 10;
    const showText = config.showLocatorText !== false;
    const fontSize = Math.max(7.5, Math.round((config.fontSizeLocator || 10.5) * 0.75));

    return generateLocatorBarcodeSvgString(
      locValue,
      'CODE128',
      heightMm,
      1.5,
      showText,
      fontSize,
      widthMm
    );
  }, [
    item.locator,
    config.locatorBarcodeEnabled,
    config.locatorBarcodeWidthMm,
    config.locatorBarcodeHeightMm,
    config.showLocatorText,
    config.fontSizeLocator,
  ]);

  const isBlank = config.printBlankCountFields;

  const isCustomImage = useMemo(() => {
    if (!config.logoUrl || imgError) return false;
    const url = config.logoUrl.trim();
    if (
      url === DEFAULT_PRINCE_LOGO ||
      url === '/prince-logo.svg' ||
      url === 'prince-logo.svg' ||
      url === '/prince-logo.jpg' ||
      url === 'prince-logo.jpg' ||
      url === 'prince' ||
      url === 'default' ||
      url.endsWith('/prince-logo.svg') ||
      url.endsWith('/prince-logo.jpg')
    ) {
      return false;
    }
    return url.startsWith('data:image/') || url.startsWith('blob:') || url.startsWith('http://') || url.startsWith('https://');
  }, [config.logoUrl, imgError]);

  return (
    <div
      className={`relative bg-white flex flex-col justify-between select-none overflow-hidden ${
        config.showBorders ? 'border-2 border-black' : 'border border-dashed border-zinc-300'
      } ${className}`}
      style={{
        width: `${config.tagWidthMm * scale}mm`,
        height: `${config.tagHeightMm * scale}mm`,
        boxSizing: 'border-box',
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Cut Guides Corner markers */}
      {config.showCutGuides && (
        <>
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-400 pointer-events-none" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-400 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-zinc-400 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-zinc-400 pointer-events-none" />
        </>
      )}

      {/* 1. Header: LOCATOR BARCODE & LOGO (aligned on top) */}
      <div
        className={`px-2 py-1 flex items-center justify-between border-b-2 border-black ${
          config.headerStyle === 'filled' ? 'bg-zinc-100' : 'bg-white'
        }`}
        style={{
          minHeight: `${
            (config.locatorBarcodeEnabled !== false
              ? Math.max(10, (config.locatorBarcodeHeightMm || 10) + 2.5, (config.logoHeightMm || 6.5) + 1.2)
              : Math.max(7.5, (config.logoHeightMm || 6.5) + 1.2)
            ) * scale
          }mm`,
        }}
      >
        {/* Left Side: Scanner-Readable Locator Barcode (or text fallback if disabled) */}
        {config.locatorBarcodeEnabled !== false ? (
          <div
            className="flex items-center justify-start overflow-hidden"
            style={{
              width: `${(config.locatorBarcodeWidthMm ?? 42) * scale}mm`,
              height: `${(config.locatorBarcodeHeightMm ?? 10) * scale}mm`,
              maxWidth: '76%',
            }}
          >
            {locatorBarcodeSvg ? (
              <div
                className="flex items-center justify-start w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain"
                dangerouslySetInnerHTML={{ __html: locatorBarcodeSvg }}
              />
            ) : (
              <div className="font-mono text-[10px] font-bold text-black border border-zinc-400 px-1 py-0.5">
                {item.locator || 'BA-A1-B21L'}
              </div>
            )}
          </div>
        ) : (
          <div
            className="font-extrabold tracking-tight text-black flex items-center gap-1"
            style={{ fontSize: `${config.fontSizeLocator * scale}px` }}
          >
            <span className="font-black">Locator:</span>
            <span className="font-mono bg-black text-white px-1.5 py-0.2 rounded-xs font-bold text-[0.95em]">
              {item.locator || 'A00-00'}
            </span>
          </div>
        )}

        {/* Upper Right: Tag # & Prince Logo */}
        <div className="flex items-center gap-1.5 shrink-0">
          {config.showTagNumber !== false && (
            <span
              className="font-mono uppercase text-zinc-600 font-bold"
              style={{ fontSize: `${Math.max(7, config.fontSizeLocator * 0.58 * scale)}px` }}
            >
              #{item.rawRowIndex ? String(item.rawRowIndex - 1).padStart(3, '0') : '001'}
            </span>
          )}

          {config.showLogo !== false && (
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: `${(config.logoHeightMm || 6.5) * scale}mm`,
                height: `${(config.logoHeightMm || 6.5) * scale}mm`,
              }}
              title="Prince Retail"
            >
              {isCustomImage ? (
                <img
                  src={config.logoUrl!}
                  alt="Store Logo"
                  className="w-full h-full object-contain rounded-full"
                  onError={() => setImgError(true)}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <svg
                  viewBox="0 0 200 200"
                  className="w-full h-full rounded-full shadow-2xs"
                  style={{ display: 'block' }}
                >
                  <circle cx="100" cy="100" r="100" fill="#FEED01" />
                  <polygon points="100,56 126,76 113,76 100,66 87,76 74,76" fill="#E31B23" />
                  <text
                    x="100"
                    y="110"
                    fill="#E31B23"
                    textAnchor="middle"
                    fontFamily="system-ui, -apple-system, 'Arial Black', Impact, sans-serif"
                    fontWeight="900"
                    fontStyle="italic"
                    fontSize="47"
                    letterSpacing="-1.5px"
                  >
                    prince
                  </text>
                  <polygon points="22,117 178,117 188,125 12,125" fill="#E31B23" />
                </svg>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Middle Section: SKU & UPC, Item Description, Barcode, and Prominent COUNT Box */}
      <div className="px-2 py-1 flex-1 flex flex-col justify-between items-center min-h-0 w-full">
        {/* SKU (Left) & UPC (Right) */}
        <div className="w-full flex justify-between items-center text-black font-semibold pt-0.5"
             style={{ fontSize: `${config.fontSizeSku * scale}px` }}>
          <div>
            <span className="text-zinc-600 font-semibold">SKU: </span>
            <span className="font-bold">{item.sku || 'N/A'}</span>
          </div>
          <div>
            <span className="text-zinc-600 font-semibold">UPC: </span>
            <span className="font-mono font-bold">{item.upcNo || item.barcode || 'N/A'}</span>
          </div>
        </div>

        {/* Item Description (Compact) */}
        <div
          className="w-full font-bold text-zinc-900 leading-tight line-clamp-1 uppercase tracking-tight text-center my-0.5"
          style={{ fontSize: `${Math.max(8, config.fontSizeDesc * 0.85 * scale)}px` }}
          title={item.description}
        >
          {item.description || 'UNTITLED ITEM'}
        </div>

        {/* Barcode & COUNT Box Group (Cohesive layout with adjustable spacing) */}
        <div className="w-full flex flex-col items-center justify-center my-auto">
          {/* Barcode Graphic */}
          <div
            className="flex items-center justify-center overflow-hidden max-w-full"
            style={{
              height: `${(config.barcodeHeightMm || 14) * scale * 0.92}mm`,
              width: `${(config.barcodeWidthMm || 42) * scale}mm`,
              maxWidth: '96%',
            }}
          >
            {barcodeSvg ? (
              <div
                className="flex items-center justify-center w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain"
                dangerouslySetInnerHTML={{ __html: barcodeSvg }}
              />
            ) : (
              <div className="text-center font-mono text-[10px] py-0.5 border border-zinc-300 w-full bg-zinc-50">
                * {item.barcode || item.upcNo || 'NO BARCODE'} *
              </div>
            )}
          </div>

          {/* Prominent COUNT Box (Adjustable Height, Width, Gap, Font, Border) */}
          <div
            className="rounded-xs bg-zinc-50/80 px-2 flex items-center justify-between transition-all"
            style={{
              width: `${Math.min(100, Math.max(60, config.countBoxWidthPercent ?? 94))}%`,
              height: `${(config.countBoxHeightMm ?? 12) * scale}mm`,
              marginTop: `${(config.countBoxGapTopMm ?? 2.5) * scale}mm`,
              border: `${Math.max(1, config.countBoxBorderWidth ?? 2)}px solid black`,
              boxSizing: 'border-box',
            }}
          >
            <span
              className="font-black tracking-wider text-black uppercase select-none shrink-0"
              style={{ fontSize: `${Math.max(8, (config.countBoxFontSize ?? 13) * 0.65 * scale)}px` }}
            >
              COUNT
            </span>
            <div
              className="flex-1 text-center font-mono font-black text-black"
              style={{ fontSize: `${(config.countBoxFontSize ?? 13) * scale}px` }}
            >
              {!isBlank && item.count !== undefined && item.count !== '' ? item.count : ''}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Personnel Lines: Counter, Scanner, Validator */}
      <div
        className="border-t-2 border-black bg-white px-2 py-1.5 flex flex-col justify-around text-black font-semibold shrink-0"
        style={{
          fontSize: `${config.fontSizeFields * scale}px`,
          minHeight: `${22 * scale}mm`,
        }}
      >
        {/* Counter : _________ */}
        <div className="flex items-end gap-1.5 my-0.5">
          <span className="font-bold text-zinc-900 shrink-0">Counter :</span>
          <div className="flex-1 border-b border-black pb-0.5 min-h-[14px] flex items-center">
            {!isBlank && item.counter && (
              <span className="text-zinc-900 font-medium pl-1 text-[0.95em]">{item.counter}</span>
            )}
          </div>
        </div>

        {/* Scanner : _________ */}
        <div className="flex items-end gap-1.5 my-0.5">
          <span className="font-bold text-zinc-900 shrink-0">Scanner :</span>
          <div className="flex-1 border-b border-black pb-0.5 min-h-[14px] flex items-center">
            {!isBlank && item.scanner && (
              <span className="text-zinc-900 font-medium pl-1 text-[0.95em]">{item.scanner}</span>
            )}
          </div>
        </div>

        {/* Validator : _________ */}
        <div className="flex items-end gap-1.5 my-0.5">
          <span className="font-bold text-zinc-900 shrink-0">Validator :</span>
          <div className="flex-1 border-b border-black pb-0.5 min-h-[14px] flex items-center">
            {!isBlank && item.validator && (
              <span className="text-zinc-900 font-medium pl-1 text-[0.95em]">{item.validator}</span>
            )}
          </div>
        </div>

        {/* Tag Branding Footer */}
        <div
          className="text-center font-sans font-medium text-zinc-900 select-none pointer-events-none pt-0.5 tracking-tight leading-none"
          style={{
            fontSize: `${Math.max(5.5, 6 * scale)}px`,
            opacity: 0.3,
          }}
        >
          Powered by: DECStudioHub
        </div>
      </div>
    </div>
  );
};
