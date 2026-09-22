/**
 * DEC — Credit & Contribution Configuration & Data Store
 * 
 * Recognizes and documents individuals who contributed ideas, feature
 * suggestions, process improvements, or meaningful contributions to the
 * Digital Efficiency & Continuity (DEC) System.
 */

export type ContributionType =
  | 'Feature Suggestion'
  | 'Process Improvement'
  | 'Enhancement'
  | 'Usability Improvement'
  | 'Business Continuity'
  | 'Other';

export interface Contribution {
  id: string;
  feature: string;
  version: string;
  type: string; // supports combinations like 'Process Improvement / Enhancement'
  description: string;
  purpose?: string;
  date?: string;
  notes?: string;
}

export interface Contributor {
  id: string;
  name: string;
  contributions: Contribution[];
}

export interface ContributionSummaryStats {
  totalPeople: number;
  totalContributions: number;
  featureSuggestionsCount: number;
  processImprovementsCount: number;
  versionsCount: number;
}

export const INITIAL_CONTRIBUTORS: Contributor[] = [
  {
    id: 'diodito-de-los-santos-jr',
    name: 'Diodito De Los Santos Jr.',
    contributions: [
      {
        id: 'contrib-v205-9tags',
        feature: '9 Count Tags Per Page Print Optimization',
        version: 'v2.0.5',
        type: 'Process Improvement / Enhancement',
        date: 'September 22, 2026',
        description:
          'Optimized Count Tag pagination to maximize Bond Paper usage by filling up to 9 Count Tags per page, including remaining available positions with Count Tags from the next Locator.',
        purpose:
          'Maximize Bond Paper usage by allowing remaining Count Tag slots to be filled by the next Locator. Maximum 9 Count Tags per page and reduced Bond Paper consumption.',
        notes:
          'Seamlessly packs sequential locators into the 3x3 tag grid without wasting empty spaces when a locator has fewer items than a full page.',
      },
    ],
  },
  {
    id: 'john-lord-sarte',
    name: 'John Lord Sarte',
    contributions: [
      {
        id: 'contrib-v204-locator-barcode',
        feature: 'Count Tag Locator Label → Barcode',
        version: 'v2.0.4',
        type: 'Feature Suggestion / Process Improvement',
        date: 'September 21, 2026',
        description:
          'Converted the Count Tag Locator Label from plain text into a scanner-readable Locator Barcode with configurable barcode dimensions and human-readable Locator text settings.',
        purpose:
          'Converted the Locator label into a scanner-readable barcode with configurable: Barcode width, Barcode height, Human-readable Locator text, Font size, and Barcode format.',
        notes:
          'Enables store inventory counters with mobile barcode scanners to scan locators directly from physical tags during wall-to-wall counts.',
      },
    ],
  },
];

export const CONTRIBUTION_STORAGE_KEY = 'dec_contributions';

/**
 * Loads stored contributors from localStorage, falling back to INITIAL_CONTRIBUTORS.
 * Automatically merges initial contributors so official records are never lost.
 */
export function getStoredContributors(): Contributor[] {
  try {
    const raw = localStorage.getItem(CONTRIBUTION_STORAGE_KEY);
    if (!raw) {
      return INITIAL_CONTRIBUTORS;
    }
    const parsed: Contributor[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return INITIAL_CONTRIBUTORS;
    }

    // Ensure all initial contributors are present in the list
    const merged = [...parsed];
    for (const initContributor of INITIAL_CONTRIBUTORS) {
      const existingIdx = merged.findIndex(
        c => c.name.trim().toLowerCase() === initContributor.name.trim().toLowerCase()
      );
      if (existingIdx === -1) {
        merged.push(initContributor);
      } else {
        // Ensure initial contributions exist under this contributor
        const existing = merged[existingIdx];
        const existingContribIds = new Set(existing.contributions.map(ct => ct.id));
        for (const ct of initContributor.contributions) {
          if (!existingContribIds.has(ct.id)) {
            existing.contributions.push(ct);
          }
        }
      }
    }

    return merged;
  } catch (e) {
    console.warn('Failed to load contributions from localStorage:', e);
    return INITIAL_CONTRIBUTORS;
  }
}

/**
 * Persists contributors to localStorage.
 */
export function saveStoredContributors(contributors: Contributor[]): void {
  try {
    localStorage.setItem(CONTRIBUTION_STORAGE_KEY, JSON.stringify(contributors));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dec:contributions-updated'));
    }
  } catch (e) {
    console.error('Failed to save contributions to localStorage:', e);
  }
}

/**
 * Calculates summary metrics for the header banner.
 */
export function getContributionStats(contributors: Contributor[]): ContributionSummaryStats {
  const totalPeople = contributors.length;
  let totalContributions = 0;
  let featureSuggestionsCount = 0;
  let processImprovementsCount = 0;
  const versionsSet = new Set<string>();

  for (const person of contributors) {
    for (const contrib of person.contributions) {
      totalContributions += 1;
      const typeLower = contrib.type.toLowerCase();
      if (typeLower.includes('feature')) {
        featureSuggestionsCount += 1;
      }
      if (typeLower.includes('process') || typeLower.includes('improvement') || typeLower.includes('enhancement')) {
        processImprovementsCount += 1;
      }
      if (contrib.version) {
        versionsSet.add(contrib.version.trim().toLowerCase());
      }
    }
  }

  return {
    totalPeople,
    totalContributions,
    featureSuggestionsCount,
    processImprovementsCount,
    versionsCount: versionsSet.size,
  };
}

/**
 * Adds a new contribution record, grouping it under an existing contributor
 * if the name matches (case-insensitive), or creating a new contributor card.
 */
export function addContribution(params: {
  name: string;
  feature: string;
  version: string;
  type: string;
  description: string;
  purpose?: string;
  date?: string;
  notes?: string;
}): Contributor[] {
  const contributors = getStoredContributors();
  const trimmedName = params.name.trim();
  const normalizedName = trimmedName.toLowerCase();

  const newContrib: Contribution = {
    id: `contrib-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    feature: params.feature.trim(),
    version: params.version.trim().startsWith('v') ? params.version.trim() : `v${params.version.trim()}`,
    type: params.type.trim(),
    description: params.description.trim(),
    purpose: params.purpose?.trim() || undefined,
    date: params.date?.trim() || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    notes: params.notes?.trim() || undefined,
  };

  const existingPerson = contributors.find(c => c.name.trim().toLowerCase() === normalizedName);

  if (existingPerson) {
    existingPerson.contributions.unshift(newContrib);
  } else {
    contributors.push({
      id: `contrib-person-${Date.now()}`,
      name: trimmedName,
      contributions: [newContrib],
    });
  }

  saveStoredContributors(contributors);
  return contributors;
}

/**
 * Resets contributors to factory default (INITIAL_CONTRIBUTORS).
 */
export function resetContributorsToDefault(): Contributor[] {
  saveStoredContributors(INITIAL_CONTRIBUTORS);
  return INITIAL_CONTRIBUTORS;
}
