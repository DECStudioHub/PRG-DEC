import { InventoryItem } from '../types';
import { groupItemsByLocator, sortInventoryItemsForCountSheet } from './countSheetLayoutEngine';
import { normalizeCopyCount } from './shelftagExpansion';

export interface CountTagPage {
  pageNumber: number;
  items: InventoryItem[];
  locators: string[];
  isMixedLocators: boolean;
  totalTags: number;
}

export interface PackCountTagsOptions {
  capacity?: number;
  selectedLocators?: string[] | 'ALL';
}

/**
 * DEC v2.0.5 Intelligent Count Tag Page Optimization & Paper-Saving Engine
 * Suggested by: Diodito De Los Santos Jr.
 * 
 * Objective: MAXIMIZE AND SAVE BOND PAPER
 * Fills every page with up to 9 physical Count Tags per page (or configured capacity),
 * utilizing remaining space with Count Tags from the next sequential Locator when necessary.
 * 
 * Pipeline:
 * 1. Filter active selected items (isSelected !== false).
 * 2. Apply Locator Filter (if selectedLocators specified).
 * 3. Group items by Locator (natural alphanumeric sort order, UNASSIGNED last).
 * 4. Sort Description A to Z within each Locator.
 * 5. Apply COPIES: expand each SKU into its physical Count Tag instances.
 * 6. Flatten into ordered stream of physical Count Tag instances:
 *    - Sequential by Locator
 *    - Sequential by Description A-Z within each Locator
 *    - Sequential copies for each SKU
 * 7. Pack sequentially up to capacity (e.g. 9 physical Count Tags per page).
 * 8. Every individual Count Tag retains its correct Locator, Barcode, SKU, UPC, Description, etc.
 * 9. Mixed locators on a page are properly flagged with isMixedLocators and listed in locators array.
 */
export function packCountTagPages(
  items: InventoryItem[],
  optionsOrCapacity: number | PackCountTagsOptions = 9
): CountTagPage[] {
  const options: PackCountTagsOptions =
    typeof optionsOrCapacity === 'number'
      ? { capacity: optionsOrCapacity }
      : optionsOrCapacity;

  const capacity = Math.max(1, options.capacity || 9);
  const selectedLocators = options.selectedLocators;

  // 1. Filter active selected items
  let activeItems = items.filter(it => it.isSelected !== false);

  // 2. Optional locator filtering
  if (selectedLocators && selectedLocators !== 'ALL') {
    const locSet = new Set(
      (Array.isArray(selectedLocators) ? selectedLocators : [selectedLocators]).map(l =>
        String(l).trim().toUpperCase()
      )
    );
    activeItems = activeItems.filter(it => {
      const itLoc = String(it.locator || '').trim().toUpperCase() || 'UNASSIGNED';
      return locSet.has(itLoc);
    });
  }

  if (activeItems.length === 0) {
    return [];
  }

  // 3. Group items by locator (sorted natural alphabetically, UNASSIGNED last)
  const grouped = groupItemsByLocator(activeItems);

  // 4. Sort items inside each locator by DESCRIPTION A to Z, then expand COPIES into physical tag instances
  const physicalInstances: InventoryItem[] = [];

  for (const loc of Object.keys(grouped)) {
    const sortedGroup = sortInventoryItemsForCountSheet(grouped[loc], 'description', 'asc');

    // Apply COPIES for each SKU to create physical Count Tag instances
    for (const item of sortedGroup) {
      const copyCount = normalizeCopyCount(item.copies);
      for (let c = 0; c < copyCount; c++) {
        physicalInstances.push({
          ...item,
          // Suffix clone IDs to ensure React keys and DOM anchors remain strictly unique
          id: c === 0 ? item.id : `${item.id}-copy-${c + 1}`,
        });
      }
    }
  }

  if (physicalInstances.length === 0) {
    return [];
  }

  // 5. Pack sequentially into pages up to capacity (e.g. 9 Count Tags per page)
  // Maximizes Bond Paper: fills available slots before starting a new page
  const pages: CountTagPage[] = [];
  let pageCounter = 1;

  for (let i = 0; i < physicalInstances.length; i += capacity) {
    const pageItems = physicalInstances.slice(i, i + capacity);
    const distinctLocators = Array.from(
      new Set(pageItems.map(it => (it.locator && String(it.locator).trim()) || 'UNASSIGNED'))
    );

    pages.push({
      pageNumber: pageCounter++,
      items: pageItems,
      locators: distinctLocators,
      isMixedLocators: distinctLocators.length > 1,
      totalTags: pageItems.length,
    });
  }

  return pages;
}
