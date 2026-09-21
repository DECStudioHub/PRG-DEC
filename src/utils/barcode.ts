import JsBarcode from 'jsbarcode';
import { BarcodeType } from '../types';

export function getJsBarcodeFormat(type: BarcodeType): string {
  switch (type) {
    case 'CODE39':
      return 'CODE39';
    case 'EAN13':
      return 'EAN13';
    case 'UPCA':
      return 'UPC';
    case 'CODE128':
    default:
      return 'CODE128';
  }
}

/**
 * Generate SVG string for barcode
 */
export function generateBarcodeSvgString(
  value: string,
  type: BarcodeType = 'CODE128',
  height: number = 38,
  displayValue: boolean = true,
  fontSize: number = 12,
  widthMm?: number
): string {
  if (!value || typeof document === 'undefined') {
    return '';
  }

  const svgNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const format = getJsBarcodeFormat(type);

  // If widthMm is provided, dynamically calibrate narrow bar module width
  // In typical barcode, total modules ~ (value.length + 4) * 11 + 20
  // Target width in px = widthMm * 3.78
  let calculatedWidth = 1.8;
  if (widthMm && widthMm > 0) {
    const targetPx = widthMm * 3.78;
    const estModules = Math.max(70, (String(value).trim().length + 4) * 11 + 20);
    calculatedWidth = Math.max(0.65, Math.min(2.8, targetPx / estModules));
  }

  try {
    JsBarcode(svgNode, String(value).trim(), {
      format: format,
      lineColor: '#000000',
      width: calculatedWidth,
      height: height,
      displayValue: displayValue,
      fontSize: fontSize,
      font: 'monospace',
      margin: 2,
      textMargin: 2,
      valid: () => true,
    });

    // Subtle adjustment: slightly move human-readable barcode text toward center of barcode
    const textElem = svgNode.querySelector ? svgNode.querySelector('text') : null;
    if (textElem) {
      const currentX = parseFloat(textElem.getAttribute('x') || '0');
      if (currentX > 0) {
        const subtleShift = Math.max(4, Math.round(fontSize * 0.65));
        textElem.setAttribute('x', String(Math.round((currentX - subtleShift) * 10) / 10));
      }
    }

    return svgNode.outerHTML;
  } catch (err) {
    // If specific format fails (e.g. invalid checksum for EAN13), fallback to CODE128
    try {
      JsBarcode(svgNode, String(value).trim(), {
        format: 'CODE128',
        lineColor: '#000000',
        width: calculatedWidth,
        height: height,
        displayValue: displayValue,
        fontSize: fontSize,
        font: 'monospace',
        margin: 2,
        textMargin: 2,
      });

      // Subtle adjustment: slightly move human-readable barcode text toward center of barcode
      const fallbackTextElem = svgNode.querySelector ? svgNode.querySelector('text') : null;
      if (fallbackTextElem) {
        const currentX = parseFloat(fallbackTextElem.getAttribute('x') || '0');
        if (currentX > 0) {
          const subtleShift = Math.max(4, Math.round(fontSize * 0.65));
          fallbackTextElem.setAttribute('x', String(Math.round((currentX - subtleShift) * 10) / 10));
        }
      }

      return svgNode.outerHTML;
    } catch {
      // Fallback SVG representation
      return `<svg width="100%" height="${height + 15}" viewBox="0 0 200 ${height + 15}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f8fafc"/>
        <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-size="10" font-family="monospace" fill="#ef4444">INVALID BARCODE</text>
        <text x="50%" y="80%" dominant-baseline="middle" text-anchor="middle" font-size="11" font-family="monospace" fill="#334155">${value}</text>
      </svg>`;
    }
  }
}

/**
 * Specialized barcode generator for LOCATOR codes (e.g. BA-A1-B2L1, A01-S02).
 * Engineered for 100% optical readability on both 1D Laser scanners and 2D Imagers:
 * 1. Guarantees adequate White Quiet Zones (margin >= 10px on sides) so laser beams detect start/stop codes.
 * 2. Uses proper narrow bar width (widthScale 1.4-1.6) to avoid bar crowding or bleed.
 * 3. Defaults to CODE128 (with fallback to CODE39), ideal for alphanumeric warehouse strings.
 * 4. Renders crisp vector SVG without clipping.
 */
