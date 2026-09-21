import { jsPDF } from 'jspdf';
import { InventoryItem, LayoutConfig, InventorySession } from '../types';
import { generateBarcodeDataUrl, generateLocatorBarcodeDataUrl } from './barcode';
import { packCountTagPages } from './countTagLayoutEngine';

export interface GeneratePdfProgress {
  currentPage: number;
  totalPages: number;
  percent: number;
}

export interface PdfExportResult {
  doc: jsPDF;
  blob: Blob;
  blobUrl: string;
  filename: string;
  totalPages: number;
  totalTags: number;
}

export async function generateShelfTagsPdf(
  items: InventoryItem[],
  config: LayoutConfig,
  session: InventorySession,
  onProgress?: (progress: GeneratePdfProgress) => void
): Promise<jsPDF> {
  const selectedItems = items.filter(it => it.isSelected !== false);
  if (selectedItems.length === 0) {
    throw new Error('No items selected for printing. Please select at least one item.');
  }

  // Determine paper dimensions
  let pageWidth = 210;
  let pageHeight = 297;

  if (config.paperSize === 'LETTER') {
    pageWidth = 215.9;
    pageHeight = 279.4;
  } else if (config.paperSize === 'CUSTOM') {
    pageWidth = Math.max(50, Number(config.customWidthMm) || 210);
    pageHeight = Math.max(50, Number(config.customHeightMm) || 297);
  }

  if (config.orientation === 'landscape') {
    const temp = pageWidth;
    pageWidth = pageHeight;
    pageHeight = temp;
  }

  const doc = new jsPDF({
    orientation: config.orientation,
    unit: 'mm',
    format: [pageWidth, pageHeight],
    compress: true,
  });

  const marginLeft = Math.max(0, Number(config.marginLeftMm) || 0);
  const marginRight = Math.max(0, Number(config.marginRightMm) || 0);
  const marginTop = Math.max(0, Number(config.marginTopMm) || 0);
  const marginBottom = Math.max(0, Number(config.marginBottomMm) || 0);

  const availableWidth = Math.max(20, pageWidth - marginLeft - marginRight);
  const availableHeight = Math.max(20, pageHeight - marginTop - marginBottom);

  // Calculate rows and columns
  const cols = Math.max(1, Math.floor(Number(config.columns) || 2));
  const tagWidth = Math.max(20, Number(config.tagWidthMm) || 98);
  const tagHeight = Math.max(20, Number(config.tagHeightMm) || 85);
  const gapX = Math.max(0, Number(config.gapColMm) || 0);
  const gapY = Math.max(0, Number(config.gapRowMm) || 0);

  // Calculate how many rows fit on one page
  const rows = Math.max(1, Math.floor((availableHeight + gapY) / (tagHeight + gapY)));
  const tagsPerPage = Math.max(1, cols * rows);

  // Intelligent Count Tag Packing (Locator grouped, Description A-Z, paper-saving packed)
  const packedPages = packCountTagPages(selectedItems, tagsPerPage);
  const totalPages = Math.max(1, packedPages.length);

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    if (pageIdx > 0) {
      doc.addPage([pageWidth, pageHeight], config.orientation);
    }

    if (onProgress) {
      onProgress({
        currentPage: pageIdx + 1,
        totalPages,
        percent: Math.round(((pageIdx + 1) / totalPages) * 100),
      });
    }

    // Optional page header with session information if configured
    if (config.showSessionHeader && session.branch) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      const sessionText = `${session.branch || 'Branch'} | ${session.store || 'Store'} | Inv Date: ${session.inventoryDate || 'N/A'} | Prep: ${session.preparedBy || 'N/A'} | Page ${pageIdx + 1}/${totalPages}`;
      doc.text(sessionText, marginLeft, Math.max(3, marginTop - 2));
    }

    const pageData = packedPages[pageIdx];
    const pageItems = pageData ? pageData.items : [];

    for (let i = 0; i < pageItems.length; i++) {
      const item = pageItems[i];
      const colIdx = i % cols;
      const rowIdx = Math.floor(i / cols);

      const x = marginLeft + colIdx * (tagWidth + gapX);
      const y = marginTop + rowIdx * (tagHeight + gapY);

      // Render individual tag
      await renderSingleTagToPdf(doc, item, x, y, tagWidth, tagHeight, config, session);

      // Render cut guides if enabled
      if (config.showCutGuides) {
        renderCutGuides(doc, x, y, tagWidth, tagHeight);
      }
    }
  }

  return doc;
}

