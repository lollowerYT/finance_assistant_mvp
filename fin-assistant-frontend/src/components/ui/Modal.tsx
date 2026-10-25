import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-4 overflow-y-auto">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="card-surface w-full max-w-md p-5 md:p-6 shadow-xl outline-none my-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 id="modal-title" className="text-base font-bold">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть окно"
            className="p-1 rounded-lg text-[#6B706B] hover:bg-[#EFECE6] hover:text-[#1F2421]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};