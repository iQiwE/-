export type PropertyStatus = 'AVAILABLE' | 'RENTED' | 'INACTIVE';

export interface Property {
  id: number;
  ownerId: number;
  title: string;
  description: string | null;
  rooms: number;
  area: number;
  monthlyPrice: number;
  petsAllowed: boolean;
  noDeposit: boolean;
  fromOwner: boolean;
  image_url?: string | null;
  images?: string[];
  latitude?: number;
  longitude?: number;
  districtAvgPrice?: number;
  is_good_price: boolean;
  status: PropertyStatus;
  type: { id: number; name: string };
  address: {
    city: string;
    district: string;
    street: string;
    building: string;
    apartment: string | null;
    lat: number;
    lng: number;
  };
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export type CatalogSortBy = 'newest' | 'price_asc' | 'price_desc' | 'area_desc';

export interface CatalogFilter {
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  petsAllowed?: boolean;
  noDeposit?: boolean;
  fromOwner?: boolean;
  sortBy?: CatalogSortBy;
  page: number;
}