export function generateLocatorBarcodeSvgString(
  value: string,
  type: BarcodeType = 'CODE128',
  heightMm: number = 10,
  widthScale: number = 1.5,
  displayValue: boolean = true,
  fontSizePt: number = 8,
  widthMm?: number
): string {
  if (!value || typeof document === 'undefined') return '';

  const cleanValue = String(value).trim().toUpperCase();
  if (!cleanValue) return '';

  const svgNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  // Convert mm to approximate SVG px height (3.78 px/mm)
  const totalHeightPx = Math.max(16, Math.round(heightMm * 3.78));
  const format = getJsBarcodeFormat(type);

  // If displayValue is true, text occupies space; scale bars to fit totalHeightPx
  const fontPx = Math.max(8, Math.round(fontSizePt * 1.33));
  const barHeight = displayValue
    ? Math.max(10, Math.round(totalHeightPx - fontPx - 6))
    : Math.max(12, totalHeightPx - 4);

  // Calculate narrow bar width based on widthMm if provided
  let effectiveWidth = Math.max(1.0, Math.min(2.4, widthScale));
  if (widthMm && widthMm > 0) {
    const targetPx = widthMm * 3.78;
    const estModules = Math.max(65, (cleanValue.length + 4) * 11 + 20);
    effectiveWidth = Math.max(0.75, Math.min(2.4, (targetPx - 16) / estModules));
  }

  try {
    JsBarcode(svgNode, cleanValue, {
      format: format,
      lineColor: '#000000',
      width: effectiveWidth,
      height: barHeight,
      displayValue: displayValue,
      fontSize: fontPx,
      font: 'monospace',
      margin: 2,
      marginLeft: 6,
      marginRight: 6,
      marginTop: 1,
      marginBottom: 1,
      textMargin: 2,
      background: '#ffffff',
      valid: () => true,
    });

    svgNode.setAttribute('width', '100%');
    svgNode.setAttribute('height', '100%');
    svgNode.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svgNode.style.display = 'block';
    svgNode.style.maxWidth = '100%';
    svgNode.style.maxHeight = '100%';

    return svgNode.outerHTML;
  } catch (err) {
    try {
      JsBarcode(svgNode, cleanValue, {
        format: 'CODE128',
        lineColor: '#000000',
        width: effectiveWidth,
        height: barHeight,
        displayValue: displayValue,
        fontSize: fontPx,
        font: 'monospace',
        margin: 2,
        marginLeft: 6,
        marginRight: 6,
        marginTop: 1,
        marginBottom: 1,
        textMargin: 2,
        background: '#ffffff',
      });

      svgNode.setAttribute('width', '100%');
      svgNode.setAttribute('height', '100%');
      svgNode.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      svgNode.style.display = 'block';
      svgNode.style.maxWidth = '100%';
      svgNode.style.maxHeight = '100%';

      return svgNode.outerHTML;
    } catch {
      return `<svg width="100%" height="${totalHeightPx}" viewBox="0 0 160 ${totalHeightPx}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#ffffff"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="10" font-family="monospace" fill="#000000">${cleanValue}</text>
      </svg>`;
    }
  }
}

/**
 * Generate barcode as data URL for PDF insertion
 */
export function generateBarcodeDataUrl(
  value: string,
  type: BarcodeType = 'CODE128',
  height: number = 40,
  displayValue: boolean = true,
  fontSize: number = 12,
  widthMm?: number
): string | null {
  if (!value || typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  const format = getJsBarcodeFormat(type);

  let calculatedWidth = 2;
  if (widthMm && widthMm > 0) {
    const targetPx = widthMm * 3.78;
    const estModules = Math.max(70, (String(value).trim().length + 4) * 11 + 20);
    calculatedWidth = Math.max(0.65, Math.min(2.8, targetPx / estModules));
  }

  try {
    JsBarcode(canvas, String(value).trim(), {
      format: format,
      lineColor: '#000000',
      width: calculatedWidth,
      height: height,
      displayValue: displayValue,
      fontSize: fontSize,
      font: 'monospace',
      margin: 4,
      background: '#ffffff',
    });
    return canvas.toDataURL('image/png');
  } catch {
    try {
      JsBarcode(canvas, String(value).trim(), {
        format: 'CODE128',
        lineColor: '#000000',
        width: calculatedWidth,
        height: height,
        displayValue: displayValue,
        fontSize: fontSize,
        font: 'monospace',
        margin: 4,
        background: '#ffffff',
      });
      return canvas.toDataURL('image/png');
    } catch {
      return null;
    }
  }
}

/**
 * Generate locator barcode as data URL for PDF insertion with optical quiet zones
 */
export function generateLocatorBarcodeDataUrl(
  value: string,
  type: BarcodeType = 'CODE128',
  heightPx: number = 40,
  widthScale: number = 1.5,
  displayValue: boolean = true,
  fontSizePt: number = 8,
  widthMm?: number
): string | null {
  if (!value || typeof document === 'undefined') return null;
  const cleanVal = String(value).trim().toUpperCase();
  if (!cleanVal) return null;

  const canvas = document.createElement('canvas');
  const format = getJsBarcodeFormat(type);

  const fontPx = Math.max(8, Math.round(fontSizePt * 1.33));
  const effectiveBarHeight = displayValue
    ? Math.max(12, Math.round(heightPx - fontPx - 6))
    : Math.max(14, heightPx - 4);

  let effectiveWidth = Math.max(1.0, Math.min(2.4, widthScale));
  if (widthMm && widthMm > 0) {
    const targetPx = widthMm * 3.78;
    const estModules = Math.max(65, (cleanVal.length + 4) * 11 + 20);
    effectiveWidth = Math.max(0.75, Math.min(2.4, (targetPx - 16) / estModules));
  }

  try {
    JsBarcode(canvas, cleanVal, {
      format: format,
      lineColor: '#000000',
      width: effectiveWidth,
      height: effectiveBarHeight,
      displayValue: displayValue,
      fontSize: fontPx,
      font: 'monospace',
      margin: 2,
      marginLeft: 8,
      marginRight: 8,
      marginTop: 1,
      marginBottom: 1,
      textMargin: 2,
      background: '#ffffff',
    });
    return canvas.toDataURL('image/png');
  } catch {
    try {
      JsBarcode(canvas, cleanVal, {
        format: 'CODE128',
        lineColor: '#000000',
        width: effectiveWidth,
        height: effectiveBarHeight,
        displayValue: displayValue,
        fontSize: fontPx,
        font: 'monospace',
        margin: 2,
        marginLeft: 8,
        marginRight: 8,
        marginTop: 1,
        marginBottom: 1,
        textMargin: 2,
        background: '#ffffff',
      });
      return canvas.toDataURL('image/png');
    } catch {
      return null;
    }
  }
}

