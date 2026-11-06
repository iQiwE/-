'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useCatalogFilters } from '@/hooks/useCatalogFilters';
import { useProperties } from '@/hooks/useProperties';
import { PAGE_SIZE, propertiesApi } from '@/lib/api/properties.api';
import { getSessionUser, getToken } from '@/lib/auth';
import { Property } from '@/types/property';
import { CatalogFilters } from './CatalogFilters';
import { PropertyCard } from './PropertyCard';

const CatalogMap = dynamic(() => import('./CatalogMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] items-center justify-center rounded-2xl bg-[#F3ECE2] text-sm text-[#6B5B50]">
      Загрузка интерактивной карты...
    </div>
  ),
});

/** Контейнер каталога: связывает фильтры (URL), карту с кластеризацией, избранное, загрузку данных и отображение. */
export function Catalog() {
  const router = useRouter();
  const { filter, setFilter, resetFilter } = useCatalogFilters();
  const { data, loading, error } = useProperties(filter);
  const [districts, setDistricts] = useState<string[]>([]);
  const [mapProperties, setMapProperties] = useState<Property[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const isFirstRender = useRef(true);
  const gridRef = useRef<HTMLDivElement>(null);

  // При смене страницы плавно прокручиваем к началу сетки карточек (а не к верху сайта).
  // scroll-margin-top на контейнере компенсирует высоту sticky-шапки.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const grid = gridRef.current ?? document.getElementById('properties-grid');
    grid?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [filter.page]);

  useEffect(() => {
    const controller = new AbortController();
    propertiesApi
      .getDistricts(controller.signal)
      .then(setDistricts)
      .catch(() => setDistricts([]));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const token = getToken();
    const user = getSessionUser();
    if (!token || user?.role !== 'TENANT') {
      setFavoriteIds(new Set());
      return;
    }
    const controller = new AbortController();
    propertiesApi
      .getFavorites(token, controller.signal)
      .then((favs) => setFavoriteIds(new Set(favs.map((f) => f.id))))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    propertiesApi
      .getAllForMap(
        {
          district: filter.district,
          minPrice: filter.minPrice,
          maxPrice: filter.maxPrice,
          petsAllowed: filter.petsAllowed,
          noDeposit: filter.noDeposit,
          fromOwner: filter.fromOwner,
        },
        controller.signal,
      )
      .then((res) => setMapProperties(res.items))
      .catch(() => {});
    return () => controller.abort();
  }, [
    filter.district,
    filter.minPrice,
    filter.maxPrice,
    filter.petsAllowed,
    filter.noDeposit,
    filter.fromOwner,
  ]);

  const handleToggleFavorite = useCallback(
    async (propertyId: number) => {
      const token = getToken();
      const user = getSessionUser();
      if (!token || !user) {
        router.push('/login?redirect=/catalog');
        return;
      }
      if (user.role !== 'TENANT') {
        return;
      }

      const isCurrentlyFav = favoriteIds.has(propertyId);
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlyFav) next.delete(propertyId);
        else next.add(propertyId);
        return next;
      });

      try {
        if (isCurrentlyFav) {
          await propertiesApi.removeFavorite(propertyId, token);
        } else {
          await propertiesApi.addFavorite(propertyId, token);
        }
      } catch {
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (isCurrentlyFav) next.add(propertyId);
          else next.delete(propertyId);
          return next;
        });
      }
    },
    [favoriteIds, router],
  );

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="flex flex-col">
      {/* Секция 1 (Кремовый фон): Заголовок и Фильтры */}
      <section className="bg-[#FAF6F0] py-12 lg:py-16">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 lg:px-8">
          <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="inline-block rounded-full bg-[#F5E6DF] px-3.5 py-1 text-xs font-medium tracking-wide text-[#9E4B2D]">
                Восточно-Казахстанская область · Долгосрочная аренда
              </span>
              <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-[#2C221E] sm:text-4xl">
                Подбор жилой недвижимости
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-[#6B5B50]">
                Уютные квартиры, студии и апартаменты от проверенных собственников в Усть-Каменогорске и Риддере.
              </p>
            </div>
            {data && (
              <div className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-[#5C4D44] shadow-[0_2px_12px_rgba(44,34,30,0.04)]">
                Найдено объектов: <span className="font-semibold text-[#B85D3B]">{data.total}</span>
              </div>
            )}
          </header>

          <CatalogFilters filter={filter} districts={districts} onChange={setFilter} onReset={resetFilter} />
        </div>
      </section>

      {/* Секция 2 (Белый фон для визуального разделения): Интерактивная карта */}
      <section className="border-y border-[#ECE3D8] bg-white py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-[#2C221E]">Расположение на карте</h2>
              <p className="mt-1 text-sm text-[#6B5B50]">
                Исследуйте районы города и выбирайте жилье рядом с важной для вас инфраструктурой
              </p>
            </div>
          </div>
          <CatalogMap properties={mapProperties} />
        </div>
      </section>

      {/* Секция 3 (Кремовый фон): Каталог карточек и Пагинация */}
      <section className="bg-[#FAF6F0] py-14 lg:py-16">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 lg:px-8">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-2xl font-semibold text-[#2C221E]">Доступные предложения</h2>
            {data && (
              <span className="text-xs font-medium text-[#6B5B50]">
                Страница {filter.page} из {totalPages}
              </span>
            )}
          </div>

          {error && (
            <div className="rounded-2xl bg-[#FDF2EE] p-5 text-sm text-[#9E3B24]" role="alert">
              Не удалось загрузить каталог: {error}
            </div>
          )}

          {/* Якорь автоскролла пагинации: scroll-mt-28 (112px) > высоты sticky-шапки h-20 (80px) */}
          <div id="properties-grid" ref={gridRef} className="scroll-mt-28">
          {loading && !data ? (
            <SkeletonGrid />
          ) : data && data.items.length === 0 ? (
            <div className="rounded-2xl bg-white p-16 text-center shadow-[0_4px_24px_rgba(44,34,30,0.04)]">
              <p className="font-serif text-xl font-medium text-[#2C221E]">По заданным условиям объектов не найдено</p>
              <p className="mt-2 text-sm text-[#6B5B50]">Попробуйте смягчить параметры фильтрации или сбросить теги.</p>
            </div>
          ) : (
            <div
              className={`grid gap-8 transition-opacity sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${
                loading ? 'opacity-50' : ''
              }`}
              aria-busy={loading}
            >
              {data?.items.map((p) => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  isFavorite={favoriteIds.has(p.id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          )}
          </div>

          {totalPages > 1 && (
            <nav className="mt-4 flex items-center justify-center gap-2" aria-label="Пагинация">
              <button
                aria-label="Предыдущая страница"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E2D6C8] bg-white text-sm font-medium text-[#3D302A] transition hover:border-[#B85D3B]/50 hover:bg-[#FAF6F0] disabled:opacity-40"
                disabled={filter.page <= 1}
                onClick={() => setFilter({ page: filter.page - 1 })}
              >
                ←
              </button>

              <div className="flex flex-wrap items-center gap-1.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setFilter({ page: pageNum })}
                    className={`h-10 w-10 rounded-xl text-sm font-medium transition ${
                      pageNum === filter.page
                        ? 'bg-[#B85D3B] text-white shadow-xs'
                        : 'border border-[#E2D6C8] bg-white text-[#3D302A] hover:border-[#B85D3B]/50 hover:bg-[#FAF6F0]'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                aria-label="Следующая страница"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E2D6C8] bg-white text-sm font-medium text-[#3D302A] transition hover:border-[#B85D3B]/50 hover:bg-[#FAF6F0] disabled:opacity-40"
                disabled={filter.page >= totalPages}
                onClick={() => setFilter({ page: filter.page + 1 })}
              >
                →
              </button>
            </nav>
          )}
        </div>
      </section>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-96 animate-pulse rounded-2xl bg-[#EFE7DC]" />
      ))}
    </div>
  );
}
