export type PropertyStatus = 'AVAILABLE' | 'RENTED' | 'INACTIVE';

export interface Property {
  id: number;
  ownerId: number;
  title: string;
  description: string | null;
  rooms: number;
  area: number;
  monthlyPrice: number;
  status: PropertyStatus;
  type: { id: number; name: string };
<<<<<<< Updated upstream
  address: {
    city: string;
    district: string;
    street: string;
    building: string;
    apartment: string | null;
    lat: number;
    lng: number;
  };
=======
  address: { city: string; district: string; street: string; building: string; apartment: string | null };
>>>>>>> Stashed changes
  createdAt: Date;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

