import { CatalogFilter, Paginated, Property } from '@/types/property';
import { ApiError, apiGet, apiRequest, getApiBaseUrl } from './client';

export const PAGE_SIZE = 8;

export const propertiesApi = {
  getCatalog: (filter: CatalogFilter, signal?: AbortSignal) =>
    apiGet<Paginated<Property>>('/properties', { ...filter, limit: PAGE_SIZE }, signal),

  getAllForMap: (filter: Omit<CatalogFilter, 'page'>, signal?: AbortSignal) =>
    apiGet<Paginated<Property>>('/properties', { ...filter, page: 1, limit: 100 }, signal),

  getDistricts: (signal?: AbortSignal) => apiGet<string[]>('/dictionaries/districts', {}, signal),

  getFavorites: (token: string, signal?: AbortSignal) =>
    apiGet<Property[]>('/favorites', {}, signal, token),

  addFavorite: (propertyId: number, token: string) =>
    apiRequest<{ propertyId: number; favorited: boolean }>('POST', `/favorites/${propertyId}`, undefined, token),

  removeFavorite: (propertyId: number, token: string) =>
    apiRequest<void>('DELETE', `/favorites/${propertyId}`, undefined, token),

  uploadPropertyImage: async (propertyId: number, file: File, token: string): Promise<Property> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${getApiBaseUrl()}/properties/${propertyId}/image`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const msg = Array.isArray(errBody.message) ? errBody.message.join(', ') : errBody.message;
      throw new ApiError(res.status, msg ?? res.statusText);
    }

    return res.json() as Promise<Property>;
  },
};
