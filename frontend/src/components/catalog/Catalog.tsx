'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCatalogFilters } from '@/hooks/useCatalogFilters';
import { useProperties } from '@/hooks/useProperties';
import { PAGE_SIZE, propertiesApi } from '@/lib/api/properties.api';
import { getSessionUser, getToken } from '@/lib/auth';
import { isPropertyInPolygon } from '@/lib/geo/turf';
import { Property } from '@/types/property';
import { CatalogFilters } from './CatalogFilters';
import { CatalogSpotlightCarousel } from './CatalogSpotlightCarousel';
import type { LatLngTuple } from './MapComponent';
import { PropertyCard } from './PropertyCard';

const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[340px] items-center justify-center rounded-2xl bg-[#FADCD5]/35 text-xs text-[#5A2D36] sm:h-[420px] sm:rounded-3xl dark:bg-[#2D222F] dark:text-[#DCBAB3]">
      Загрузка интерактивной карты...
    </div>
  ),
});

/**
 * Умный контейнер каталога (Smart Component):
 * управляет загрузкой данных из API, фильтрами, состоянием полигона карты и избранным,
 * передавая подготовленные данные в презентационные (Dumb/UI) компоненты:
 * CatalogSpotlightCarousel, PropertyCard, MapComponent и FaqSection.
 */
