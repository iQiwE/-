import { CatalogFilter, Paginated, Property } from '@/types/property';
import { apiGet } from './client';

export const PAGE_SIZE = 8;

export const propertiesApi = {
  getCatalog: (filter: CatalogFilter, signal?: AbortSignal) =>
    apiGet<Paginated<Property>>('/properties', { ...filter, limit: PAGE_SIZE }, signal),

  getAllForMap: (filter: Omit<CatalogFilter, 'page'>, signal?: AbortSignal) =>
    apiGet<Paginated<Property>>('/properties', { ...filter, page: 1, limit: 100 }, signal),

  getDistricts: (signal?: AbortSignal) => apiGet<string[]>('/dictionaries/districts', {}, signal),
};

