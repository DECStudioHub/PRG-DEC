import {
  CountSheetConfig,
  CountSheetPreset,
  InventoryItem,
  InventorySession,
  LayoutConfig,
  SystemSettings,
} from '../types';
import { Contributor } from '../config/contributions';

export interface SystemBackupPackage {
  schemaVersion: '2.0';
  exportedAt: string;
  systemName: string;
  stats: {
    totalItems: number;
    hasLayoutConfig: boolean;
    hasCountSheetConfig: boolean;
    presetCount: number;
    contributorCount?: number;
  };
  data: {
    items: InventoryItem[];
    filename?: string;
    config: LayoutConfig;
    session: InventorySession;
    settings: SystemSettings;
    countSheetConfig?: CountSheetConfig;
    countSheetPresets?: CountSheetPreset[];
    activeModule?: string;
    contributions?: Contributor[];
  };
}

/**
 * Creates and downloads a complete JSON backup of the entire system.
 */
export function exportSystemBackup(): void {
  try {
    const itemsRaw = localStorage.getItem('inv_items');
    const items: InventoryItem[] = itemsRaw ? JSON.parse(itemsRaw) : [];

    const filename = localStorage.getItem('inv_filename') || 'Inventory_Data.xlsx';

    const configRaw = localStorage.getItem('inv_config');
    const config = configRaw ? JSON.parse(configRaw) : {};

    const sessionRaw = localStorage.getItem('inv_session');
    const session = sessionRaw ? JSON.parse(sessionRaw) : {};

    const settingsRaw = localStorage.getItem('inv_settings');
    const settings = settingsRaw ? JSON.parse(settingsRaw) : {};

    const countSheetConfigRaw = localStorage.getItem('count_sheet_active_config');
    const countSheetConfig = countSheetConfigRaw ? JSON.parse(countSheetConfigRaw) : undefined;

    const countSheetPresetsRaw = localStorage.getItem('count_sheet_presets');
    const countSheetPresets = countSheetPresetsRaw ? JSON.parse(countSheetPresetsRaw) : undefined;

    const activeModule = localStorage.getItem('inv_active_module') || 'count_tag';

    const contributionsRaw = localStorage.getItem('dec_contributions');
    const contributions = contributionsRaw ? JSON.parse(contributionsRaw) : undefined;

    const backupPackage: SystemBackupPackage = {
      schemaVersion: '2.0',
      exportedAt: new Date().toISOString(),
      systemName: settings.systemName || 'PRG Shelftag & Barcode System',
      stats: {
        totalItems: items.length,
        hasLayoutConfig: Boolean(configRaw),
        hasCountSheetConfig: Boolean(countSheetConfigRaw),
        presetCount: Array.isArray(countSheetPresets) ? countSheetPresets.length : 0,
        contributorCount: Array.isArray(contributions) ? contributions.length : 0,
      },
      data: {
        items,
        filename,
        config,
        session,
        settings,
        countSheetConfig,
        countSheetPresets,
        activeModule,
        contributions,
      },
    };

    const jsonStr = JSON.stringify(backupPackage, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 5).replace(':', '');
    const downloadFilename = `PRG_System_Backup_${dateStr}_${timeStr}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = downloadFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to export system backup:', err);
    throw new Error('Could not create system backup file.');
  }
}

/**
 * Validates whether an uploaded object is a valid system backup package.
 */
export function validateBackupFile(parsed: any): { valid: boolean; error?: string; pkg?: SystemBackupPackage } {
  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, error: 'File is not a valid JSON object.' };
  }

  // Check structure: either schemaVersion 2.0 or has data / items / settings
  if (!parsed.data && !parsed.items && !parsed.settings) {
    return { valid: false, error: 'Backup file is missing required system data structures.' };
  }

  const pkg: SystemBackupPackage = {
    schemaVersion: parsed.schemaVersion || '2.0',
    exportedAt: parsed.exportedAt || new Date().toISOString(),
    systemName: parsed.systemName || parsed.data?.settings?.systemName || 'PRG System',
    stats: {
      totalItems: parsed.stats?.totalItems ?? (parsed.data?.items?.length || parsed.items?.length || 0),
      hasLayoutConfig: Boolean(parsed.data?.config || parsed.config),
      hasCountSheetConfig: Boolean(parsed.data?.countSheetConfig || parsed.countSheetConfig),
      presetCount: parsed.stats?.presetCount ?? (parsed.data?.countSheetPresets?.length || 0),
    },
    data: parsed.data || {
      items: parsed.items || [],
      filename: parsed.filename,
      config: parsed.config,
      session: parsed.session,
      settings: parsed.settings,
      countSheetConfig: parsed.countSheetConfig,
      countSheetPresets: parsed.countSheetPresets,
      activeModule: parsed.activeModule,
      contributions: parsed.data?.contributions || parsed.contributions,
    },
  };

  return { valid: true, pkg };
}
