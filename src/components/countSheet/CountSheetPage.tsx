import React, { useMemo } from 'react';
import { CountSheetColumnId, CountSheetConfig, CountSheetPageData, InventorySession } from '../../types';
import { generateBarcodeSvgString, generateLocatorBarcodeSvgString } from '../../utils/barcode';
import { getCountSheetPaperDimensions, isValidCountSheetItem } from '../../utils/countSheetLayoutEngine';

interface CountSheetPageProps {
  pageData: CountSheetPageData;
  config: CountSheetConfig;
  session?: InventorySession;
  scale?: number;
  isPrint?: boolean;
}

export const CountSheetPage: React.FC<CountSheetPageProps> = ({
  pageData,
  config,
  session,
  scale = 1,
  isPrint = false,
}) => {
  const paperDims = useMemo(() => {
    return getCountSheetPaperDimensions(
      config.paperSize,
      config.customWidthMm,
      config.customHeightMm,
      config.orientation
    );
  }, [config.paperSize, config.customWidthMm, config.customHeightMm, config.orientation]);

  // Generate upper-right locator barcode SVG using scanner-optimized generator
  const locatorBarcodeSvg = useMemo(() => {
    if (!config.showLocatorBarcode || !pageData.locator || pageData.locator === 'UNASSIGNED') {
      return '';
    }
    const cleanLocator = String(pageData.locator).trim();
    return generateLocatorBarcodeSvgString(
      cleanLocator,
      config.locatorBarcodeFormat || 'CODE128',
      (config.locatorBarcodeHeightMm || 11) * scale,
      config.locatorBarcodeWidthScale || 1.5,
      config.showLocatorBarcodeText !== false,
      Math.max(6, Math.round((config.locatorBarcodeTextSizePt || 8) * scale))
    );
  }, [
    config.showLocatorBarcode,
    config.locatorBarcodeFormat,
    config.locatorBarcodeHeightMm,
    config.locatorBarcodeWidthScale,
    config.showLocatorBarcodeText,
    config.locatorBarcodeTextSizePt,
    pageData.locator,
    scale,
  ]);

  // Filter only valid SKU records for rendering (Rows Per Page is strictly a maximum capacity)
  const validItems = useMemo(() => {
    return (pageData.items || []).filter(isValidCountSheetItem);
  }, [pageData.items]);

  // Font family mapping
  const getFontFamily = (family: string) => {
    switch (family) {
      case 'monospace':
      case 'courier':
        return 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
      case 'serif':
      case 'times':
        return 'Georgia, Cambria, "Times New Roman", Times, serif';
      default:
        return 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    }
  };

  const headerFont = getFontFamily(config.headerFontFamily);
  const bodyFont = getFontFamily(config.bodyFontFamily);

  // Column widths
  const colWidths = config.columnWidths || {
    locatorMm: 28,
    skuMm: 22,
    barcodeMm: 36,
    descMm: 55,
    precountMm: 23,
    countMm: 23,
  };

  // Reorderable Columns
  const activeColumns = useMemo<CountSheetColumnId[]>(() => {
    const defaultOrder: CountSheetColumnId[] = config.mixLocators
      ? ['locator', 'sku', 'barcode', 'description', 'precount', 'count']
      : ['sku', 'barcode', 'description', 'count'];
    const order = config.columnOrder && config.columnOrder.length > 0
      ? config.columnOrder
      : defaultOrder;

    return order.filter(colId => {
      if (config.columnVisibility && config.columnVisibility[colId] === false) {
        return false;
      }
      return true;
    });
  }, [config.columnOrder, config.columnVisibility, config.mixLocators]);

  // Table Border & Line Calculations
  const borderEnabled = config.tableBorderEnabled !== false;
  const tableBorderStyle = config.tableBorderStyle || 'solid';
  const tableBorderColor = config.tableBorderColor || '#27272a';
  const outerBorderWidthPx = borderEnabled && config.tableOuterBorder !== false
    ? (config.tableBorderWidthPx ?? 1.5)
    : 0;

  const innerHorizontalBorder = borderEnabled && config.tableInnerHorizontalLines !== false
    ? `${config.tableHorizontalLineWidthPx ?? 1}px ${tableBorderStyle} ${tableBorderColor}`
    : 'none';

  const innerVerticalBorder = borderEnabled && config.tableInnerVerticalLines !== false
    ? `${config.tableVerticalLineWidthPx ?? 1}px ${tableBorderStyle} ${tableBorderColor}`
    : 'none';

  const headerBorderBottom = borderEnabled && config.tableHeaderBorder !== false
    ? `${config.tableHeaderBorderWidthPx ?? 2}px ${tableBorderStyle} ${tableBorderColor}`
    : 'none';

  const headerAlignClass = config.tableHeaderAlign === 'center'
    ? 'text-center'
    : config.tableHeaderAlign === 'right'
    ? 'text-right'
    : 'text-left';

  const bodyAlignClass = config.tableBodyAlign === 'center'
    ? 'text-center'
    : config.tableBodyAlign === 'right'
    ? 'text-right'
    : 'text-left';

  return (
    <div
      className={`bg-white text-zinc-950 box-border relative flex flex-col justify-between ${
        isPrint
          ? 'print-page'
          : 'shadow-md rounded-xs border border-zinc-200'
      }`}
      style={{
        width: `${paperDims.widthMm * scale}mm`,
        height: `${paperDims.heightMm * scale}mm`,
        minWidth: `${paperDims.widthMm * scale}mm`,
        minHeight: `${paperDims.heightMm * scale}mm`,
        maxWidth: `${paperDims.widthMm * scale}mm`,
        maxHeight: `${paperDims.heightMm * scale}mm`,
        paddingTop: `${config.marginTopMm * scale}mm`,
        paddingBottom: `${config.marginBottomMm * scale}mm`,
        paddingLeft: `${config.marginLeftMm * scale}mm`,
        paddingRight: `${config.marginRightMm * scale}mm`,
        boxSizing: 'border-box',
        overflow: 'hidden',
        fontFamily: bodyFont,
      }}
    >
      {/* 1. TOP HEADER SECTION */}
      <div className="w-full flex items-start justify-between border-b-2 border-zinc-950 pb-2 mb-2">
        {/* Left / Center: Count Sheet Titles & Session Info */}
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-2">
            <h1
              className="font-black tracking-tight uppercase leading-tight text-zinc-950"
              style={{
                fontFamily: headerFont,
                fontSize: `${Math.max(14, (config.headerFontSizePt + 6) * scale)}pt`,
              }}
            >
              COUNT SHEET
            </h1>
            <span
              className="inline-block px-2 py-0.5 border border-zinc-900 font-extrabold text-[9px] uppercase tracking-wider bg-zinc-100 rounded-xs"
              style={{ fontFamily: bodyFont }}
            >
              PHYSICAL INVENTORY
            </span>
          </div>

          <div
            className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-zinc-700 mt-1 font-medium"
            style={{
              fontFamily: bodyFont,
              fontSize: `${Math.max(7, config.bodyFontSizePt * scale)}pt`,
            }}
          >
            {session?.store && (
              <div>
                <span className="font-bold text-zinc-900">STORE: </span>
                {session.store}
              </div>
            )}
            {session?.branch && (
              <div>
                <span className="font-bold text-zinc-900">BRANCH: </span>
                {session.branch}
              </div>
            )}
            {session?.inventoryDate && (
              <div>
                <span className="font-bold text-zinc-900">DATE: </span>
                {session.inventoryDate}
              </div>
            )}
            {session?.preparedBy && (
              <div>
                <span className="font-bold text-zinc-900">PREPARED BY: </span>
                {session.preparedBy}
              </div>
            )}
          </div>
        </div>

        {/* UPPER RIGHT: LOCATOR IDENTIFICATION & SCANNER-READABLE LOCATOR BARCODE */}
        <div
          className={`shrink-0 flex flex-col pl-3 border-l border-zinc-300 ${
            config.locatorBarcodeAlign === 'left'
              ? 'items-start text-left'
              : config.locatorBarcodeAlign === 'center'
              ? 'items-center text-center'
              : 'items-end text-right'
          }`}
        >
          {/* Human-Readable Locator Text (Hidden on CYCLE COUNT / mixLocators or if showLocatorText is false) */}
          {!config.mixLocators && config.showLocatorText !== false && (
            <div className="flex items-center gap-1.5">
              <span
                className="font-bold text-zinc-500 uppercase tracking-wider"
                style={{ fontSize: `${Math.max(7, 8 * scale)}pt` }}
              >
                LOCATOR:
              </span>
              <span
                className="font-black font-mono text-zinc-950 px-2 py-0.5 border-2 border-zinc-950 bg-zinc-50 rounded-xs tracking-wider"
                style={{
                  fontSize: `${Math.max(11, 13 * scale)}pt`,
                  fontFamily: 'monospace',
                }}
              >
                {pageData.locator || 'UNASSIGNED'}
              </span>
            </div>
          )}

          {/* Scannable Locator Barcode (Hidden on CYCLE COUNT / mixLocators or if showLocatorBarcode is false) */}
          {!config.mixLocators && config.showLocatorBarcode && locatorBarcodeSvg && (
            <div
              className="mt-1 flex flex-col bg-white"
              title={`Locator Barcode: ${pageData.locator}`}
              dangerouslySetInnerHTML={{ __html: locatorBarcodeSvg }}
            />
          )}

          {/* Page / Sheet Info */}
          <div
            className="text-[9px] font-bold text-zinc-600 mt-1"
            style={{ fontFamily: bodyFont }}
          >
            {config.mixLocators ? (
              <span className="font-mono text-zinc-800 tracking-wide font-black">
                SHEET {pageData.globalPageIndex} OF {pageData.totalGlobalPages}
              </span>
            ) : (
              <>
                PAGE {pageData.pageNumber} OF {pageData.totalPagesForLocator}
                {pageData.totalGlobalPages > pageData.totalPagesForLocator && (
                  <span className="text-zinc-400 ml-1">
                    (SHEET {pageData.globalPageIndex}/{pageData.totalGlobalPages})
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. TABLE CONTAINER — Ink-Saving Dynamic Table */}
      <div className="flex-1 w-full flex flex-col overflow-hidden">
        {validItems.length > 0 ? (
          <table
            className="w-full border-collapse text-left"
            style={{
              border: outerBorderWidthPx > 0 ? `${outerBorderWidthPx}px ${tableBorderStyle} ${tableBorderColor}` : 'none',
              fontFamily: bodyFont,
            }}
          >
          {/* Table Header: Dynamically ordered based on columnOrder */}
          <thead>
            <tr
              className="bg-zinc-100"
              style={{
                borderBottom: headerBorderBottom,
              }}
            >
              {config.showRowNumbers && (
                <th
                  className="px-1 py-1 text-center font-extrabold uppercase text-zinc-700"
                  style={{
                    width: `${6 * scale}mm`,
                    fontSize: `${Math.max(7, (config.headerFontSizePt - 1.5) * scale)}pt`,
                    borderRight: innerVerticalBorder,
                  }}
                >
                  #
                </th>
              )}

              {activeColumns.map((colId, colIdx) => {
                const isLast = colIdx === activeColumns.length - 1;
                const rightBorder = isLast ? 'none' : innerVerticalBorder;

                if (colId === 'locator') {
                  return (
                    <th
                      key="th-locator"
                      className={`px-2 py-1 font-black uppercase text-zinc-950 tracking-wider text-center`}
                      style={{
                        width: `${(colWidths.locatorMm || 28) * scale}mm`,
                        fontSize: `${Math.max(7, config.headerFontSizePt * scale)}pt`,
                        borderRight: rightBorder,
                      }}
                    >
                      LOCATOR
                    </th>
                  );
                }

                if (colId === 'sku') {
                  return (
                    <th
                      key="th-sku"
                      className={`px-2 py-1 font-black uppercase text-zinc-950 tracking-wider ${headerAlignClass}`}
                      style={{
                        width: `${colWidths.skuMm * scale}mm`,
                        fontSize: `${Math.max(7, config.headerFontSizePt * scale)}pt`,
                        borderRight: rightBorder,
                      }}
                    >
                      SKU
                    </th>
                  );
                }

                if (colId === 'barcode') {
                  return (
                    <th
                      key="th-barcode"
                      className={`px-2 py-1 font-black uppercase text-zinc-950 tracking-wider text-center`}
                      style={{
                        width: `${colWidths.barcodeMm * scale}mm`,
                        fontSize: `${Math.max(7, config.headerFontSizePt * scale)}pt`,
                        borderRight: rightBorder,
                      }}
                    >
                      BARCODE
                    </th>
                  );
                }

                if (colId === 'description') {
                  return (
                    <th
                      key="th-desc"
                      className={`px-2 py-1 font-black uppercase text-zinc-950 tracking-wider ${headerAlignClass}`}
                      style={{
                        width: `${colWidths.descMm * scale}mm`,
                        fontSize: `${Math.max(7, config.headerFontSizePt * scale)}pt`,
                        borderRight: rightBorder,
                      }}
                    >
                      DESCRIPTION
                    </th>
                  );
                }

                if (colId === 'precount') {
                  return (
                    <th
                      key="th-precount"
                      className="px-2 py-1 font-black uppercase text-zinc-950 tracking-wider text-center bg-zinc-100"
                      style={{
                        width: `${(colWidths.precountMm || 23) * scale}mm`,
                        fontSize: `${Math.max(8, (config.countHeaderFontSizePt || 9) * scale)}pt`,
                        borderRight: rightBorder,
                      }}
                    >
                      PRE COUNT
                    </th>
                  );
                }

                if (colId === 'count') {
                  return (
                    <th
                      key="th-count"
                      className="px-2 py-1 font-black uppercase text-zinc-950 tracking-wider text-center bg-zinc-200/60"
                      style={{
                        width: `${colWidths.countMm * scale}mm`,
                        fontSize: `${Math.max(8, (config.countHeaderFontSizePt || 9) * scale)}pt`,
                        borderRight: rightBorder,
                      }}
                    >
                      FINAL COUNT
                    </th>
                  );
                }

                return null;
              })}
            </tr>
          </thead>

          {/* Table Body: Exact valid item rows only, zero empty bordered rows */}
          <tbody>
            {validItems.map((item, idx) => {
              const rowNum = pageData.startIndex + idx + 1;
              const isLastRow = idx === validItems.length - 1;
              const codeVal = String(item.barcode || item.upcNo || item.sku || '').trim();

              const barcodeSvg =
                config.showBarcodeGraphic && codeVal
                  ? generateBarcodeSvgString(
                      codeVal,
                      config.barcodeFormat || 'CODE128',
                      Math.max(14, Math.round((config.barcodeHeightMm || 7.5) * 2.8 * scale)),
                      config.showBarcodeValueText !== false,
                      Math.max(6, Math.round((config.barcodeTextFontSizePt || 7) * scale)),
                      (config.barcodeWidthMm || 36) * scale
                    )
                  : '';

              return (
                <tr
                  key={item.id || `row-${idx}`}
                  className="hover:bg-zinc-50 transition-colors"
                  style={{
                    height: `${config.rowHeightMm * scale}mm`,
                    maxHeight: `${config.rowHeightMm * scale}mm`,
                    borderBottom: isLastRow ? 'none' : innerHorizontalBorder,
                  }}
                >
                  {/* Row Number */}
                  {config.showRowNumbers && (
                    <td
                      className="px-1 text-center font-mono font-bold text-zinc-500 text-[9px]"
                      style={{
                        height: `${config.rowHeightMm * scale}mm`,
                        borderRight: innerVerticalBorder,
                      }}
                    >
                      {rowNum}
                    </td>
                  )}

                  {/* Dynamically Ordered Columns */}
                  {activeColumns.map((colId, colIdx) => {
                    const isLast = colIdx === activeColumns.length - 1;
                    const rightBorder = isLast ? 'none' : innerVerticalBorder;

                    if (colId === 'locator') {
                      const locVal = String(item.locator || '').trim();
                      const locBarcodeSvg =
                        locVal && locVal !== 'UNASSIGNED'
                          ? generateBarcodeSvgString(
                              locVal,
                              config.locatorBarcodeFormat || 'CODE128',
                              Math.max(14, Math.round((config.barcodeHeightMm || 7.5) * 2.8 * scale)),
                              true,
                              Math.max(6, Math.round((config.barcodeTextFontSizePt || 7) * scale)),
                              (colWidths.locatorMm || 28) * scale
                            )
                          : '';

                      return (
                        <td
                          key={`cell-locator-${idx}`}
                          className="px-1 py-0.5 overflow-hidden text-center"
                          style={{
                            width: `${(colWidths.locatorMm || 28) * scale}mm`,
                            height: `${config.rowHeightMm * scale}mm`,
                            borderRight: rightBorder,
                          }}
                        >
                          {locBarcodeSvg ? (
                            <div
                              className="w-full flex flex-col items-center justify-center overflow-hidden max-h-full [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:h-auto"
                              dangerouslySetInnerHTML={{ __html: locBarcodeSvg }}
                            />
                          ) : (
                            <span
                              className="font-mono font-bold text-zinc-950 tracking-wider"
                              style={{
                                fontSize: `${Math.max(7, (config.skuFontSizePt || 8.5) * scale)}pt`,
                              }}
                            >
                              {locVal || '-'}
                            </span>
                          )}
                        </td>
                      );
                    }

                    if (colId === 'sku') {
                      return (
                        <td
                          key={`cell-sku-${idx}`}
                          className={`px-2 font-mono font-bold text-zinc-950 truncate ${bodyAlignClass}`}
                          style={{
                            width: `${colWidths.skuMm * scale}mm`,
                            fontSize: `${Math.max(7, config.skuFontSizePt * scale)}pt`,
                            height: `${config.rowHeightMm * scale}mm`,
                            borderRight: rightBorder,
                          }}
                        >
                          {item.sku || '-'}
                        </td>
                      );
                    }

                    if (colId === 'barcode') {
                      return (
                        <td
                          key={`cell-barcode-${idx}`}
                          className="px-1 py-0.5 overflow-hidden text-center"
                          style={{
                            width: `${colWidths.barcodeMm * scale}mm`,
                            height: `${config.rowHeightMm * scale}mm`,
                            borderRight: rightBorder,
                          }}
                        >
                          {barcodeSvg ? (
                            <div
                              className="w-full flex flex-col items-center justify-center overflow-hidden max-h-full"
                              dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                            />
                          ) : (
                            <span
                              className="font-mono font-semibold text-zinc-900 tracking-wider"
                              style={{
                                fontSize: `${Math.max(7, config.barcodeTextFontSizePt * scale)}pt`,
                              }}
                            >
                              {codeVal || '-'}
                            </span>
                          )}
                        </td>
                      );
                    }

                    if (colId === 'description') {
                      return (
                        <td
                          key={`cell-desc-${idx}`}
                          className={`px-2 py-0.5 text-zinc-900 font-medium leading-tight ${bodyAlignClass}`}
                          style={{
                            width: `${colWidths.descMm * scale}mm`,
                            fontSize: `${Math.max(7, config.descFontSizePt * scale)}pt`,
                            height: `${config.rowHeightMm * scale}mm`,
                            borderRight: rightBorder,
                          }}
                        >
                          <div
                            className="overflow-hidden uppercase font-semibold"
                            style={{
                              display: config.wrapDescription ? '-webkit-box' : 'block',
                              WebkitLineClamp: config.wrapDescription ? config.descMaxLines : 1,
                              WebkitBoxOrient: 'vertical',
                              lineHeight: config.descLineHeight,
                              whiteSpace: config.wrapDescription ? 'normal' : 'nowrap',
                              textOverflow: 'ellipsis',
                            }}
                            title={item.description}
                          >
                            {item.description || '-'}
                          </div>
                        </td>
                      );
                    }

                    if (colId === 'precount') {
                      return (
                        <td
                          key={`cell-precount-${idx}`}
                          className="px-2 py-0.5 text-center relative bg-white"
                          style={{
                            width: `${(colWidths.precountMm || 23) * scale}mm`,
                            height: `${config.rowHeightMm * scale}mm`,
                            borderRight: rightBorder,
                          }}
                        >
                          <div className="w-full h-full flex items-center justify-center pointer-events-none select-none">
                            <span className="w-4/5 border-b border-zinc-200/80 inline-block h-2" />
                          </div>
                        </td>
                      );
                    }

                    if (colId === 'count') {
                      return (
                        <td
                          key={`cell-count-${idx}`}
                          className="px-2 py-0.5 text-center relative bg-white"
                          style={{
                            width: `${colWidths.countMm * scale}mm`,
                            height: `${config.rowHeightMm * scale}mm`,
                            borderRight: rightBorder,
                          }}
                        >
                          <div className="w-full h-full flex items-center justify-center pointer-events-none select-none">
                            <span className="w-4/5 border-b border-zinc-200/80 inline-block h-2" />
                          </div>
                        </td>
                      );
                    }

                    return null;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        ) : (
          <div className="flex-1 w-full flex flex-col items-center justify-center p-8 text-center select-none">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              No SKU Records For This Locator
            </p>
            <p className="text-[10px] text-zinc-400 mt-1">
              Table omitted to save printer ink and paper
            </p>
          </div>
        )}
      </div>

      {/* 3. FOOTER SIGNATURE & VERIFICATION SECTION */}
      {config.showSignatures && (
        <div className="w-full pt-2 mt-1 border-t border-zinc-400 flex items-center justify-between text-[8px] font-medium text-zinc-700">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5">
              <span className="font-bold uppercase text-zinc-900">COUNTER:</span>
              <span className="inline-block w-28 border-b border-zinc-900" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold uppercase text-zinc-900">SCANNER:</span>
              <span className="inline-block w-28 border-b border-zinc-900" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold uppercase text-zinc-900">VALIDATOR:</span>
              <span className="inline-block w-28 border-b border-zinc-900" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold uppercase text-zinc-900">DATE & TIME:</span>
              <span className="inline-block w-24 border-b border-zinc-900" />
            </div>
          </div>

          <div className="font-mono text-zinc-500 font-bold">
            LOCATOR: {pageData.locator} | PAGE {pageData.pageNumber}/{pageData.totalPagesForLocator}
          </div>
        </div>
      )}

      {/* 4. PRINTABLE DOCUMENT FOOTER */}
      <div
        className="w-full text-center mt-1 pt-0.5 select-none pointer-events-none font-sans font-medium text-[8px] tracking-wide text-zinc-900"
        style={{ opacity: 0.3 }}
      >
        Powered by: DECStudioHub
      </div>
    </div>
  );
};
