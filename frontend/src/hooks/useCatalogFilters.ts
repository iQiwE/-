'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { CatalogFilter, CatalogSortBy } from '@/types/property';

const toNumber = (v: string | null): number | undefined => {
  if (v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

/**
 * Фильтры хранятся в URL (?district=&minPrice=&maxPrice=&page=):
 * ссылкой можно поделиться, кнопка «Назад» в браузере работает.
 */
export function useCatalogFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filter: CatalogFilter = useMemo(
    () => ({
      district: searchParams.get('district') || undefined,
      minPrice: toNumber(searchParams.get('minPrice')),
      maxPrice: toNumber(searchParams.get('maxPrice')),
      sortBy: (searchParams.get('sortBy') as CatalogSortBy) || 'newest',
      page: toNumber(searchParams.get('page')) || 1,
    }),
    [searchParams],
  );

  /** Обновляет фильтры; при их изменении сбрасывает страницу на первую. */
  const setFilter = useCallback(
    (patch: Partial<CatalogFilter>) => {
      const next = { ...filter, ...patch, page: patch.page ?? 1 };
      const params = new URLSearchParams();
      Object.entries(next).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && !(key === 'page' && value === 1)) {
          params.set(key, String(value));
        }
      });
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [filter, pathname, router],
  );

  const resetFilter = useCallback(() => router.replace(pathname, { scroll: false }), [pathname, router]);

  return { filter, setFilter, resetFilter };
}

