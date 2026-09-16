import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export interface DeleteConfirmationModalProps {
  isOpen: boolean;
  title: string;
  itemName?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  title,
  itemName,
  message = 'Are you sure you want to delete this tag? This action will immediately remove the item from the list, Live Preview, and Print/PDF output.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 space-y-4 animate-scaleUp"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-delete-title"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700 shrink-0">
            <Trash2 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h3 id="modal-delete-title" className="text-base font-extrabold text-zinc-900">
            {title}
          </h3>
          {itemName && (
            <div className="mt-2 p-2.5 bg-zinc-50 rounded-xl border border-zinc-200 font-mono text-xs font-bold text-zinc-800 break-words">
              {itemName}
            </div>
          )}
          <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
