'use client';

import { useEffect, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { CatalogFilter, CatalogSortBy } from '@/types/property';

interface Props {
  filter: CatalogFilter;
  districts: string[];
  onChange: (patch: Partial<CatalogFilter>) => void;
  onReset: () => void;
}

const parsePrice = (v: string): number | undefined => (v === '' ? undefined : Math.max(0, Number(v)));

const inputCls =
  'min-h-11 w-full rounded-full border border-[#6D3C52]/20 bg-[#FDF5F3] px-4 py-2.5 text-sm text-[#2C0107] shadow-2xs transition-all duration-300 focus:border-[#C42759] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C42759]/20 dark:border-[#FADCD5]/15 dark:bg-[#1B0C1A] dark:text-[#FADCD5] dark:placeholder-[#B08D87] dark:focus:border-[#FADCD5]/45 dark:focus:ring-[#6D3C52]/40';

/** Обтекаемая панель фильтров с pill-инпутами (rounded-full) и мягкой тенью. */
export function CatalogFilters({ filter, districts, onChange, onReset }: Props) {
  const [minPrice, setMinPrice] = useState(filter.minPrice?.toString() ?? '');
  const [maxPrice, setMaxPrice] = useState(filter.maxPrice?.toString() ?? '');
  const debouncedMin = useDebounce(minPrice);
  const debouncedMax = useDebounce(maxPrice);

  const min = parsePrice(debouncedMin);
  const max = parsePrice(debouncedMax);
  const rangeInvalid = min !== undefined && max !== undefined && min > max;

  useEffect(() => {
    setMinPrice(filter.minPrice?.toString() ?? '');
    setMaxPrice(filter.maxPrice?.toString() ?? '');
  }, [filter.minPrice, filter.maxPrice]);

  useEffect(() => {
    if (rangeInvalid) return;
    if (min !== filter.minPrice || max !== filter.maxPrice) onChange({ minPrice: min, maxPrice: max });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min, max, rangeInvalid]);

  return (
    <form
      className="flex flex-col gap-4 rounded-2xl border border-[#6D3C52]/12 bg-white p-4 shadow-[0_14px_40px_rgba(44,1,7,0.06)] transition-colors duration-300 sm:gap-5 sm:rounded-3xl sm:p-6 md:p-7 dark:border-[#FADCD5]/12 dark:bg-[#2D222F] dark:shadow-[0_16px_44px_rgba(11,4,11,0.5)]"
      onSubmit={(e) => e.preventDefault()}
      aria-label="Фильтры каталога"
    >
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] lg:items-end">
        <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#5A2D36] dark:text-[#DCBAB3]">
          <span className="pl-2">Район</span>
          <select
            className={inputCls}
            value={filter.district ?? ''}
            onChange={(e) => onChange({ district: e.target.value || undefined })}
          >
            <option value="">Все районы</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#5A2D36] dark:text-[#DCBAB3]">
          <span className="pl-2">Цена от, ₸</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={5000}
            placeholder="0"
            className={inputCls}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#5A2D36] dark:text-[#DCBAB3]">
          <span className="pl-2">Цена до, ₸</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={5000}
            placeholder="Без ограничений"
            className={`${inputCls} ${rangeInvalid ? 'border-[#C42759]' : ''}`}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            aria-invalid={rangeInvalid}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#5A2D36] dark:text-[#DCBAB3]">
          <span className="pl-2">Сортировка</span>
          <select
            className={inputCls}
            value={filter.sortBy ?? 'newest'}
            onChange={(e) => onChange({ sortBy: e.target.value as CatalogSortBy })}
          >
            <option value="newest">Сначала новые</option>
            <option value="price_asc">Цена: по возрастанию</option>
            <option value="price_desc">Цена: по убыванию</option>
            <option value="area_desc">Площадь: по убыванию</option>
          </select>
        </label>

        <button
          type="button"
          onClick={onReset}
          className="min-h-11 w-full rounded-full border border-[#6D3C52]/25 bg-[#FDF5F3] px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#2C0107] transition-all duration-300 hover:border-[#C42759] hover:bg-[#FADCD5]/60 sm:col-span-2 lg:col-span-1 lg:w-auto dark:border-[#FADCD5]/20 dark:bg-[#1B0C1A] dark:text-[#FADCD5] dark:hover:border-[#FADCD5]/45 dark:hover:bg-[#4B2138]"
        >
          Сбросить
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 border-t border-[#6D3C52]/10 pt-4 text-xs font-medium dark:border-[#FADCD5]/10">
        <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#845962] dark:text-[#B08D87]">
          Умные теги:
        </span>

        <label
          className={`inline-flex cursor-pointer select-none items-center gap-1.5 rounded-full border px-4 py-1.5 transition-all duration-300 ${
            filter.petsAllowed
              ? 'border-[#C42759] bg-[#C42759] text-white shadow-[0_6px_16px_rgba(196,39,89,0.28)] dark:border-[#6D3C52] dark:bg-[#6D3C52] dark:text-[#FADCD5]'
              : 'border-[#6D3C52]/20 bg-[#FDF5F3] text-[#550416] hover:border-[#C42759]/50 hover:bg-[#FADCD5]/50 dark:border-[#FADCD5]/15 dark:bg-[#1B0C1A] dark:text-[#FADCD5] dark:hover:bg-[#4B2138]/60'
          }`}
        >
          <input
            type="checkbox"
            checked={Boolean(filter.petsAllowed)}
            onChange={(e) => onChange({ petsAllowed: e.target.checked ? true : undefined })}
            className="sr-only"
          />
          <span>🐾 Можно с питомцами</span>
        </label>

        <label
          className={`inline-flex cursor-pointer select-none items-center gap-1.5 rounded-full border px-4 py-1.5 transition-all duration-300 ${
            filter.noDeposit
              ? 'border-[#C42759] bg-[#C42759] text-white shadow-[0_6px_16px_rgba(196,39,89,0.28)] dark:border-[#6D3C52] dark:bg-[#6D3C52] dark:text-[#FADCD5]'
              : 'border-[#6D3C52]/20 bg-[#FDF5F3] text-[#550416] hover:border-[#C42759]/50 hover:bg-[#FADCD5]/50 dark:border-[#FADCD5]/15 dark:bg-[#1B0C1A] dark:text-[#FADCD5] dark:hover:bg-[#4B2138]/60'
          }`}
        >
          <input
            type="checkbox"
            checked={Boolean(filter.noDeposit)}
            onChange={(e) => onChange({ noDeposit: e.target.checked ? true : undefined })}
            className="sr-only"
          />
          <span>⚡ Без залога</span>
        </label>

        <label
          className={`inline-flex cursor-pointer select-none items-center gap-1.5 rounded-full border px-4 py-1.5 transition-all duration-300 ${
            filter.fromOwner
              ? 'border-[#550416] bg-[#550416] text-white shadow-[0_6px_16px_rgba(85,4,22,0.28)] dark:border-[#4B2138] dark:bg-[#4B2138] dark:text-[#FADCD5]'
              : 'border-[#6D3C52]/20 bg-[#FDF5F3] text-[#550416] hover:border-[#C42759]/50 hover:bg-[#FADCD5]/50 dark:border-[#FADCD5]/15 dark:bg-[#1B0C1A] dark:text-[#FADCD5] dark:hover:bg-[#4B2138]/60'
          }`}
        >
          <input
            type="checkbox"
            checked={Boolean(filter.fromOwner)}
            onChange={(e) => onChange({ fromOwner: e.target.checked ? true : undefined })}
            className="sr-only"
          />
          <span>👤 От хозяина</span>
        </label>
      </div>

      {rangeInvalid && (
        <p className="text-sm font-medium text-[#C42759] dark:text-[#FADCD5]" role="alert">
          Минимальная цена не может превышать максимальную.
        </p>
      )}
    </form>
  );
}
