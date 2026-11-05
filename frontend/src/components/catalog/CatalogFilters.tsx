'use client';

import { useEffect, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
<<<<<<< Updated upstream
import { CatalogFilter, CatalogSortBy } from '@/types/property';
=======
import { CatalogFilter } from '@/types/property';
>>>>>>> Stashed changes

interface Props {
  filter: CatalogFilter;
  districts: string[];
  onChange: (patch: Partial<CatalogFilter>) => void;
  onReset: () => void;
}

const parsePrice = (v: string): number | undefined => (v === '' ? undefined : Math.max(0, Number(v)));

const inputCls =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200';

/** Панель фильтров. Отвечает только за ввод; состояние хранит родитель (контролируемый компонент). */
export function CatalogFilters({ filter, districts, onChange, onReset }: Props) {
  // Локальное состояние полей цены для мгновенного отклика при вводе
  const [minPrice, setMinPrice] = useState(filter.minPrice?.toString() ?? '');
  const [maxPrice, setMaxPrice] = useState(filter.maxPrice?.toString() ?? '');
  const debouncedMin = useDebounce(minPrice);
  const debouncedMax = useDebounce(maxPrice);

  const min = parsePrice(debouncedMin);
  const max = parsePrice(debouncedMax);
  const rangeInvalid = min !== undefined && max !== undefined && min > max;

  // Синхронизация с URL при внешнем сбросе или навигации «Назад»
  useEffect(() => {
    setMinPrice(filter.minPrice?.toString() ?? '');
    setMaxPrice(filter.maxPrice?.toString() ?? '');
  }, [filter.minPrice, filter.maxPrice]);

  // Отправка цен в URL после debounce, только при корректном и изменившемся диапазоне
  useEffect(() => {
    if (rangeInvalid) return;
    if (min !== filter.minPrice || max !== filter.maxPrice) onChange({ minPrice: min, maxPrice: max });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min, max, rangeInvalid]);

  return (
    <form
<<<<<<< Updated upstream
      className="grid gap-4 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-[1fr_1fr_1fr_1fr_auto] sm:items-end"
=======
      className="grid gap-4 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
>>>>>>> Stashed changes
      onSubmit={(e) => e.preventDefault()}
      aria-label="Фильтры каталога"
    >
      <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
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

      <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
<<<<<<< Updated upstream
        Цена от, ₸
=======
        Цена от, ₽
>>>>>>> Stashed changes
        <input
          type="number"
          inputMode="numeric"
          min={0}
<<<<<<< Updated upstream
          step={5000}
=======
          step={1000}
>>>>>>> Stashed changes
          placeholder="0"
          className={inputCls}
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
<<<<<<< Updated upstream
        Цена до, ₸
=======
        Цена до, ₽
>>>>>>> Stashed changes
        <input
          type="number"
          inputMode="numeric"
          min={0}
<<<<<<< Updated upstream
          step={5000}
=======
          step={1000}
>>>>>>> Stashed changes
          placeholder="Без ограничений"
          className={`${inputCls} ${rangeInvalid ? 'border-red-500' : ''}`}
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          aria-invalid={rangeInvalid}
        />
      </label>

<<<<<<< Updated upstream
      <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
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

=======
>>>>>>> Stashed changes
      <button
        type="button"
        onClick={onReset}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
      >
        Сбросить
      </button>

      {rangeInvalid && (
<<<<<<< Updated upstream
        <p className="text-sm text-red-600 sm:col-span-5" role="alert">
=======
        <p className="text-sm text-red-600 sm:col-span-4" role="alert">
>>>>>>> Stashed changes
          Минимальная цена не может превышать максимальную.
        </p>
      )}
    </form>
  );
}

