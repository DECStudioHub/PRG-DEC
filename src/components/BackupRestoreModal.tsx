import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  Database,
  CheckCircle2,
  AlertTriangle,
  X,
  FileJson,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  exportSystemBackup,
  validateBackupFile,
  SystemBackupPackage,
} from '../utils/systemBackup';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreComplete: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  onRestoreComplete,
}) => {
  const [pendingPackage, setPendingPackage] = useState<SystemBackupPackage | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    try {
      exportSystemBackup();
      setSuccessMsg('System backup JSON generated and downloaded successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to download backup.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setErrorMsg('Please select a valid .json system backup file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const result = validateBackupFile(parsed);

        if (!result.valid || !result.pkg) {
          setErrorMsg(result.error || 'Invalid backup file structure.');
          return;
        }

        // Stage for preview and explicit user confirmation (Never silently overwrite!)
        setPendingPackage(result.pkg);
      } catch (err: any) {
        setErrorMsg('Failed to parse JSON file. Please ensure it is a valid backup.');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = () => {
    if (!pendingPackage) return;

    try {
      const { data } = pendingPackage;

      if (data.items) {
        localStorage.setItem('inv_items', JSON.stringify(data.items));
      }
      if (data.filename) {
        localStorage.setItem('inv_filename', data.filename);
      }
      if (data.config) {
        localStorage.setItem('inv_config', JSON.stringify(data.config));
      }
      if (data.session) {
        localStorage.setItem('inv_session', JSON.stringify(data.session));
      }
      if (data.settings) {
        localStorage.setItem('inv_settings', JSON.stringify(data.settings));
      }
      if (data.countSheetConfig) {
        localStorage.setItem('count_sheet_active_config', JSON.stringify(data.countSheetConfig));
      }
      if (data.countSheetPresets) {
        localStorage.setItem('count_sheet_presets', JSON.stringify(data.countSheetPresets));
      }
      if (data.activeModule) {
        localStorage.setItem('inv_active_module', data.activeModule);
      }
      if (data.contributions && Array.isArray(data.contributions)) {
        localStorage.setItem('dec_contributions', JSON.stringify(data.contributions));
      }

      setPendingPackage(null);
      setSuccessMsg('System restored successfully from backup! Reloading workspace...');

      setTimeout(() => {
        onRestoreComplete();
        onClose();
        window.location.reload();
      }, 700);
    } catch (e: any) {
      setErrorMsg('Failed to write restored data to local storage.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-zinc-200 space-y-5 animate-scaleUp">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Database className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-900">
                System Backup & Restore
              </h3>
              <p className="text-xs text-zinc-500">
                Export or import full configuration, layout presets, branding, and item records.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Pending Restore Confirmation View */}
        {pendingPackage ? (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50/80 border border-amber-300/80 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Confirm System Restore — Review Backup Details</span>
              </div>
              <p className="text-xs text-zinc-700">
                Please review the contents of this backup file before applying it. Restoring will update your active workspace and settings with the data below.
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs bg-white p-3 rounded-lg border border-amber-200/80">
                <div>
                  <span className="text-zinc-400 font-semibold block text-[10px]">Exported At:</span>
                  <span className="font-mono text-zinc-800 font-bold">
                    {new Date(pendingPackage.exportedAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 font-semibold block text-[10px]">System Name:</span>
                  <span className="text-zinc-800 font-bold">{pendingPackage.systemName}</span>
                </div>
                <div>
                  <span className="text-zinc-400 font-semibold block text-[10px]">Inventory Items:</span>
                  <span className="font-mono text-emerald-700 font-bold">
                    {pendingPackage.stats.totalItems} records
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 font-semibold block text-[10px]">Count Sheet Presets:</span>
                  <span className="font-mono text-zinc-800 font-bold">
                    {pendingPackage.stats.presetCount} presets
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPendingPackage(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Restore System</span>
              </button>
            </div>
          </div>
        ) : (
          /* Normal Export / Import Chooser View */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. EXPORT BACKUP */}
            <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-2 text-zinc-900 font-bold text-xs uppercase tracking-wide">
                  <Download className="w-4 h-4 text-emerald-700" />
                  <span>Backup Full System</span>
                </div>
                <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                  Downloads a comprehensive timestamped JSON snapshot containing all inventory items, layout configuration, count sheet presets, custom logos, and branding settings.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExport}
                className="w-full py-2 px-3 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON Backup</span>
              </button>
            </div>

            {/* 2. RESTORE BACKUP */}
            <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-2 text-zinc-900 font-bold text-xs uppercase tracking-wide">
                  <Upload className="w-4 h-4 text-blue-700" />
                  <span>Restore From File</span>
                </div>
                <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                  Load a previously exported system backup. A confirmation preview will be displayed before any changes are applied, protecting existing data.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 px-3 text-xs font-bold text-zinc-700 bg-white hover:bg-zinc-100 border border-zinc-300 rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <FileJson className="w-3.5 h-3.5 text-zinc-600" />
                <span>Select Backup File (.json)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