export function Catalog() {
  const router = useRouter();
  const { filter, setFilter, resetFilter } = useCatalogFilters();
  const { data, loading, error } = useProperties(filter);
  const [districts, setDistricts] = useState<string[]>([]);
  const [mapProperties, setMapProperties] = useState<Property[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoomsChip, setSelectedRoomsChip] = useState<number | null>(null);
  const [drawnPolygon, setDrawnPolygon] = useState<LatLngTuple[] | null>(null);
  const [showFullFilters, setShowFullFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'feed' | 'map'>('feed');

  const isFirstRender = useRef(true);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const grid = gridRef.current ?? document.getElementById('properties-grid');
    grid?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [filter.page]);

  // Полноэкранная карта на мобильных: прокручиваем к началу и блокируем скролл страницы
  useEffect(() => {
    if (viewMode !== 'map') return;
    if (window.innerWidth >= 768) return;
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    document.documentElement.classList.add('map-fullscreen-lock');
    return () => document.documentElement.classList.remove('map-fullscreen-lock');
  }, [viewMode]);

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
      if (user.role !== 'TENANT') return;

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

  // Фильтрация по строке поиска и комнатности (до гео-фильтрации полигоном)
  const filterBySearchAndRooms = useCallback(
    (items: Property[]) => {
      const q = searchQuery.trim().toLowerCase();
      return items.filter((p) => {
        if (selectedRoomsChip !== null) {
          if (selectedRoomsChip === 3 ? p.rooms < 3 : p.rooms !== selectedRoomsChip) {
            return false;
          }
        }
        if (!q) return true;
        const haystack = `${p.title} ${p.address.city} ${p.address.district} ${p.address.street}`.toLowerCase();
        return haystack.includes(q);
      });
    },
    [searchQuery, selectedRoomsChip],
  );

  // Полный пул доступных объектов до гео-фильтрации полигоном
  const poolBeforePolygon = useMemo(
    () => filterBySearchAndRooms(mapProperties.length > 0 ? mapProperties : (data?.items ?? [])),
    [filterBySearchAndRooms, mapProperties, data?.items],
  );

  // Итоговый пул объектов с учетом нарисованного на карте многоугольника (Turf booleanPointInPolygon)
  const allFeedPool = useMemo(() => {
    if (!drawnPolygon || drawnPolygon.length < 3) return poolBeforePolygon;
    return poolBeforePolygon.filter((p) => isPropertyInPolygon(p, drawnPolygon));
  }, [poolBeforePolygon, drawnPolygon]);

  const hasPolygonFilter = Boolean(drawnPolygon && drawnPolygon.length >= 3);

  const hasActiveNarrowFilter = Boolean(
    searchQuery.trim() ||
      selectedRoomsChip !== null ||
      hasPolygonFilter ||
      filter.district ||
      filter.minPrice ||
      filter.maxPrice ||
      filter.petsAllowed ||
      filter.noDeposit ||
      filter.fromOwner ||
      filter.page > 1,
  );

  const specialDeals = useMemo(() => {
    return allFeedPool.filter((p) => p.is_good_price || (p.fromOwner && p.noDeposit)).slice(0, 6);
  }, [allFeedPool]);

  const spotlightDeal = specialDeals[0] ?? null;
  const storyDeals = useMemo(() => specialDeals.slice(1, 6), [specialDeals]);

  // Жизненная логика без дублей и с поддержкой мгновенного возврата всех объектов при сбросе полигона
  const displayedGridItems = useMemo(() => {
    if (hasPolygonFilter) {
      return allFeedPool;
    }
    const raw = filterBySearchAndRooms(data?.items ?? []);
    if (!hasActiveNarrowFilter && specialDeals.length > 0 && allFeedPool.length > specialDeals.length + 2) {
      const showcasedIds = new Set(specialDeals.map((d) => d.id));
      const deduplicated = allFeedPool.filter((p) => !showcasedIds.has(p.id));
      if (deduplicated.length >= 4) {
        return deduplicated.slice(0, PAGE_SIZE);
      }
    }
    return raw;
  }, [hasPolygonFilter, allFeedPool, filterBySearchAndRooms, data?.items, hasActiveNarrowFilter, specialDeals]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const isUnder200k = filter.maxPrice === 200000;

  return (
    <div className="relative flex flex-col pb-12">
      {/* Компактная фиксированная панель поиска и быстрых таблеток-фильтров */}
      <div className="sticky top-12 z-30 bg-[#FDF5F3]/95 py-1.5 backdrop-blur-xl transition-colors duration-300 md:top-16 md:py-2.5 dark:bg-[#1B0C1A]/95">
        <div className="mx-auto flex max-w-7xl flex-col gap-1.5 px-3.5 md:gap-2 md:px-8">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="relative flex-1">
              <svg
                className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#845962] sm:h-4 sm:w-4 dark:text-[#B08D87]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Улица, район или ЖК..."
                className="h-9 w-full rounded-full bg-white pl-9 pr-8 text-xs text-[#2C0107] shadow-[0_3px_14px_rgba(44,1,7,0.06)] transition focus:ring-2 focus:ring-[#C42759]/35 focus:outline-none sm:h-10 sm:pl-10 sm:text-sm dark:bg-[#2D222F] dark:text-[#FADCD5] dark:placeholder-[#B08D87] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Очистить поиск"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#845962] hover:text-[#2C0107] dark:text-[#B08D87] dark:hover:text-[#FADCD5]"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowFullFilters((prev) => !prev)}
              className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition sm:h-10 sm:px-4 ${
                showFullFilters
                  ? 'bg-[#C42759] text-white shadow-xs dark:bg-[#6D3C52] dark:text-[#FADCD5]'
                  : 'bg-white text-[#2C0107] shadow-[0_3px_14px_rgba(44,1,7,0.06)] hover:text-[#C42759] dark:bg-[#2D222F] dark:text-[#FADCD5] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)]'
              }`}
            >
              <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
                />
              </svg>
              <span className="hidden sm:inline">Параметры</span>
            </button>
          </div>

          {/* Плотный горизонтальный скролл таблеток-фильтров */}
          <div className="no-scrollbar -mx-3.5 flex items-center gap-1.5 overflow-x-auto px-3.5 py-0.5 md:mx-0 md:px-0">
            <button
              type="button"
              onClick={() => {
                setSelectedRoomsChip(null);
                setSearchQuery('');
                setDrawnPolygon(null);
                resetFilter();
              }}
              className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold transition sm:px-3.5 sm:py-1.5 sm:text-xs ${
                !hasActiveNarrowFilter
                  ? 'bg-[#2C0107] text-[#FADCD5] dark:bg-[#FADCD5] dark:text-[#1B0C1A]'
                  : 'bg-white/80 text-[#5A2D36] hover:bg-white dark:bg-[#2D222F]/80 dark:text-[#DCBAB3]'
              }`}
            >
              Все
            </button>

            {hasPolygonFilter && (
              <button
                type="button"
                onClick={() => setDrawnPolygon(null)}
                className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-[#C42759] px-2.5 py-1 text-[11px] font-semibold text-white shadow-xs sm:px-3.5 sm:py-1.5 sm:text-xs"
              >
                <span>📍 Нарисованная зона ({allFeedPool.length})</span>
                <span>✕</span>
              </button>
            )}

            {[
              { rooms: 1, label: '1-комн.' },
              { rooms: 2, label: '2-комн.' },
              { rooms: 3, label: '3+ комн.' },
            ].map((chip) => (
              <button
                key={chip.rooms}
                type="button"
                onClick={() => setSelectedRoomsChip((prev) => (prev === chip.rooms ? null : chip.rooms))}
                className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold transition sm:px-3.5 sm:py-1.5 sm:text-xs ${
                  selectedRoomsChip === chip.rooms
                    ? 'bg-[#C42759] text-white shadow-xs dark:bg-[#6D3C52] dark:text-[#FADCD5]'
                    : 'bg-white/80 text-[#2C0107] hover:bg-white dark:bg-[#2D222F]/80 dark:text-[#FADCD5]'
                }`}
              >
                {chip.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setFilter({ fromOwner: filter.fromOwner ? undefined : true })}
              className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold transition sm:px-3.5 sm:py-1.5 sm:text-xs ${
                filter.fromOwner
                  ? 'bg-[#C42759] text-white shadow-xs dark:bg-[#6D3C52] dark:text-[#FADCD5]'
                  : 'bg-white/80 text-[#2C0107] hover:bg-white dark:bg-[#2D222F]/80 dark:text-[#FADCD5]'
              }`}
            >
              От хозяина
            </button>

            <button
              type="button"
              onClick={() => setFilter({ maxPrice: isUnder200k ? undefined : 200000 })}
              className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold transition sm:px-3.5 sm:py-1.5 sm:text-xs ${
                isUnder200k
                  ? 'bg-[#C42759] text-white shadow-xs dark:bg-[#6D3C52] dark:text-[#FADCD5]'
                  : 'bg-white/80 text-[#2C0107] hover:bg-white dark:bg-[#2D222F]/80 dark:text-[#FADCD5]'
              }`}
            >
              До 200 000 ₸
            </button>

            <button
              type="button"
              onClick={() => setFilter({ noDeposit: filter.noDeposit ? undefined : true })}
              className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold transition sm:px-3.5 sm:py-1.5 sm:text-xs ${
                filter.noDeposit
                  ? 'bg-[#C42759] text-white shadow-xs dark:bg-[#6D3C52] dark:text-[#FADCD5]'
                  : 'bg-white/80 text-[#2C0107] hover:bg-white dark:bg-[#2D222F]/80 dark:text-[#FADCD5]'
              }`}
            >
              Без залога
            </button>

            <button
              type="button"
              onClick={() => setFilter({ petsAllowed: filter.petsAllowed ? undefined : true })}
              className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold transition sm:px-3.5 sm:py-1.5 sm:text-xs ${
                filter.petsAllowed
                  ? 'bg-[#C42759] text-white shadow-xs dark:bg-[#6D3C52] dark:text-[#FADCD5]'
                  : 'bg-white/80 text-[#2C0107] hover:bg-white dark:bg-[#2D222F]/80 dark:text-[#FADCD5]'
              }`}
            >
              С питомцами
            </button>
          </div>

          {showFullFilters && (
            <div className="pt-1.5">
              <CatalogFilters filter={filter} districts={districts} onChange={setFilter} onReset={resetFilter} />
            </div>
          )}
        </div>
      </div>

      {/* Режим карты (переключается кнопкой FAB) */}
      {viewMode === 'map' ? (
        <section className="mx-auto w-full max-w-7xl px-3.5 py-2.5 md:px-8 md:py-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="font-serif text-lg font-normal text-[#2C0107] sm:text-2xl dark:text-[#FADCD5]">
                Поиск <span className="italic text-[#C42759] dark:text-[#dcbab3]">на карте</span>
              </h2>
              <p className="text-xs text-[#845962] dark:text-[#B08D87]">
                {hasPolygonFilter
                  ? `В выделенной зоне: ${allFeedPool.length} из ${poolBeforePolygon.length} объ.`
                  : `Доступно ${allFeedPool.length} объектов`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setViewMode('feed')}
              className="inline-flex h-10 items-center rounded-full border border-[#6D3C52]/15 bg-white px-4 text-xs font-semibold text-[#2C0107] shadow-2xs dark:border-gray-800 dark:bg-[#2D222F] dark:text-[#FADCD5]"
            >
              ← К списку ({allFeedPool.length})
            </button>
          </div>
          <MapComponent
            properties={poolBeforePolygon}
            totalBeforePolygon={poolBeforePolygon.length}
            drawnPolygon={drawnPolygon}
            onPolygonChange={setDrawnPolygon}
            fullscreen
          />
        </section>
      ) : (
        <>
          {/* Компактная асимметричная витрина «Успейте снять · ниже рынка» (Dumb/UI) */}
          {!hasActiveNarrowFilter && (
            <CatalogSpotlightCarousel spotlightDeal={spotlightDeal} storyDeals={storyDeals} />
          )}

          {/* Основная выдача с плотными вертикальными отступами */}
          <section className="py-1.5 md:py-5">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 px-3.5 md:gap-5 md:px-8">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-serif text-lg font-normal text-[#2C0107] sm:text-2xl dark:text-[#FADCD5]">
                  {hasPolygonFilter ? (
                    <>
                      В выбранной <span className="italic text-[#C42759] dark:text-[#dcbab3]">зоне на карте</span>
                    </>
                  ) : hasActiveNarrowFilter ? (
                    <>
                      Результаты <span className="italic text-[#C42759] dark:text-[#dcbab3]">поиска</span>
                    </>
                  ) : (
                    <>
                      Все объявления <span className="italic text-[#C42759] dark:text-[#dcbab3]">в ВКО</span>
                    </>
                  )}
                </h2>
                {data && (
                  <span className="text-xs font-medium text-[#845962] dark:text-[#B08D87]">
                    {hasPolygonFilter
                      ? `${displayedGridItems.length} из ${poolBeforePolygon.length} объ.`
                      : `${data.total} объ. · стр. ${filter.page}/${totalPages}`}
                  </span>
                )}
              </div>

              {error && (
                <div
                  className="rounded-2xl bg-[#FADCD5]/60 p-3 text-xs text-[#550416] dark:bg-[#4B2138]/60 dark:text-[#FADCD5]"
                  role="alert"
                >
                  Не удалось загрузить каталог: {error}
                </div>
              )}

              <div id="properties-grid" ref={gridRef} className="scroll-mt-28">
                {loading && !data ? (
                  <SkeletonGrid />
                ) : displayedGridItems.length === 0 ? (
                  <div className="rounded-2xl bg-white/70 p-6 text-center sm:rounded-3xl sm:p-10 dark:bg-[#2D222F]/60">
                    <p className="font-serif text-lg font-normal text-[#2C0107] dark:text-[#FADCD5]">
                      Подходящих квартир не нашлось
                    </p>
                    <p className="mt-1 text-xs text-[#845962] dark:text-[#B08D87]">
                      {hasPolygonFilter
                        ? 'Внутри нарисованного контура нет свободных объектов. Сбросьте зону или обведите более широкий район.'
                        : 'Попробуйте отключить один из быстрых фильтров сверху.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRoomsChip(null);
                        setSearchQuery('');
                        setDrawnPolygon(null);
                        resetFilter();
                      }}
                      className="mt-3 rounded-full bg-[#C42759] px-4 py-1.5 text-xs font-semibold text-white dark:bg-[#6D3C52] dark:text-[#FADCD5]"
                    >
                      Сбросить все фильтры
                    </button>
                  </div>
                ) : (
                  <div
                    className={`grid grid-cols-1 gap-x-5 gap-y-4 transition-opacity sm:gap-y-7 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${
                      loading ? 'opacity-50' : ''
                    }`}
                    aria-busy={loading}
                  >
                    {displayedGridItems.map((p) => (
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

              {!hasPolygonFilter && totalPages > 1 && (
                <nav className="mt-4 flex items-center justify-center gap-1.5" aria-label="Пагинация">
                  <button
                    aria-label="Предыдущая страница"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-xs font-semibold text-[#2C0107] shadow-2xs transition hover:text-[#C42759] disabled:opacity-30 dark:bg-[#2D222F] dark:text-[#FADCD5]"
                    disabled={filter.page <= 1}
                    onClick={() => setFilter({ page: filter.page - 1 })}
                  >
                    ←
                  </button>

                  <div className="flex flex-wrap items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setFilter({ page: pageNum })}
                        className={`h-9 w-9 rounded-full text-xs font-semibold transition ${
                          pageNum === filter.page
                            ? 'bg-[#C42759] text-white shadow-xs dark:bg-[#6D3C52] dark:text-[#FADCD5]'
                            : 'bg-white text-[#2C0107] hover:text-[#C42759] dark:bg-[#2D222F] dark:text-[#FADCD5]'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>

                  <button
                    aria-label="Следующая страница"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-xs font-semibold text-[#2C0107] shadow-2xs transition hover:text-[#C42759] disabled:opacity-30 dark:bg-[#2D222F] dark:text-[#FADCD5]"
                    disabled={filter.page >= totalPages}
                    onClick={() => setFilter({ page: filter.page + 1 })}
                  >
                    →
                  </button>
                </nav>
              )}
            </div>
          </section>

          {/* Карта с функцией рисования области в нижней части страницы */}
          <section className="pt-5 pb-4 md:pt-10">
            <div className="mx-auto max-w-7xl px-3.5 md:px-8">
              <div className="mb-3 flex items-baseline justify-between gap-2">
                <h2 className="font-serif text-lg font-normal text-[#2C0107] sm:text-2xl dark:text-[#FADCD5]">
                  Исследуйте районы <span className="italic text-[#C42759] dark:text-[#dcbab3]">на карте</span>
                </h2>
              </div>
              <MapComponent
                properties={poolBeforePolygon}
                totalBeforePolygon={poolBeforePolygon.length}
                drawnPolygon={drawnPolygon}
                onPolygonChange={setDrawnPolygon}
              />
            </div>
          </section>
        </>
      )}

      {/* Плавающая кнопка (FAB) переключения "На карте / Списком" */}
      <div className="fixed bottom-18 left-1/2 z-30 -translate-x-1/2 md:bottom-6">
        <button
          type="button"
          onClick={() => setViewMode((prev) => (prev === 'feed' ? 'map' : 'feed'))}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-[#6D3C52]/20 bg-[#2C0107]/95 px-5 text-xs font-semibold tracking-wide text-[#FADCD5] shadow-[0_10px_26px_rgba(44,1,7,0.4)] backdrop-blur-md transition duration-200 active:scale-95 hover:bg-[#C42759] dark:border-gray-800 dark:bg-[#6D3C52]/95 dark:text-[#FADCD5]"
        >
          {viewMode === 'feed' ? (
            <>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z"
                />
              </svg>
              <span>На карте · {allFeedPool.length}</span>
            </>
          ) : (
            <>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                />
              </svg>
              <span>Списком ({allFeedPool.length})</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:gap-y-7 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="aspect-[16/10] w-full animate-pulse rounded-2xl bg-[#FADCD5]/50 sm:aspect-[4/3] dark:bg-[#2D222F]" />
          <div className="h-4 w-1/2 animate-pulse rounded-full bg-[#FADCD5]/40 dark:bg-[#2D222F]" />
          <div className="h-3.5 w-3/4 animate-pulse rounded-full bg-[#FADCD5]/30 dark:bg-[#2D222F]" />
        </div>
      ))}
    </div>
  );
}
