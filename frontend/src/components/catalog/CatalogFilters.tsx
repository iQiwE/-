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
  'w-full rounded-xl border border-[#E2D6C8] bg-[#FAF6F0]/60 px-3.5 py-2.5 text-sm text-[#2C221E] transition focus:border-[#B85D3B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B85D3B]/20';

/** Панель фильтров. Отвечает только за ввод; состояние хранит родитель (контролируемый компонент). */
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
      className="flex flex-col gap-5 rounded-2xl border border-[#ECE2D6] bg-white p-6 shadow-[0_4px_24px_rgba(44,34,30,0.05)]"
      onSubmit={(e) => e.preventDefault()}
      aria-label="Фильтры каталога"
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_1fr_1fr_auto] sm:items-end">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-[#3D302A]">
          Район
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

        <label className="flex flex-col gap-1.5 text-sm font-medium text-[#3D302A]">
          Цена от, ₸
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

        <label className="flex flex-col gap-1.5 text-sm font-medium text-[#3D302A]">
          Цена до, ₸
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={5000}
            placeholder="Без ограничений"
            className={`${inputCls} ${rangeInvalid ? 'border-[#C84B31]' : ''}`}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            aria-invalid={rangeInvalid}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-[#3D302A]">
          Сортировка
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
          className="rounded-xl border border-[#DFD3C3] bg-[#FAF6F0] px-5 py-2.5 text-sm font-medium text-[#3D302A] transition hover:border-[#B85D3B]/40 hover:bg-[#F3ECE2]"
        >
          Сбросить
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 border-t border-[#F0E7DC] pt-4 text-xs font-medium text-[#3D302A]">
        <span className="mr-1 text-[#6B5B50]">Умные теги:</span>

        <label
          className={`inline-flex cursor-pointer select-none items-center gap-1.5 rounded-full border px-3.5 py-1.5 transition-all duration-200 ${
            filter.petsAllowed
              ? 'border-[#4D724D] bg-[#4D724D] text-white shadow-xs ring-2 ring-[#4D724D]/25'
              : 'border-[#D5E0D5] bg-[#F2F6F2] text-[#3B593B] hover:border-[#B8CCB8] hover:bg-[#E6EFE6]'
          }`}
        >
          <input
            type="checkbox"
            checked={Boolean(filter.petsAllowed)}
            onChange={(e) => onChange({ petsAllowed: e.target.checked ? true : undefined })}
            className="sr-only"
          />
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            className={`shrink-0 transition-all duration-200 ${
              filter.petsAllowed ? 'h-3.5 w-3.5 scale-100 opacity-100' : 'h-3.5 w-0 scale-0 opacity-0'
            }`}
          >
            <path
              fillRule="evenodd"
              d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
              clipRule="evenodd"
            />
          </svg>
          <span>🐾 Можно с питомцами</span>
        </label>

        <label
          className={`inline-flex cursor-pointer select-none items-center gap-1.5 rounded-full border px-3.5 py-1.5 transition-all duration-200 ${
            filter.noDeposit
              ? 'border-[#B85D3B] bg-[#B85D3B] text-white shadow-xs ring-2 ring-[#B85D3B]/25'
              : 'border-[#E8CFC4] bg-[#FAF0EB] text-[#8E4226] hover:border-[#D9B3A3] hover:bg-[#F5E6DF]'
          }`}
        >
          <input
            type="checkbox"
            checked={Boolean(filter.noDeposit)}
            onChange={(e) => onChange({ noDeposit: e.target.checked ? true : undefined })}
            className="sr-only"
          />
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            className={`shrink-0 transition-all duration-200 ${
              filter.noDeposit ? 'h-3.5 w-3.5 scale-100 opacity-100' : 'h-3.5 w-0 scale-0 opacity-0'
            }`}
          >
            <path
              fillRule="evenodd"
              d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
              clipRule="evenodd"
            />
          </svg>
          <span>⚡ Без залога</span>
        </label>

        <label
          className={`inline-flex cursor-pointer select-none items-center gap-1.5 rounded-full border px-3.5 py-1.5 transition-all duration-200 ${
            filter.fromOwner
              ? 'border-[#9C6B3B] bg-[#9C6B3B] text-white shadow-xs ring-2 ring-[#9C6B3B]/25'
              : 'border-[#E6D6C3] bg-[#FBF5ED] text-[#785027] hover:border-[#D6BFA4] hover:bg-[#F5EBDC]'
          }`}
        >
          <input
            type="checkbox"
            checked={Boolean(filter.fromOwner)}
            onChange={(e) => onChange({ fromOwner: e.target.checked ? true : undefined })}
            className="sr-only"
          />
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            className={`shrink-0 transition-all duration-200 ${
              filter.fromOwner ? 'h-3.5 w-3.5 scale-100 opacity-100' : 'h-3.5 w-0 scale-0 opacity-0'
            }`}
          >
            <path
              fillRule="evenodd"
              d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
              clipRule="evenodd"
            />
          </svg>
          <span>👤 От хозяина</span>
        </label>
      </div>

      {rangeInvalid && (
        <p className="text-sm text-[#9E3B24]" role="alert">
          Минимальная цена не может превышать максимальную.
        </p>
      )}
    </form>
  );
}
