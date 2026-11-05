import { CatalogFilter, Paginated, Property } from '@/types/property';
import { apiGet } from './client';

<<<<<<< Updated upstream
export const PAGE_SIZE = 8;
=======
export const PAGE_SIZE = 12;
>>>>>>> Stashed changes

export const propertiesApi = {
  getCatalog: (filter: CatalogFilter, signal?: AbortSignal) =>
    apiGet<Paginated<Property>>('/properties', { ...filter, limit: PAGE_SIZE }, signal),

<<<<<<< Updated upstream
  getAllForMap: (filter: Omit<CatalogFilter, 'page'>, signal?: AbortSignal) =>
    apiGet<Paginated<Property>>('/properties', { ...filter, page: 1, limit: 100 }, signal),

=======
>>>>>>> Stashed changes
  getDistricts: (signal?: AbortSignal) => apiGet<string[]>('/dictionaries/districts', {}, signal),
};

