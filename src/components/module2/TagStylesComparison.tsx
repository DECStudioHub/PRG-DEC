import React, { useState, useMemo } from 'react';
import { Module2Config, ShelfTagItem, TagFieldConfig, WhiteTagItem, YellowTagItem } from '../../types';
import { ShelftagCardRenderer } from './ShelftagCardRenderer';
import { YELLOW_PALETTES } from './constants';

interface TagStylesComparisonProps {
  config: Module2Config;
  availableItems?: (YellowTagItem | WhiteTagItem | ShelfTagItem)[];
  sampleWhiteItem?: WhiteTagItem | ShelfTagItem;
  sampleYellowItem?: YellowTagItem | ShelfTagItem;
}

const DEFAULT_SAMPLE_ITEM: YellowTagItem & Partial<WhiteTagItem> & Partial<ShelfTagItem> = {
  id: 'sample-comparison-item',
  description: 'COCA-COLA ORIGINAL TASTE 1.5L PET BOTTLE',
  sku: 'BEV-1001',
  upc: '4800016644021',
  price: 72.0,
  copies: 1,
  buy: 'BUY',
  qty: 3,
  uom: 'PCS AND UP',
  per: '/PC',
  date: '2026-03-30',
  isSelected: true,
};

export const TagStylesComparison: React.FC<TagStylesComparisonProps> = ({
  config,
  availableItems = [],
  sampleWhiteItem,
  sampleYellowItem,
}) => {
  // Combine all items or fallback to sample
  const allAvailable = useMemo(() => {
    const list = [...availableItems];
    if (sampleWhiteItem && !list.some(i => i.id === sampleWhiteItem.id)) {
      list.push(sampleWhiteItem as any);
    }
    if (sampleYellowItem && !list.some(i => i.id === sampleYellowItem.id)) {
      list.push(sampleYellowItem as any);
    }
    return list.length > 0 ? list : [DEFAULT_SAMPLE_ITEM];
  }, [availableItems, sampleWhiteItem, sampleYellowItem]);

  // Selected item ID for comparison
  const [selectedItemId, setSelectedItemId] = useState<string>(allAvailable[0]?.id || DEFAULT_SAMPLE_ITEM.id);

  // Active item for comparison
  const activeItem = useMemo(() => {
    const found = allAvailable.find(i => i.id === selectedItemId);
    return found || allAvailable[0] || DEFAULT_SAMPLE_ITEM;
  }, [allAvailable, selectedItemId]);

  const itemBarcode = useMemo(() => {
    if ('upc' in activeItem && activeItem.upc) return activeItem.upc;
    if ('barcode' in activeItem && (activeItem as any).barcode) return (activeItem as any).barcode;
    return '480000000000';
  }, [activeItem]);

  const itemPrice = useMemo(() => {
    if ('price' in activeItem && typeof activeItem.price === 'number') return activeItem.price;
    if ('regularPrice' in activeItem && typeof (activeItem as any).regularPrice === 'number') return (activeItem as any).regularPrice;
    return 0;
  }, [activeItem]);

  // Normalized White Item representation
  const whiteItem: WhiteTagItem = useMemo(() => {
    return {
      id: `${activeItem.id}-white`,
      description: activeItem.description || 'PRODUCT DESCRIPTION',
      sku: ('sku' in activeItem && activeItem.sku) ? activeItem.sku : 'SKU-00100',
      upc: itemBarcode,
      price: itemPrice,
      date: ('date' in activeItem && (activeItem as any).date) ? (activeItem as any).date : (('tagDate' in activeItem && (activeItem as any).tagDate) ? (activeItem as any).tagDate : '2026-03-30'),
      copies: activeItem.copies || 1,
      isSelected: true,
    };
  }, [activeItem, itemBarcode, itemPrice]);

  // Normalized Yellow Item representation
  const yellowItem: YellowTagItem = useMemo(() => {
    return {
      id: `${activeItem.id}-yellow`,
      description: activeItem.description || 'PRODUCT DESCRIPTION',
      upc: itemBarcode,
      buy: ('buy' in activeItem && activeItem.buy) ? activeItem.buy : 'BUY',
      qty: ('qty' in activeItem && activeItem.qty) ? activeItem.qty : 3,
      uom: ('uom' in activeItem && activeItem.uom) ? activeItem.uom : 'PCS AND UP',
      price: itemPrice,
      per: ('per' in activeItem && activeItem.per) ? activeItem.per : '/PC',
      copies: activeItem.copies || 1,
      isSelected: true,
    };
  }, [activeItem, itemBarcode, itemPrice]);

  // Specs
  const whiteConfig = config.shelftagConfig || config;
  const yellowConfig = config.ppTagConfig || config;

  const whiteWidth = whiteConfig.tagWidthMm || config.tagWidthMm || 60;
  const whiteHeight = whiteConfig.tagHeightMm || config.tagHeightMm || 42;
  const yellowWidth = yellowConfig.tagWidthMm || config.tagWidthMm || 60;
  const yellowHeight = yellowConfig.tagHeightMm || config.tagHeightMm || 42;

  const whiteFields = whiteConfig.fields ? (Object.values(whiteConfig.fields) as TagFieldConfig[]) : [];
  const whiteVisibleFields = whiteFields.filter(f => f.visible !== false).length;

  const yellowFields = yellowConfig.fields ? (Object.values(yellowConfig.fields) as TagFieldConfig[]) : [];
  const yellowVisibleFields = yellowFields.filter(f => f.visible !== false).length;

  const activePaletteId = yellowConfig.yellowPalette || config.yellowPalette || 'golden';
  const paletteInfo = YELLOW_PALETTES.find(p => p.id === activePaletteId) || YELLOW_PALETTES[0];

  return (
    <div className="bg-[#18181b] rounded-2xl p-5 sm:p-6 border border-zinc-800 shadow-xl overflow-hidden text-xs">
      {/* Header & Item Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-zinc-800">
        <div>
          <h3 className="text-xs font-black tracking-wider text-amber-500 uppercase">
            TAG STYLES LIVE COMPARISON (AT EXACT CONFIGURED SIZE)
          </h3>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Compare White Tag (Regular Retail) and Yellow Tag (Promo Price Point) with identical product data in real-time.
          </p>
        </div>

        {/* Item Selector Dropdown */}
        {allAvailable.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-zinc-400">Comparing SKU:</span>
            <select
              value={selectedItemId}
              onChange={e => setSelectedItemId(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500 max-w-[220px] truncate"
            >
              {allAvailable.map(item => (
                <option key={item.id} value={item.id}>
                  {item.description} ({item.upc})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Side-by-side display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* White Tag Preview */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-between w-full max-w-[320px]">
            <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-white border border-zinc-400 inline-block" />
              White Tag (Regular Retail Price)
            </span>
            <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
              {whiteWidth} × {whiteHeight} mm
            </span>
          </div>

          <div className="shadow-lg rounded-sm overflow-hidden flex items-center justify-center bg-zinc-950 p-3 border border-zinc-800 w-full min-h-[160px]">
            <ShelftagCardRenderer
              item={whiteItem}
              config={config}
              tagTypeOverride="white"
              scale={1}
            />
          </div>

          {/* White Tag Dimensional Specs */}
          <div className="w-full max-w-[320px] bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 text-[11px] space-y-1.5 text-zinc-400">
            <div className="flex justify-between">
              <span>Physical Size:</span>
              <strong className="text-zinc-200 font-mono">{whiteWidth} mm × {whiteHeight} mm</strong>
            </div>
            <div className="flex justify-between">
              <span>Configured Fields:</span>
              <strong className="text-zinc-200">{whiteVisibleFields} visible / {whiteFields.length || 6} total</strong>
            </div>
            <div className="flex justify-between">
              <span>Barcode Format:</span>
              <strong className="text-zinc-200 font-mono">{config.barcodeFormat || 'CODE128'}</strong>
            </div>
            <div className="flex justify-between">
              <span>Store Branding:</span>
              <strong className="text-emerald-400">{config.showLogo ? 'Prince Retail Logo' : 'Hidden'}</strong>
            </div>
          </div>
        </div>

        {/* Yellow Tag Preview */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-between w-full max-w-[320px]">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              Yellow Tag (Promo / PP Price Point)
            </span>
            <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
              {yellowWidth} × {yellowHeight} mm
            </span>
          </div>

          <div className="shadow-lg rounded-sm overflow-hidden flex items-center justify-center bg-zinc-950 p-3 border border-zinc-800 w-full min-h-[160px]">
            <ShelftagCardRenderer
              item={yellowItem}
              config={config}
              tagTypeOverride="yellow"
              scale={1}
            />
          </div>

          {/* Yellow Tag Dimensional Specs */}
          <div className="w-full max-w-[320px] bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 text-[11px] space-y-1.5 text-zinc-400">
            <div className="flex justify-between">
              <span>Physical Size:</span>
              <strong className="text-amber-300 font-mono">{yellowWidth} mm × {yellowHeight} mm</strong>
            </div>
            <div className="flex justify-between">
              <span>Configured Fields:</span>
              <strong className="text-amber-300">{yellowVisibleFields} visible / {yellowFields.length || 6} total</strong>
            </div>
            <div className="flex justify-between">
              <span>Active Palette:</span>
              <strong className="text-amber-300">{paletteInfo.name} ({paletteInfo.bgHex})</strong>
            </div>
            <div className="flex justify-between">
              <span>Promo Structure:</span>
              <strong className="text-amber-300 font-mono">BUY {yellowItem.qty} {yellowItem.uom}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
