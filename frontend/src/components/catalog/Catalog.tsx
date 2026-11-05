'use client';

<<<<<<< Updated upstream
import dynamic from 'next/dynamic';
=======
>>>>>>> Stashed changes
import { useEffect, useState } from 'react';
import { useCatalogFilters } from '@/hooks/useCatalogFilters';
import { useProperties } from '@/hooks/useProperties';
import { PAGE_SIZE, propertiesApi } from '@/lib/api/properties.api';
<<<<<<< Updated upstream
import { Property } from '@/types/property';
import { CatalogFilters } from './CatalogFilters';
import { PropertyCard } from './PropertyCard';

const CatalogMap = dynamic(() => import('./CatalogMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] items-center justify-center rounded-xl border bg-gray-100 text-sm text-gray-500">
      Загрузка интерактивной карты...
    </div>
  ),
});

/** Контейнер каталога: связывает фильтры (URL), карту с кластеризацией, загрузку данных и отображение. */
=======
import { CatalogFilters } from './CatalogFilters';
import { PropertyCard } from './PropertyCard';

/** Контейнер каталога: связывает фильтры (URL), загрузку данных и отображение. */
>>>>>>> Stashed changes
export function Catalog() {
  const { filter, setFilter, resetFilter } = useCatalogFilters();
  const { data, loading, error } = useProperties(filter);
  const [districts, setDistricts] = useState<string[]>([]);
<<<<<<< Updated upstream
  const [mapProperties, setMapProperties] = useState<Property[]>([]);
=======
>>>>>>> Stashed changes

  useEffect(() => {
    const controller = new AbortController();
    propertiesApi
      .getDistricts(controller.signal)
      .then(setDistricts)
      .catch(() => setDistricts([]));
    return () => controller.abort();
  }, []);

<<<<<<< Updated upstream
  useEffect(() => {
    const controller = new AbortController();
    propertiesApi
      .getAllForMap(
        { district: filter.district, minPrice: filter.minPrice, maxPrice: filter.maxPrice },
        controller.signal,
      )
      .then((res) => setMapProperties(res.items))
      .catch(() => {});
    return () => controller.abort();
  }, [filter.district, filter.minPrice, filter.maxPrice]);

=======
>>>>>>> Stashed changes
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8">
      <header className="flex items-baseline justify-between">
<<<<<<< Updated upstream
        <h1 className="text-2xl font-bold text-gray-900">Аренда квартир — ВКО</h1>
=======
        <h1 className="text-2xl font-bold text-gray-900">Аренда квартир</h1>
>>>>>>> Stashed changes
        {data && <span className="text-sm text-gray-500">Найдено: {data.total}</span>}
      </header>

      <CatalogFilters filter={filter} districts={districts} onChange={setFilter} onReset={resetFilter} />

<<<<<<< Updated upstream
      <CatalogMap properties={mapProperties} />

=======
>>>>>>> Stashed changes
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700" role="alert">
          Не удалось загрузить каталог: {error}
        </div>
      )}

      {loading && !data ? (
        <SkeletonGrid />
      ) : data && data.items.length === 0 ? (
        <p className="py-16 text-center text-gray-500">По заданным условиям объектов нет. Измените фильтры.</p>
      ) : (
        <div
          className={`grid gap-6 transition-opacity sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${loading ? 'opacity-50' : ''}`}
          aria-busy={loading}
        >
          {data?.items.map((p) => <PropertyCard key={p.id} property={p} />)}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2" aria-label="Пагинация">
          <button
<<<<<<< Updated upstream
            aria-label="Предыдущая страница"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            disabled={filter.page <= 1}
            onClick={() => setFilter({ page: filter.page - 1 })}
          >
            ←
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => setFilter({ page: pageNum })}
                className={`h-8 w-8 rounded-lg text-sm font-medium ${
                  pageNum === filter.page
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>

          <button
            aria-label="Следующая страница"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            disabled={filter.page >= totalPages}
            onClick={() => setFilter({ page: filter.page + 1 })}
          >
            →
=======
            className="rounded-lg border px-3 py-1 text-sm disabled:opacity-40"
            disabled={filter.page <= 1}
            onClick={() => setFilter({ page: filter.page - 1 })}
          >
            ← Назад
          </button>
          <span className="text-sm text-gray-600">
            {filter.page} из {totalPages}
          </span>
          <button
            className="rounded-lg border px-3 py-1 text-sm disabled:opacity-40"
            disabled={filter.page >= totalPages}
            onClick={() => setFilter({ page: filter.page + 1 })}
          >
            Вперёд →
>>>>>>> Stashed changes
          </button>
        </nav>
      )}
    </section>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-80 animate-pulse rounded-xl bg-gray-200" />
      ))}
    </div>
  );
}
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
