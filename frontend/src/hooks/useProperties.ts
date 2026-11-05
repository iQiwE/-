'use client';

import { useEffect, useState } from 'react';
import { propertiesApi } from '@/lib/api/properties.api';
import { CatalogFilter, Paginated, Property } from '@/types/property';

interface State {
  data: Paginated<Property> | null;
  loading: boolean;
  error: string | null;
}

/** Загружает каталог; устаревшие запросы отменяются через AbortController. */
export function useProperties(filter: CatalogFilter): State {
  const [state, setState] = useState<State>({ data: null, loading: true, error: null });
<<<<<<< Updated upstream
  const { district, minPrice, maxPrice, sortBy, page } = filter;
=======
  const { district, minPrice, maxPrice, page } = filter;
>>>>>>> Stashed changes

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));

    propertiesApi
<<<<<<< Updated upstream
      .getCatalog({ district, minPrice, maxPrice, sortBy, page }, controller.signal)
=======
      .getCatalog({ district, minPrice, maxPrice, page }, controller.signal)
>>>>>>> Stashed changes
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err: Error) => {
        if (err.name !== 'AbortError') setState((s) => ({ ...s, loading: false, error: err.message }));
      });

    return () => controller.abort();
<<<<<<< Updated upstream
  }, [district, minPrice, maxPrice, sortBy, page]);
=======
  }, [district, minPrice, maxPrice, page]);
>>>>>>> Stashed changes

  return state;
}

