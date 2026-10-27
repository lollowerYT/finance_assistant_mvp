import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

const MONTHS_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const DAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'дд.мм.гггг',
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);

  const initialDate = value ? new Date(value + 'T00:00:00') : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDisplay = (val: string) => {
    if (!val) return '';
    const [y, m, d] = val.split('-');
    if (!y || !m || !d) return val;
    return `${d}.${m}.${y}`;
  };

  if (isMobile) {
    return (
      <div className="space-y-1 text-xs">
        {label && <label className="block font-semibold mb-1">{label}</label>}
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-control w-full"
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative space-y-1 text-xs">
      {label && <label className="block font-semibold mb-1">{label}</label>}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen((o) => !o)}
        className="input-control flex items-center justify-between cursor-pointer select-none"
      >
        <span className={value ? 'text-[#1F2421]' : 'text-[#6B706B]'}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-0.5 rounded hover:bg-[#EFECE6] text-[#6B706B] hover:text-[#1F2421]"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <Calendar className="w-3.5 h-3.5 text-[#6B706B]" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-64 card-surface p-3.5 shadow-xl border border-[#E6E4DD] bg-white">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => {
                if (viewMonth === 0) {
                  setViewMonth(11);
                  setViewYear((y) => y - 1);
                } else {
                  setViewMonth((m) => m - 1);
                }
              }}
              className="p-1.5 rounded-lg hover:bg-[#EFECE6] text-[#1F2421] cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="font-bold text-xs text-[#1F2421]">
              {MONTHS_RU[viewMonth]} {viewYear}
            </div>
            <button
              type="button"
              onClick={() => {
                if (viewMonth === 11) {
                  setViewMonth(0);
                  setViewYear((y) => y + 1);
                } else {
                  setViewMonth((m) => m + 1);
                }
              }}
              className="p-1.5 rounded-lg hover:bg-[#EFECE6] text-[#1F2421] cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-[#6B706B] mb-1.5">
            {DAYS_RU.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {Array.from({ length: (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7 }).map((_, idx) => (
              <div key={`empty-${idx}`} />
            ))}
            {Array.from({ length: new Date(viewYear, viewMonth + 1, 0).getDate() }).map((_, idx) => {
              const day = idx + 1;
              const dateIso = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = value === dateIso;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    onChange(dateIso);
                    setIsOpen(false);
                  }}
                  className={`py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    isSelected ? 'bg-[#0F766E] text-white' : 'text-[#1F2421] hover:bg-[#EFECE6]'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
