import { jsPDF } from 'jspdf';
import {
  Module2Config,
  ShelfTagItem,
  YellowTagItem,
  WhiteTagItem,
} from '../types';
import { generateBarcodeDataUrl } from './barcode';
import { YELLOW_PALETTES } from '../components/module2/constants';
import {
  createDefaultYellowTagFields,
  createDefaultWhiteTagFields,
  YELLOW_TAG_FIELD_METAS,
  WHITE_TAG_FIELD_METAS,
} from '../components/module2/fieldDefaults';
import { computeShelftagSheetLayout } from './shelftagLayoutEngine';
import { getEffectivePrintItems } from './shelftagExpansion';
import { getFormattedTodayDate } from './module2ExcelService';

export interface ShelftagPdfProgress {
  currentPage: number;
  totalPages: number;
  percent: number;
}

export async function generateShelftagPdf(
  items: (YellowTagItem | WhiteTagItem | ShelfTagItem)[],
  config: Module2Config,
  onProgress?: (progress: ShelftagPdfProgress) => void,
  tagTypeOverride?: 'yellow' | 'white'
): Promise<jsPDF> {
  const selectedItems = items.filter(i => i.isSelected !== false);
  const printItems = getEffectivePrintItems(selectedItems as any, config.layoutOption);
  if (printItems.length === 0) {
    throw new Error('No items selected to print. Please select at least one tag.');
  }

  // Use the shared layout calculation engine
  const layout = computeShelftagSheetLayout(config, printItems.length);

  const pageWidth = layout.paperWidthMm;
  const pageHeight = layout.paperHeightMm;
  const orientation = layout.orientation;
  const tagsPerPage = layout.tagsPerSheet;
  const totalPages = layout.totalPages;

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: [pageWidth, pageHeight],
    compress: true,
  });

  const tagWidth = layout.tagWidthMm;
  const tagHeight = layout.tagHeightMm;

  // Barcode image cache for White Tags
  const barcodeCache = new Map<string, string>();
  const getBarcode = (val: string, format?: any, showText?: boolean): string => {
    const key = `${val}_${format}_${showText}`;
    if (barcodeCache.has(key)) return barcodeCache.get(key)!;
    const url = generateBarcodeDataUrl(val, format || config.barcodeFormat || 'CODE128', 45);
    if (url) barcodeCache.set(key, url);
    return url;
  };

  const currency = config.currencySymbol || '₱';

  for (let i = 0; i < printItems.length; i++) {
    const item = printItems[i] as any;
    const pageIndex = Math.floor(i / tagsPerPage);
    const indexOnPage = i % tagsPerPage;

    if (i > 0 && indexOnPage === 0) {
      doc.addPage([pageWidth, pageHeight], 'portrait');
    }

    if (onProgress && indexOnPage === 0) {
      onProgress({
        currentPage: pageIndex + 1,
        totalPages,
        percent: Math.round(((pageIndex + 1) / totalPages) * 100),
      });
    }

    const placement = layout.getTagPlacement(indexOnPage);
    const x = placement.xMm;
    const y = placement.yMm;

    // Determine if Yellow or White
    const isYellow =
      tagTypeOverride === 'yellow' ||
      item.tagStyle === 'yellow' ||
      ('qty' in item && !('sku' in item && item.sku)) ||
      config.activeTagType === 'pp_tag';

    // 1. Tag Background
    if (isYellow) {
      const palId = config.yellowPalette || 'golden';
      const activePalette =
        YELLOW_PALETTES.find(p => p.id === palId) || YELLOW_PALETTES[0];
      const yellowHex = activePalette.bgHex;
      const rYellow = parseInt(yellowHex.slice(1, 3), 16) || 254;
      const gYellow = parseInt(yellowHex.slice(3, 5), 16) || 237;
      const bYellow = parseInt(yellowHex.slice(5, 7), 16) || 1;
      doc.setFillColor(rYellow, gYellow, bYellow);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.rect(x, y, tagWidth, tagHeight, 'F');

    // Tag Border
    if (config.showBorder !== false) {
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(isYellow ? 0.35 : 0.2);
      doc.rect(x, y, tagWidth, tagHeight, 'S');
    }

    // Cutting Guides
    if (config.showCutGuides) {
      doc.setDrawColor(160, 160, 160);
      doc.setLineWidth(0.15);
      const mLen = 2;
      doc.line(x - 0.5, y, x - 0.5 - mLen, y);
      doc.line(x, y - 0.5, x, y - 0.5 - mLen);
      doc.line(x + tagWidth + 0.5, y, x + tagWidth + 0.5 + mLen, y);
      doc.line(x + tagWidth, y - 0.5, x + tagWidth, y - 0.5 - mLen);
      doc.line(x - 0.5, y + tagHeight, x - 0.5 - mLen, y + tagHeight);
      doc.line(x, y + tagHeight + 0.5, x, y + tagHeight + 0.5 + mLen);
      doc.line(x + tagWidth + 0.5, y + tagHeight, x + tagWidth + 0.5 + mLen, y + tagHeight);
      doc.line(x + tagWidth, y + tagHeight + 0.5, x + tagWidth, y + tagHeight + 0.5 + mLen);
    }

    // Fields lookup
    const activePreset = isYellow
      ? config.ppTagConfig || {
          fields: createDefaultYellowTagFields(tagWidth, tagHeight),
        }
      : config.shelftagConfig || {
          fields: createDefaultWhiteTagFields(tagWidth, tagHeight),
        };

    const fields = activePreset.fields;

    // Field value extraction
    const itemUpc = item.upc || item.barcode || item.sku || '';
    const itemDesc = item.description || '';
    const itemQty = item.qty != null ? String(item.qty) : '3';
    const itemBuy = item.buy || 'BUY';
    const itemUom = item.uom || 'PCS AND UP';
    const itemPer = item.per || '/PC';
    const itemSku = item.sku || itemUpc.slice(-6);
    const itemDate = item.date || item.tagDate || getFormattedTodayDate();

    let itemPrice = 0;
    if (typeof item.price === 'number') itemPrice = item.price;
    else if (typeof item.promoPrice === 'number' && item.promoPrice > 0) itemPrice = item.promoPrice;
    else if (typeof item.regularPrice === 'number') itemPrice = item.regularPrice;

    // =========================================================================
    // YELLOW TAG RENDERING (7 Dedicated Fields)
    // =========================================================================
    if (isYellow) {
      // 1. UPC Field (bold text numbers, strictly NO barcode lines)
      const upcField = fields?.upc || fields?.barcode;
      if (upcField && upcField.visible !== false) {
        doc.setTextColor(0, 0, 0);
        doc.setFont('courier', 'bold');
        doc.setFontSize(upcField.fontSizePt || 12);
        const upcX = x + upcField.x + upcField.width;
        const upcY = y + upcField.y + upcField.height * 0.8;
        doc.text(itemUpc, upcX, upcY, { align: 'right' });
      }

      // 2. Description
      const descField = fields?.description;
      if (descField && descField.visible !== false) {
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', descField.fontWeight === 'bold' ? 'bold' : 'normal');
        doc.setFontSize(descField.fontSizePt || 9.5);
        const splitDesc = doc.splitTextToSize(itemDesc.toUpperCase(), descField.width);
        doc.text(splitDesc.slice(0, descField.maxLines || 2), x + descField.x, y + descField.y + (descField.fontSizePt * 0.35));
      }

      // 3. BUY
      const buyField = fields?.buy;
      if (buyField && buyField.visible !== false) {
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(buyField.fontSizePt || 14);
        doc.text(itemBuy, x + buyField.x, y + buyField.y + buyField.height * 0.8);
      }

      // 4. QTY
      const qtyField = fields?.qty;
      if (qtyField && qtyField.visible !== false) {
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(qtyField.fontSizePt || 14);
        doc.text(itemQty, x + qtyField.x, y + qtyField.y + qtyField.height * 0.8);
      }

      // 5. UOM
      const uomField = fields?.uom;
      if (uomField && uomField.visible !== false) {
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(uomField.fontSizePt || 8.5);
        doc.text(itemUom, x + uomField.x, y + uomField.y + uomField.height * 0.8);
      }

      // 6. Price (Aligned Piso sign with price digits)
      const priceField = fields?.price || fields?.regularPrice;
      if (priceField && priceField.visible !== false) {
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(priceField.fontSizePt || 26);
        const symStr = priceField.showCurrencySymbol !== false ? (priceField.currencySymbol || currency) : '';
        const numStr = priceField.decimalPlaces === 0 ? Math.floor(itemPrice).toString() : itemPrice.toFixed(priceField.decimalPlaces ?? 2);
        const fullPriceStr = symStr ? `${symStr} ${numStr}` : numStr;
        const pX = x + priceField.x + priceField.width;
        const pY = y + priceField.y + priceField.height * 0.85;
        doc.text(fullPriceStr, pX, pY, { align: 'right' });
      }

      // 7. PER
      const perField = fields?.per || fields?.priceUnit;
      if (perField && perField.visible !== false) {
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(perField.fontSizePt || 8.5);
        doc.text(itemPer, x + perField.x, y + perField.y + perField.height * 0.8);
      }
    } else {
      // =======================================================================
      // WHITE TAG RENDERING (6 Dedicated Fields)
      // =======================================================================
      // 1. Description
      const descField = fields?.description;
      if (descField && descField.visible !== false) {
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', descField.fontWeight === 'bold' ? 'bold' : 'normal');
        doc.setFontSize(descField.fontSizePt || 8.5);
        const splitDesc = doc.splitTextToSize(itemDesc.toUpperCase(), descField.width);
        doc.text(splitDesc.slice(0, descField.maxLines || 2), x + descField.x, y + descField.y + (descField.fontSizePt * 0.35));
      }

      // 2. Date
      const dateField = fields?.date || fields?.tagDate;
      if (dateField && dateField.visible !== false) {
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(dateField.fontSizePt || 7);
        const align = (dateField.textAlign as any) || 'center';
        const dX = align === 'center' ? x + dateField.x + (dateField.width / 2) : (align === 'left' ? x + dateField.x : x + dateField.x + dateField.width);
        const dY = y + dateField.y + dateField.height * 0.75;
        doc.text(itemDate, dX, dY, { align });
      }

      // 3. Price (Aligned Piso sign with price digits)
      const priceField = fields?.price || fields?.regularPrice;
      if (priceField && priceField.visible !== false) {
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(priceField.fontSizePt || 20);
        const symStr = priceField.showCurrencySymbol !== false ? (priceField.currencySymbol || currency) : '';
        const numStr = priceField.decimalPlaces === 0 ? Math.floor(itemPrice).toString() : itemPrice.toFixed(priceField.decimalPlaces ?? 2);
        const fullPriceStr = symStr ? `${symStr} ${numStr}` : numStr;
        const pX = x + priceField.x + priceField.width;
        const pY = y + priceField.y + priceField.height * 0.82;
        doc.text(fullPriceStr, pX, pY, { align: 'right' });
      }

      // 4. Logo
      const logoField = fields?.logo;
      if (logoField && logoField.visible !== false) {
        doc.setTextColor(227, 27, 35);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(logoField.fontSizePt || 8);
        doc.text('PRINCE', x + logoField.x, y + logoField.y + logoField.height * 0.75);
      }

      // 5. Barcode (Scannable bars + UPC text)
      const barcodeField = fields?.barcode;
      if (barcodeField && barcodeField.visible !== false) {
        const bImg = getBarcode(itemUpc, barcodeField.barcodeFormat || config.barcodeFormat || 'CODE128', barcodeField.showBarcodeText !== false);
        const bX = x + barcodeField.x;
        const bY = y + barcodeField.y;
        const bW = barcodeField.width;
        const bH = barcodeField.height;
        if (bImg) {
          try {
            doc.addImage(bImg, 'PNG', bX, bY, bW, bH);
          } catch {
            doc.setFont('courier', 'normal');
            doc.setFontSize(6);
            doc.text(itemUpc, bX, bY + bH);
          }
        }
      }

      // 6. SKU
      const skuField = fields?.sku;
      if (skuField && skuField.visible !== false) {
        doc.setTextColor(0, 0, 0);
        doc.setFont('courier', 'bold');
        doc.setFontSize(skuField.fontSizePt || 8.5);
        doc.text(itemSku, x + skuField.x, y + skuField.y + skuField.height * 0.75);
      }
    }
  }

  return doc;
}