function renderCutGuides(doc: jsPDF, x: number, y: number, w: number, h: number) {
  try {
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.15);
    if (typeof doc.setLineDashPattern === 'function') {
      doc.setLineDashPattern([1, 2], 0);
    }

    // Small corner ticks
    const tick = 2.5;
    // Top left
    doc.line(x - tick, y, x, y);
    doc.line(x, y - tick, x, y);
    // Top right
    doc.line(x + w, y, x + w + tick, y);
    doc.line(x + w, y - tick, x + w, y);
    // Bottom left
    doc.line(x - tick, y + h, x, y + h);
    doc.line(x, y + h, x, y + h + tick);
    // Bottom right
    doc.line(x + w, y + h, x + w + tick, y + h);
    doc.line(x + w, y + h, x + w, y + h + tick);

    if (typeof doc.setLineDashPattern === 'function') {
      doc.setLineDashPattern([], 0);
    }
  } catch {
    // Ignore cut guide drawing glitches
  }
}

async function renderSingleTagToPdf(
  doc: jsPDF,
  item: InventoryItem,
  x: number,
  y: number,
  w: number,
  h: number,
  config: LayoutConfig,
  _session: InventorySession
) {
  // Border
  if (config.showBorders) {
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.rect(x, y, w, h);
  }

  // Header: LOCATOR BARCODE & LOGO
  const isLocBarcodeEnabled = config.locatorBarcodeEnabled !== false;
  const locBarcodeHeight = Number(config.locatorBarcodeHeightMm) > 0 ? Number(config.locatorBarcodeHeightMm) : 10;
  const locBarcodeWidth = Number(config.locatorBarcodeWidthMm) > 0 ? Number(config.locatorBarcodeWidthMm) : 42;
  const headerHeight = isLocBarcodeEnabled
    ? Math.max(10, locBarcodeHeight + 2.5, Number(config.logoHeightMm) ? Number(config.logoHeightMm) + 1.2 : 0, h * 0.14)
    : Math.max(7.5, Number(config.logoHeightMm) ? Number(config.logoHeightMm) + 1.2 : 0, h * 0.13);

  if (config.headerStyle === 'filled') {
    doc.setFillColor(235, 238, 242);
    doc.rect(x, y, w, headerHeight, 'F');
  }

  // Divider below locator header
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(x, y + headerHeight, x + w, y + headerHeight);

  // Upper Right side: Tag # and Logo aligned with Locator
  let rightOffset = x + w - 2.5;

  if (config.showLogo !== false) {
    const logoSize = Math.min(headerHeight - 1.2, Number(config.logoHeightMm) || 6.5);
    const logoX = rightOffset - logoSize;
    const logoY = y + (headerHeight - logoSize) / 2;
    const cx = logoX + logoSize / 2;
    const cy = logoY + logoSize / 2;
    const r = logoSize / 2;

    let customRendered = false;
    if (config.logoUrl && (config.logoUrl.startsWith('data:image/png') || config.logoUrl.startsWith('data:image/jpeg') || config.logoUrl.startsWith('data:image/jpg') || config.logoUrl.startsWith('data:image/webp'))) {
      try {
        const format = config.logoUrl.includes('png') ? 'PNG' : 'JPEG';
        doc.addImage(config.logoUrl, format, logoX, logoY, logoSize, logoSize);
        customRendered = true;
      } catch {
        customRendered = false;
      }
    }

    if (!customRendered) {
      // 1. Draw Prince Yellow circular badge
      doc.setFillColor(254, 237, 1); // #FEED01
      doc.circle(cx, cy, r, 'F');

      // 2. Draw Red Roof Chevron
      doc.setFillColor(227, 27, 35); // #E31B23
      doc.triangle(cx, cy - r * 0.44, cx + r * 0.52, cy - r * 0.04, cx - r * 0.52, cy - r * 0.04, 'F');
      // Cut inner triangle for roof hollow
      doc.setFillColor(254, 237, 1);
      doc.triangle(cx, cy - r * 0.24, cx + r * 0.26, cy - r * 0.04, cx - r * 0.26, cy - r * 0.04, 'F');

      // 3. Draw 'prince' brand text in bold italic lowercase
      doc.setFont('helvetica', 'bolditalic');
      doc.setFontSize(Math.max(3.5, logoSize * 1.05));
      doc.setTextColor(227, 27, 35);
      doc.text('prince', cx, cy + r * 0.32, { align: 'center' });

      // 4. Draw red underline bar
      doc.setDrawColor(227, 27, 35);
      doc.setLineWidth(Math.max(0.2, r * 0.16));
      doc.line(cx - r * 0.78, cy + r * 0.56, cx + r * 0.78, cy + r * 0.56);

      // 5. Draw blue 'RETAIL' text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(Math.max(2.4, logoSize * 0.42));
      doc.setTextColor(0, 85, 165); // #0055A5
      doc.text('RETAIL', cx, cy + r * 0.84, { align: 'center' });
    }

    rightOffset = logoX - 2;
  }

  // Tag # preceding the logo on the right
  if (config.showTagNumber !== false) {
    const tagNumText = `#${item.rawRowIndex ? String(item.rawRowIndex - 1).padStart(3, '0') : '001'}`;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(Math.max(6.5, (Number(config.fontSizeLocator) || 11) * 0.58));
    doc.setTextColor(110, 110, 110);
    const tagNumWidth = doc.getTextWidth(tagNumText);
    doc.text(tagNumText, rightOffset - tagNumWidth, y + headerHeight * 0.66);
    rightOffset = rightOffset - tagNumWidth - 2;
  }

  // Left side: Scanner-Readable Locator Barcode (or text fallback if disabled)
  if (isLocBarcodeEnabled) {
    const locValue = String(item.locator || 'BA-A1-B21L').trim();
    const showText = config.showLocatorText !== false;
    const fontPt = Math.max(7, Math.round((Number(config.fontSizeLocator) || 10.5) * 0.75));
    const locBarcodeUrl = generateLocatorBarcodeDataUrl(
      locValue,
      'CODE128',
      Math.round(locBarcodeHeight * 3.78),
      1.5,
      showText,
      fontPt,
      locBarcodeWidth
    );

    if (locBarcodeUrl) {
      const barcodeX = x + 2.5;
      const barcodeY = y + (headerHeight - locBarcodeHeight) / 2;
      const maxAvailableWidth = Math.max(20, rightOffset - barcodeX - 1);
      const renderWidth = Math.min(locBarcodeWidth, maxAvailableWidth);
      try {
        doc.addImage(locBarcodeUrl, 'PNG', barcodeX, barcodeY, renderWidth, locBarcodeHeight);
      } catch {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(Math.max(8, Number(config.fontSizeLocator) || 11));
        doc.setTextColor(0, 0, 0);
        doc.text(`LOCATOR: ${item.locator || '---'}`, x + 3, y + headerHeight * 0.68);
      }
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(Math.max(8, Number(config.fontSizeLocator) || 11));
      doc.setTextColor(0, 0, 0);
      doc.text(`LOCATOR: ${item.locator || '---'}`, x + 3, y + headerHeight * 0.68);
    }
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(Math.max(8, Number(config.fontSizeLocator) || 11));
    doc.setTextColor(0, 0, 0);
    doc.text(`LOCATOR: ${item.locator || '---'}`, x + 3, y + headerHeight * 0.68);
  }

  // Middle content section: SKU, UPC, DESCRIPTION, BARCODE
  const contentY = y + headerHeight;
  const paddingX = 3;

  // SKU & UPC row
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(Math.max(7, Number(config.fontSizeSku) || 8.5));
  doc.setTextColor(30, 30, 30);
  const skuUpcY = contentY + 4;
  doc.text(`SKU: ${item.sku || 'N/A'}`, x + paddingX, skuUpcY);

  const upcText = `UPC: ${item.upcNo || item.barcode || 'N/A'}`;
  const upcWidth = doc.getTextWidth(upcText);
  doc.text(upcText, Math.max(x + paddingX + 25, x + w - paddingX - upcWidth), skuUpcY);

  // DESCRIPTION (Compact 1 line)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(Math.max(7.5, (Number(config.fontSizeDesc) || 10) * 0.85));
  doc.setTextColor(20, 20, 20);
  const descY = skuUpcY + 3.8;
  const maxDescWidth = Math.max(20, w - paddingX * 2);
  const rawDesc = String(item.description || 'UNTITLED ITEM').toUpperCase();
  let displayLines: string[] = [];
  try {
    const descLines = doc.splitTextToSize(rawDesc, maxDescWidth);
    displayLines = Array.isArray(descLines) ? descLines.slice(0, 1) : [rawDesc.slice(0, 32)];
  } catch {
    displayLines = [rawDesc.slice(0, 32)];
  }
  doc.text(displayLines, x + paddingX, descY);

  // Reserve bottom section for Personnel (Counter, Scanner, Validator)
  const personnelSectionHeight = Math.max(18, Math.min(23, h * 0.26));
  const personnelY = y + h - personnelSectionHeight;

  // Middle section area between Description and Personnel
  const descBottom = descY + 3.5;
  const middleAvailable = Math.max(15, personnelY - descBottom);

  // Barcode & COUNT Box sizing
  const countBoxHeight = Math.max(7, Number(config.countBoxHeightMm) || 12);
  const countBoxWidthPercent = Math.min(100, Math.max(60, Number(config.countBoxWidthPercent) || 94));
  const countBoxW = (w - paddingX * 2) * (countBoxWidthPercent / 100);
  const countBoxX = x + (w - countBoxW) / 2;
  const countBoxGap = Math.max(1, Number(config.countBoxGapTopMm) ?? 2.5);

  const desiredBarcodeHeight = Math.max(8, Math.min(18, Number(config.barcodeHeightMm) || 14));
  const totalGroupHeight = desiredBarcodeHeight + countBoxGap + countBoxHeight;

  let barcodeActualHeight = desiredBarcodeHeight;
  let groupStartY = descBottom + Math.max(1, (middleAvailable - totalGroupHeight) / 2);

  // If space is tight, scale barcode height gracefully
  if (totalGroupHeight > middleAvailable) {
    barcodeActualHeight = Math.max(7, middleAvailable - countBoxHeight - countBoxGap);
    groupStartY = descBottom + 0.5;
  }

  const barcodeY = groupStartY;
  const barcodeValue = String(item.barcode || item.upcNo || item.sku || '00000000').trim();
  const showBarcodeText = config.showBarcodeText !== false;
  const requestedBcWidth = Number(config.barcodeWidthMm) > 0 ? Number(config.barcodeWidthMm) : 42;
  let barcodeDataUrl: string | null = null;
  try {
    barcodeDataUrl = generateBarcodeDataUrl(
      barcodeValue,
      config.barcodeType,
      42,
      showBarcodeText,
      11,
      requestedBcWidth
    );
  } catch (err) {
    console.warn('Barcode error:', err);
  }

  // Render Barcode
  const barcodeWidth = Math.max(15, Math.min(w - 6, requestedBcWidth));
  const barcodeX = x + (w - barcodeWidth) / 2;

  if (barcodeDataUrl && barcodeActualHeight > 5) {
    try {
      doc.addImage(
        barcodeDataUrl,
        'PNG',
        barcodeX,
        barcodeY,
        barcodeWidth,
        barcodeActualHeight
      );
    } catch {
      doc.setFont('courier', 'bold');
      doc.setFontSize(7.5);
      doc.text(`* ${barcodeValue} *`, x + w / 2, barcodeY + 4, { align: 'center' });
    }
  } else {
    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    doc.text(`* ${barcodeValue} *`, x + w / 2, barcodeY + 4, { align: 'center' });
  }

  // Prominent COUNT Box positioned directly below Barcode
  const countBoxY = barcodeY + barcodeActualHeight + countBoxGap;
  doc.setDrawColor(0, 0, 0);
  const borderWidth = Math.max(0.2, (Number(config.countBoxBorderWidth) || 2) * 0.16);
  doc.setLineWidth(borderWidth);
  doc.rect(countBoxX, countBoxY, countBoxW, countBoxHeight);

  // Label: COUNT
  doc.setFont('helvetica', 'bold');
  const countLabelFontSize = Math.max(6.5, (Number(config.countBoxFontSize) || 13) * 0.62);
  doc.setFontSize(countLabelFontSize);
  doc.setTextColor(0, 0, 0);
  doc.text('COUNT', countBoxX + 2.2, countBoxY + countBoxHeight * 0.62);

  // Pre-filled count value if applicable
  const countVal = config.printBlankCountFields ? '' : String(item.count ?? '');
  if (countVal) {
    doc.setFont('helvetica', 'bold');
    const countValFontSize = Math.max(8.5, Number(config.countBoxFontSize) || 13);
    doc.setFontSize(countValFontSize);
    doc.text(countVal, countBoxX + countBoxW / 2, countBoxY + countBoxHeight * 0.66, { align: 'center' });
  }

  // Solid divider above personnel lines
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.line(x, personnelY, x + w, personnelY);

  // Personnel Lines: Counter, Scanner, Validator
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(Math.max(6, Number(config.fontSizeFields) || 7.5));
  doc.setTextColor(0, 0, 0);

  const personnelFields = [
    {
      label: 'Counter :',
      val: config.printBlankCountFields ? '' : String(item.counter || ''),
    },
    {
      label: 'Scanner :',
      val: config.printBlankCountFields ? '' : String(item.scanner || ''),
    },
    {
      label: 'Validator :',
      val: config.printBlankCountFields ? '' : String(item.validator || ''),
    },
  ];

  const rowStep = (personnelSectionHeight - 2) / 3;
  personnelFields.forEach((f, idx) => {
    const fy = personnelY + 4.2 + idx * rowStep;
    doc.setFont('helvetica', 'bold');
    doc.text(f.label, x + paddingX, fy);

    const labelWidth = doc.getTextWidth(f.label) + 2;
    const lineStartX = x + paddingX + labelWidth;
    const lineEndX = x + w - paddingX;

    if (f.val) {
      doc.setFont('helvetica', 'normal');
      doc.text(f.val, lineStartX + 1, fy);
    }

    // Solid underline line as drawn in user sketch
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.22);
    doc.line(lineStartX, fy + 0.5, lineEndX, fy + 0.5);
  });

  // Tag Branding Footer: Powered by: DECStudioHub (30% opacity inside tag boundary)
  try {
    if (typeof (doc as any).GState === 'function') {
      (doc as any).saveGraphicsState();
      (doc as any).setGState(new (doc as any).GState({ opacity: 0.3 }));
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5);
      doc.setTextColor(0, 0, 0);
      doc.text('Powered by: DECStudioHub', x + w / 2, y + h - 0.7, { align: 'center' });
      (doc as any).restoreGraphicsState();
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5);
      doc.setTextColor(179, 179, 179);
      doc.text('Powered by: DECStudioHub', x + w / 2, y + h - 0.7, { align: 'center' });
    }
  } catch {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    doc.setTextColor(179, 179, 179);
    doc.text('Powered by: DECStudioHub', x + w / 2, y + h - 0.7, { align: 'center' });
  }
}

/**
 * Triggers download using an anchor element
 */
export function triggerFileDownload(url: string, filename: string): boolean {
  try {
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    a.setAttribute('download', filename);
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
    }, 2500);
    return true;
  } catch (err) {
    console.warn('Programmatic download trigger failed:', err);
    return false;
  }
}
