import { ShelftagSheetLayout } from './shelftagLayoutEngine';

/**
 * Robust Shelftag and PP Tag Browser Print Service
 * Solves sandboxed iframe restrictions, DOM targeting issues, and popup timing.
 * 
 * Multi-strategy approach:
 * 1. If in a top-level browser tab (not sandboxed iframe), triggers window.print() directly.
 * 2. If inside a sandboxed iframe, opens a clean print window with complete styles and triggers native print.
 * 3. If popup is blocked, uses a hidden iframe fallback to invoke the native print dialog.
 */
export function executeShelftagPrint(
  containerElement: HTMLElement | null,
  layout: ShelftagSheetLayout
) {
  if (!containerElement) {
    window.print();
    return;
  }

  const printHtml = containerElement.innerHTML;
  if (!printHtml) {
    window.print();
    return;
  }

  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  // Strategy 1: In standard top-level tab, direct window.print() works natively
  if (!isIframe) {
    try {
      window.print();
      return;
    } catch (err) {
      console.warn('Direct window.print failed, attempting standalone print window:', err);
    }
  }

  // Gather all active stylesheets and inline style blocks
  const currentStyles = Array.from(
    document.querySelectorAll('style, link[rel="stylesheet"]')
  )
    .map(el => el.outerHTML)
    .join('\n');

  // Strategy 2: Standalone print window (critical for sandboxed iframes)
  let printWin: Window | null = null;
  try {
    printWin = window.open('', '_blank');
  } catch (e) {
    console.warn('window.open blocked:', e);
  }

  if (printWin) {
    try {
      printWin.document.open();
      printWin.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Shelftag / PP Tag Print Sheet</title>
  ${currentStyles}
  <style>
    @page {
      size: ${layout.paperWidthMm}mm ${layout.paperHeightMm}mm;
      margin: 0mm !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      width: 100% !important;
      height: auto !important;
    }
    .shelftag-print-container {
      display: block !important;
      width: ${layout.paperWidthMm}mm !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    .shelftag-print-page {
      box-shadow: none !important;
      border: none !important;
      margin: 0 !important;
      page-break-after: always;
      break-after: page;
    }
    .shelftag-print-page:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    .barcode-container svg {
      max-width: 100% !important;
    }
  </style>
</head>
<body>
  <div class="shelftag-print-container">
    ${printHtml}
  </div>
  <script>
    function triggerPrint() {
      window.focus();
      try {
        window.print();
      } catch (err) {
        console.warn('Auto print error:', err);
      }
    }
    if (document.readyState === 'complete') {
      setTimeout(triggerPrint, 350);
    } else {
      window.addEventListener('load', function() {
        setTimeout(triggerPrint, 350);
      });
    }
  </script>
</body>
</html>`);
      printWin.document.close();
      return;
    } catch (err) {
      console.warn('Failed to write to standalone window:', err);
    }
  }

  // Strategy 3: Hidden iframe printing (fallback if popup is blocked in iframe)
  try {
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Shelftag Print</title>
  ${currentStyles}
  <style>
    @page {
      size: ${layout.paperWidthMm}mm ${layout.paperHeightMm}mm;
      margin: 0;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .shelftag-print-page {
      box-shadow: none !important;
      border: none !important;
      margin: 0 !important;
      page-break-after: always;
      break-after: page;
    }
    .shelftag-print-page:last-child {
      page-break-after: auto;
      break-after: auto;
    }
  </style>
</head>
<body>
  <div class="shelftag-print-container">
    ${printHtml}
  </div>
</body>
</html>`);
      frameDoc.close();
      setTimeout(() => {
        try {
          printFrame.contentWindow?.focus();
          printFrame.contentWindow?.print();
        } catch (e) {
          window.print();
        } finally {
          setTimeout(() => {
            try {
              document.body.removeChild(printFrame);
            } catch {}
          }, 3000);
        }
      }, 400);
      return;
    }
  } catch (err) {
    console.warn('Iframe print error:', err);
  }

  // Strategy 4: Direct fallback
  window.print();
}
