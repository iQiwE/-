'use client';

import { useEffect, useRef, useState } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  options: SelectOption[];
  onChange: (nextValue: string) => void;
  ariaLabel?: string;
  dataTestId?: string;
}

/**
 * Кастомный выпадающий список (Dropdown) в журнальной эстетике Velvet Residence:
 * - Мягкие скругления (rounded-2xl), темный сливовый фон в темной теме (dark:bg-[#2D222F]),
 *   деликатный бордер dark:border-gray-800 и фирменный hover без системного белого окна.
 */
export function CustomSelect({
  value,
  options,
  onChange,
  ariaLabel,
  dataTestId,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = options.find((opt) => opt.value === value) ?? options[0];

  useEffect(() => {
    if (!isOpen) return;

    function handleOutsideClick(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        data-testid={dataTestId}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex h-12 w-full items-center justify-between gap-2 rounded-full border bg-[#FDF5F3] px-4 text-left text-sm font-normal text-[#2C0107] transition-all duration-300 focus:outline-none dark:bg-[#1B0C1A] dark:text-[#FADCD5] ${
          isOpen
            ? 'border-[#C42759] bg-white ring-2 ring-[#C42759]/20 dark:border-[#6D3C52] dark:ring-[#6D3C52]/40'
            : 'border-[#6D3C52]/15 hover:border-[#C42759]/60 dark:border-gray-800 dark:hover:border-[#6D3C52]'
        }`}
      >
        <span className="truncate">{selectedOption?.label ?? ''}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-[#845962] transition-transform duration-200 dark:text-[#DCBAB3] ${
            isOpen ? 'rotate-180 text-[#C42759] dark:text-[#FADCD5]' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className="no-scrollbar absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 max-h-64 overflow-y-auto rounded-2xl border border-[#6D3C52]/15 bg-white p-1.5 shadow-[0_18px_45px_rgba(44,1,7,0.16)] transition-all duration-200 dark:border-gray-800 dark:bg-[#2D222F] dark:shadow-[0_20px_50px_rgba(0,0,0,0.65)]"
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <li key={opt.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-left text-sm transition-colors duration-150 ${
                    isSelected
                      ? 'bg-[#FADCD5] font-semibold text-[#550416] dark:bg-[#6D3C52] dark:text-[#FADCD5]'
                      : 'font-normal text-[#2C0107] hover:bg-[#FADCD5]/50 dark:text-[#FADCD5] dark:hover:bg-[#382A3B]'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <svg
                      className="h-4 w-4 shrink-0 text-[#C42759] dark:text-[#FADCD5]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
