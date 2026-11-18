'use client';

import { useCallback, useEffect, useState } from 'react';
import { propertiesApi } from '@/lib/api/properties.api';
import { CatalogFilter, Paginated, Property } from '@/types/property';

interface State {
  data: Paginated<Property> | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

function sanitizeCatalogError(rawMessage?: string): string {
  if (!rawMessage) {
    return 'Нет связи с сервером. Проверьте подключение к сети или попробуйте позже.';
  }
  const lower = rawMessage.toLowerCase();
  if (
    lower.includes('invalid url') ||
    lower.includes('failed to construct') ||
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('load failed') ||
    lower.includes('fetch')
  ) {
    return 'Нет связи с сервером. Проверьте подключение к сети или обновите страницу.';
  }
  return rawMessage;
}

/** Загружает каталог; устаревшие запросы отменяются через AbortController. */
export function useProperties(filter: CatalogFilter): State {
  const [state, setState] = useState<Omit<State, 'retry'>>({ data: null, loading: true, error: null });
  const [reloadKey, setReloadKey] = useState(0);
  const { district, minPrice, maxPrice, petsAllowed, noDeposit, fromOwner, sortBy, page } = filter;

  const retry = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));

    propertiesApi
      .getCatalog({ district, minPrice, maxPrice, petsAllowed, noDeposit, fromOwner, sortBy, page }, controller.signal)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err: Error) => {
        if (err.name !== 'AbortError') {
          setState((s) => ({ ...s, loading: false, error: sanitizeCatalogError(err.message) }));
        }
      });

    return () => controller.abort();
  }, [district, minPrice, maxPrice, petsAllowed, noDeposit, fromOwner, sortBy, page, reloadKey]);

  return { ...state, retry };
}
