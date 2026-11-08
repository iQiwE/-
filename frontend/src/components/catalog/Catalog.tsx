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
    <div className="flex h-[420px] items-center justify-center rounded-2xl bg-[#F3ECE2] text-sm text-[#6B5B50] dark:bg-[#1C1A18] dark:text-[#A8A096]">
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
      {/* Секция 1: Editorial Hero + Панель фильтрации */}
      <section className="border-b border-[#E8DFD3] bg-[#FAF6F0] py-14 transition-colors duration-300 lg:py-20 dark:border-white/10 dark:bg-[#141312]">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 lg:px-8">
          <header className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <span className="inline-block text-[11px] font-medium uppercase tracking-[0.22em] text-[#B85D3B] dark:text-[#B89778]">
                Восточно-Казахстанская область · Кураторская коллекция жилья
              </span>
              <h1 className="mt-4 font-serif text-4xl font-normal leading-[1.15] tracking-tight text-[#2C221E] sm:text-5xl lg:text-[54px] dark:text-[#F5F3EF]">
                Почувствуйте уют и откройте свой{' '}
                <span className="italic text-[#B85D3B] dark:text-[#B89778]">баланс комфорта.</span>
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#6B5B50] dark:text-[#A8A096]">
                Проверенные квартиры, видовые апартаменты и авторские резиденции для долгосрочной аренды в
                Усть-Каменогорске и Риддере с прямым оформлением договора.
              </p>
            </div>
            {data && (
              <div className="self-start rounded-full border border-[#E2D6C8] bg-white px-5 py-2.5 text-xs font-medium uppercase tracking-[0.14em] text-[#5C4D44] shadow-2xs lg:self-end dark:border-white/12 dark:bg-[#1C1A18] dark:text-[#C7BFB5]">
                Найдено резиденций:{' '}
                <span className="font-bold text-[#B85D3B] dark:text-[#D4B89C]">{data.total}</span>
              </div>
            )}
          </header>

          <CatalogFilters filter={filter} districts={districts} onChange={setFilter} onReset={resetFilter} />
        </div>
      </section>

      {/* Секция 2: Каталог карточек и Пагинация */}
      <section className="bg-[#FAF6F0] py-14 transition-colors duration-300 lg:py-20 dark:bg-[#141312]">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 lg:px-8">
          <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-[#E8DFD3] pb-5 dark:border-white/10">
            <div>
              <span className="block text-[11px] font-medium uppercase tracking-[0.2em] text-[#B85D3B] dark:text-[#B89778]">
                Избранные предложения
              </span>
              <h2 className="mt-1 font-serif text-3xl font-normal text-[#2C221E] dark:text-[#F5F3EF]">
                Доступные <span className="italic text-[#B85D3B] dark:text-[#B89778]">резиденции</span>
              </h2>
            </div>
            {data && (
              <span className="text-xs font-medium uppercase tracking-[0.16em] text-[#6B5B50] dark:text-[#8C8278]">
                Страница {filter.page} из {totalPages}
              </span>
            )}
          </div>

          {error && (
            <div
              className="rounded-2xl border border-[#E8C5B8] bg-[#FDF2EE] p-5 text-sm text-[#9E3B24] dark:border-[#E06C53]/30 dark:bg-[#2A1916] dark:text-[#F29B88]"
              role="alert"
            >
              Не удалось загрузить каталог: {error}
            </div>
          )}

          {/* Якорь автоскролла пагинации: scroll-mt-28 (112px) > высоты sticky-шапки h-20 (80px) */}
          <div id="properties-grid" ref={gridRef} className="scroll-mt-28">
            {loading && !data ? (
              <SkeletonGrid />
            ) : data && data.items.length === 0 ? (
              <div className="rounded-2xl border border-[#ECE2D6] bg-white p-16 text-center shadow-[0_4px_24px_rgba(44,34,30,0.04)] dark:border-white/10 dark:bg-[#1C1A18]">
                <p className="font-serif text-2xl font-normal text-[#2C221E] dark:text-[#F5F3EF]">
                  По заданным условиям объектов не найдено
                </p>
                <p className="mt-2 text-sm text-[#6B5B50] dark:text-[#A8A096]">
                  Попробуйте смягчить параметры фильтрации или сбросить активные теги.
                </p>
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
            <nav className="mt-6 flex items-center justify-center gap-2" aria-label="Пагинация">
              <button
                aria-label="Предыдущая страница"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E2D6C8] bg-white text-sm font-medium text-[#3D302A] transition hover:border-[#B85D3B] hover:bg-[#FAF6F0] disabled:opacity-35 dark:border-white/15 dark:bg-[#1C1A18] dark:text-[#E5E0D8] dark:hover:border-[#B89778] dark:hover:bg-[#25221F]"
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
                    className={`h-10 w-10 rounded-full text-xs font-semibold transition ${
                      pageNum === filter.page
                        ? 'bg-[#B85D3B] text-white shadow-xs dark:bg-[#B89778] dark:text-[#141312]'
                        : 'border border-[#E2D6C8] bg-white text-[#3D302A] hover:border-[#B85D3B] hover:bg-[#FAF6F0] dark:border-white/15 dark:bg-[#1C1A18] dark:text-[#E5E0D8] dark:hover:border-[#B89778] dark:hover:bg-[#25221F]'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                aria-label="Следующая страница"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E2D6C8] bg-white text-sm font-medium text-[#3D302A] transition hover:border-[#B85D3B] hover:bg-[#FAF6F0] disabled:opacity-35 dark:border-white/15 dark:bg-[#1C1A18] dark:text-[#E5E0D8] dark:hover:border-[#B89778] dark:hover:bg-[#25221F]"
                disabled={filter.page >= totalPages}
                onClick={() => setFilter({ page: filter.page + 1 })}
              >
                →
              </button>
            </nav>
          )}
        </div>
      </section>

      {/* Секция 3: Интерактивная карта */}
      <section className="border-t border-[#ECE3D8] bg-white py-16 transition-colors duration-300 lg:py-20 dark:border-white/10 dark:bg-[#181614]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <span className="block text-[11px] font-medium uppercase tracking-[0.2em] text-[#B85D3B] dark:text-[#B89778]">
                География присутствия
              </span>
              <h2 className="mt-1 font-serif text-3xl font-normal text-[#2C221E] dark:text-[#F5F3EF]">
                Расположение <span className="italic text-[#B85D3B] dark:text-[#B89778]">на карте</span>
              </h2>
              <p className="mt-1.5 text-sm text-[#6B5B50] dark:text-[#A8A096]">
                Исследуйте кварталы города и выбирайте жилье с панорамными видами и удобной инфраструктурой
              </p>
            </div>
          </div>
          <CatalogMap properties={mapProperties} />
        </div>
      </section>

      {/* Секция 4: Геометрическая сетка ценностей в стиле Editorial Dark Luxury */}
      <section className="border-t border-[#ECE3D8] bg-[#FAF6F0] transition-colors duration-300 dark:border-white/10 dark:bg-[#141312]">
        <div className="mx-auto grid max-w-7xl lg:grid-cols-[1fr_2fr]">
          <div className="flex flex-col justify-between border-b border-[#ECE3D8] p-8 lg:border-b-0 lg:border-r lg:p-14 dark:border-white/10">
            <div>
              <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#B85D3B] dark:text-[#B89778]">
                Философия сервиса
              </span>
              <h2 className="mt-3 font-serif text-3xl font-normal text-[#2C221E] sm:text-4xl dark:text-[#F5F3EF]">
                Наши <span className="italic text-[#B85D3B] dark:text-[#B89778]">принципы</span>
              </h2>
            </div>
            <p className="mt-6 text-sm leading-relaxed text-[#6B5B50] dark:text-[#A8A096]">
              Каждая резиденция проходит проверку на соответствие стандартам комфорта, юридической чистоты и честного
              ценообразования по районам ВКО.
            </p>
          </div>

          <div className="grid sm:grid-cols-2">
            <div className="border-b border-[#ECE3D8] p-8 sm:border-r lg:p-12 dark:border-white/10">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#B85D3B] dark:text-[#B89778]">
                01 · Прозрачность сделок
              </span>
              <p className="mt-3 text-sm leading-relaxed text-[#5C4D44] dark:text-[#B8B0A6]">
                Автоматическое формирование официального договора аренды и помесячного графика платежей сразу после
                одобрения заявки собственником.
              </p>
            </div>
            <div className="border-b border-[#ECE3D8] p-8 lg:p-12 dark:border-white/10">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#B85D3B] dark:text-[#B89778]">
                02 · Аналитика рыночной цены
              </span>
              <p className="mt-3 text-sm leading-relaxed text-[#5C4D44] dark:text-[#B8B0A6]">
                Интеллектуальное сравнение стоимости каждой квартиры со среднерыночной ставкой по району для выделения
                лучших предложений.
              </p>
            </div>
            <div className="border-b border-[#ECE3D8] p-8 sm:border-b-0 sm:border-r lg:p-12 dark:border-white/10">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#B85D3B] dark:text-[#B89778]">
                03 · Прямой контакт
              </span>
              <p className="mt-3 text-sm leading-relaxed text-[#5C4D44] dark:text-[#B8B0A6]">
                Объекты напрямую от верифицированных собственников без скрытых комиссий, с гибкими условиями по залогу и
                проживанию с питомцами.
              </p>
            </div>
            <div className="p-8 lg:p-12">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#B85D3B] dark:text-[#B89778]">
                04 · Интерактивная картография
              </span>
              <p className="mt-3 text-sm leading-relaxed text-[#5C4D44] dark:text-[#B8B0A6]">
                Наглядный поиск по районам Усть-Каменогорска и Риддера с кластеризацией объектов и быстрым превью
                интерьеров прямо на карте.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-96 animate-pulse rounded-2xl bg-[#EFE7DC] dark:bg-[#1E1C1A]" />
      ))}
    </div>
  );
}
