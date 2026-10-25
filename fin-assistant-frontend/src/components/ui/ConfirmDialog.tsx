import React from 'react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  isDanger?: boolean;
  loading?: boolean;
  error?: string | null;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Подтвердить',
  isDanger = true,
  loading = false,
  error = null,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-xs text-[#6B706B] leading-relaxed mb-4">{description}</p>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} disabled={loading} className="btn-secondary px-4 py-2 text-xs font-semibold">
          Отмена
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`px-4 py-2 text-xs font-semibold rounded-[12px] text-white transition ${
            isDanger ? 'bg-red-700 hover:bg-red-800' : 'btn-primary'
          } disabled:opacity-60`}
        >
          {loading ? 'Выполнение...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
};