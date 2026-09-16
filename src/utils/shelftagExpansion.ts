import { ShelfTagItem } from '../types';

/**
 * Validates and normalizes an item's copy count.
 * Must be a positive integer >= 1.
 */
export function normalizeCopyCount(copies: unknown): number {
  if (typeof copies === 'number' && Number.isFinite(copies)) {
    return Math.max(1, Math.floor(copies));
  }
  if (typeof copies === 'string') {
    const parsed = parseInt(copies.trim(), 10);
    if (!isNaN(parsed) && parsed >= 1) {
      return parsed;
    }
  }
  return 1;
}

/**
 * Returns printable items expanded according to per-SKU copy quantities for Layout Option 2.
 * When layoutOption is 1 (or undefined), returns 1 physical copy per selected item (Layout 1 unchanged).
 * When layoutOption is 2, repeats each selected item based on its item.copies count.
 * Preserves SKU grouping (e.g. SKU B copies are sequential: B, B, B, B, B).
 * Does NOT mutate the source items array.
 */
export function getEffectivePrintItems(
  items: ShelfTagItem[],
  _layoutOption?: 1 | 2,
  locatorFilter: string = 'all'
): ShelfTagItem[] {
  // 1. Filter by selection and locator
  const activeItems = items.filter(item => {
    if (item.isSelected === false) return false;
    if (locatorFilter !== 'all' && item.locator && item.locator !== locatorFilter) {
      return false;
    }
    return true;
  });

  // 2. Expand according to per-SKU/item copy quantities
  // 1 copy = 1 tag, 5 copies = 5 tags. Copies are sequential (Item A: copy 1, 2, 3...)
  const expanded: ShelfTagItem[] = [];
  for (const item of activeItems) {
    const count = normalizeCopyCount(item.copies);
    for (let c = 0; c < count; c++) {
      expanded.push({
        ...item,
        // Suffix clone IDs to ensure React keys and DOM anchors are unique
        id: c === 0 ? item.id : `${item.id}-copy-${c + 1}`,
      });
    }
  }

  return expanded;
}

/**
 * Computes total physical tags to print based on selection, locator filter, and copy quantities.
 */
export function getTotalPhysicalCopies(
  items: ShelfTagItem[],
  _layoutOption?: 1 | 2,
  locatorFilter: string = 'all'
): number {
  const activeItems = items.filter(item => {
    if (item.isSelected === false) return false;
    if (locatorFilter !== 'all' && item.locator && item.locator !== locatorFilter) {
      return false;
    }
    return true;
  });

  return activeItems.reduce((sum, item) => sum + normalizeCopyCount(item.copies), 0);
}

/**
 * Formats a clean reference date string matching the reference layout (e.g., '2/08/26').
 */
export function getFormattedReferenceDate(customDate?: string): string {
  if (customDate && customDate.trim()) {
    return customDate.trim();
  }
  const now = new Date();
  const m = now.getMonth() + 1;
  const d = String(now.getDate()).padStart(2, '0');
  const y = String(now.getFullYear()).slice(-2);
  return `${m}/${d}/${y}`;
}

/**
 * Formats Buy Per and Up lines for Yellow PP Tags in Layout Option 2.
 * Returns array of 2 lines, e.g. ["BUY 5 PCS", "AND UP"]
 */
export function formatBuyPerAndUp(item: ShelfTagItem): string[] {
  // If explicitly custom multiline or single-line string was supplied (e.g. from Excel BUY_PER_AND_UP)
  if (item.buyPerAndUp && item.buyPerAndUp.trim()) {
    const raw = item.buyPerAndUp.trim();
    if (raw.includes('\n')) {
      const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length > 0) return lines;
    }
    const andUpIdx = raw.toUpperCase().lastIndexOf('AND UP');
    if (andUpIdx > 0) {
      const line1 = raw.slice(0, andUpIdx).trim();
      const line2 = raw.slice(andUpIdx).trim();
      return [line1, line2];
    }
    return [raw];
  }

  const unit = (item.unit || 'PCS').toUpperCase().replace(/^PER\s*/i, '');

  if (item.buyPer !== undefined && item.buyPer !== null && String(item.buyPer).trim() !== '') {
    const buyVal = String(item.buyPer).trim();
    const upVal = item.up !== undefined && item.up !== null ? String(item.up).trim() : '';

    const line1 = `BUY ${buyVal} ${unit}`;
    let line2 = 'AND UP';

    if (upVal && upVal !== '1' && upVal.toUpperCase() !== 'AND UP' && upVal.toUpperCase() !== 'YES') {
      line2 = upVal.toUpperCase();
    }
    return [line1, line2];
  }

  // Fallback default
  return [`BUY 3 ${unit}`, 'AND UP'];
}

