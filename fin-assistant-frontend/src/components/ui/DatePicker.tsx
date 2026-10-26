import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const MONTHS_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const DAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Выберите дату',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayRaw = new Date(viewYear, viewMonth, 1).getDay();
  const startOffset = (firstDayRaw + 6) % 7;

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const selectDay = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onChange(`${viewYear}-${m}-${d}`);
    setIsOpen(false);
  };

  const formatDisplay = (val: string) => {
    if (!val) return '';
    const [y, m, d] = val.split('-');
    if (!y || !m || !d) return val;
    return `${d}.${m}.${y}`;
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setIsOpen((o) => !o);
        }}
        className="input-control flex items-center justify-between cursor-pointer select-none"
      >
        <span className={value ? 'text-[#1F2421]' : 'text-[#6B706B]'}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <span
              role="button"
              aria-label="Очистить дату"
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
        <div className="absolute left-0 top-full mt-1.5 z-40 w-64 card-surface p-3.5 shadow-xl border border-[#E6E4DD] text-xs">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-[#EFECE6] text-[#1F2421] transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="font-bold text-xs text-[#1F2421]">
              {MONTHS_RU[viewMonth]} {viewYear}
            </div>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-[#EFECE6] text-[#1F2421] transition cursor-pointer"
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
            {Array.from({ length: startOffset }).map((_, idx) => (
              <div key={`empty-${idx}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dateIso = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = value === dateIso;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={`py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#0F766E] text-white'
                      : 'text-[#1F2421] hover:bg-[#EFECE6]'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#E6E4DD] flex justify-between items-center">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-[#6B706B] hover:bg-[#EFECE6] hover:text-[#1F2421] transition cursor-pointer"
            >
              Очистить
            </button>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const y = now.getFullYear();
                const m = String(now.getMonth() + 1).padStart(2, '0');
                const d = String(now.getDate()).padStart(2, '0');
                onChange(`${y}-${m}-${d}`);
                setIsOpen(false);
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-[#0F766E] hover:bg-teal-50 transition cursor-pointer"
            >
              Сегодня
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
