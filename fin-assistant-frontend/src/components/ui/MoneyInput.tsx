import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from "lucide-react";;

interface MoneyInputProps {
  value: string; // Строковое значение суммы, например "3123.56"
  onChange: (val: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
}

export const MoneyInput: React.FC<MoneyInputProps> = ({
  value,
  onChange,
  placeholder = '0.00',
  label,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAdd = (delta: number) => {
    const current = parseFloat(value.replace(',', '.')) || 0;
    const updated = Math.max(0, current + delta);
    onChange(updated.toFixed(2));
  };

  return (
    <div ref={containerRef} className="relative space-y-1">
      {label && <label className="block font-semibold mb-1 text-xs">{label}</label>}
      <div className="relative flex items-center">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="input-control tabular-nums font-semibold pr-16 text-xs"
        />
        <div className="absolute right-2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-1 text-[#6B706B] hover:text-[#1F2421] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className="p-1 text-[#6B706B] hover:text-[#1F2421] cursor-pointer"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 card-surface p-3 shadow-xl border border-[#E6E4DD] text-xs space-y-2.5 bg-white">
          <div className="text-[11px] font-bold text-[#6B706B] flex items-center justify-between">
            <span>Быстрое изменение суммы</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[#0F766E] hover:underline cursor-pointer"
            >
              Готово
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: '+100', delta: 100 },
              { label: '+500', delta: 500 },
              { label: '+1000', delta: 1000 },
              { label: '+5000', delta: 5000 },
              { label: '-100', delta: -100 },
              { label: '-500', delta: -500 },
              { label: '-1000', delta: -1000 },
              { label: '-5000', delta: -5000 },
            ].map((btn) => (
              <button
                key={btn.label}
                type="button"
                onClick={() => handleAdd(btn.delta)}
                className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  btn.delta > 0
                    ? 'bg-teal-50 text-[#0F766E] hover:bg-teal-100'
                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
};
