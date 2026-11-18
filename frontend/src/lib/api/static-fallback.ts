import { FALLBACK_UNSPLASH_URLS } from '@/lib/format';
import { Paginated, Property } from '@/types/property';

const SEED_PROPERTIES: Property[] = [
  {
    id: 1,
    ownerId: 1,
    title: 'Видовая 2-комнатная квартира на пр. Назарбаева',
    description:
      'Просторная светлая квартира в центре Усть-Каменогорска с современным ремонтом и полной комплектацией бытовой техникой.',
    rooms: 2,
    area: 64,
    monthlyPrice: 210000,
    petsAllowed: true,
    noDeposit: false,
    fromOwner: true,
    image_url: FALLBACK_UNSPLASH_URLS[0],
    latitude: 49.9565,
    longitude: 82.6119,
    districtAvgPrice: 195000,
    is_good_price: false,
    status: 'AVAILABLE',
    type: { id: 1, name: 'Квартира' },
    address: {
      city: 'Усть-Каменогорск',
      district: 'Ульбинский',
      street: 'пр-т Назарбаева',
      building: '42',
      apartment: '15',
      lat: 49.9565,
      lng: 82.6119,
    },
    createdAt: '2026-10-20T10:00:00Z',
  },
  {
    id: 2,
    ownerId: 1,
    title: 'Апартаменты на набережной Славского с видом на Иртыш',
    description: 'Панорамный вид на Иртыш, закрытый двор, паркинг, круглосуточное видеонаблюдение.',
    rooms: 3,
    area: 92,
    monthlyPrice: 320000,
    petsAllowed: false,
    noDeposit: false,
    fromOwner: false,
    image_url: FALLBACK_UNSPLASH_URLS[1],
    latitude: 49.9482,
    longitude: 82.6154,
    districtAvgPrice: 215000,
    is_good_price: false,
    status: 'AVAILABLE',
    type: { id: 3, name: 'Апартаменты' },
    address: {
      city: 'Усть-Каменогорск',
      district: 'Октябрьский',
      street: 'наб. Славского',
      building: '24',
      apartment: '58',
      lat: 49.9482,
      lng: 82.6154,
    },
    createdAt: '2026-10-22T12:00:00Z',
  },
  {
    id: 3,
    ownerId: 1,
    title: 'Уютная студия в районе КШТ',
    description: 'Новый жилой комплекс, тихий двор, рядом школы, парки и торговые центры, свежий ремонт.',
    rooms: 1,
    area: 34,
    monthlyPrice: 140000,
    petsAllowed: false,
    noDeposit: true,
    fromOwner: true,
    image_url: FALLBACK_UNSPLASH_URLS[2],
    latitude: 49.9268,
    longitude: 82.6485,
    districtAvgPrice: 192000,
    is_good_price: true,
    status: 'AVAILABLE',
    type: { id: 2, name: 'Студия' },
    address: {
      city: 'Усть-Каменогорск',
      district: 'КШТ',
      street: 'пр-т Казыбек би',
      building: '11',
      apartment: '32',
      lat: 49.9268,
      lng: 82.6485,
    },
    createdAt: '2026-10-25T15:30:00Z',
  },
  {
    id: 4,
    ownerId: 1,
    title: 'Просторная квартира в центре Риддера с видом на горы',
    description: 'Тёплый кирпичный дом, высокие потолки, балкон с панорамой на Ивановский хребет.',
    rooms: 2,
    area: 72,
    monthlyPrice: 165000,
    petsAllowed: true,
    noDeposit: false,
    fromOwner: true,
    image_url: FALLBACK_UNSPLASH_URLS[3],
    latitude: 50.3441,
    longitude: 83.5129,
    districtAvgPrice: 175000,
    is_good_price: true,
    status: 'AVAILABLE',
    type: { id: 4, name: 'Лофт' },
    address: {
      city: 'Риддер',
      district: 'Центральный',
      street: 'пр-т Независимости',
      building: '19',
      apartment: '8',
      lat: 50.3441,
      lng: 83.5129,
    },
    createdAt: '2026-10-28T09:15:00Z',
  },
  {
    id: 5,
    ownerId: 1,
    title: '2-комнатная квартира возле ТД Даниэль',
    description: 'Свежий евроремонт, кондиционер, вся бытовая техника, рядом центральный рынок и остановки.',
    rooms: 2,
    area: 56,
    monthlyPrice: 195000,
    petsAllowed: false,
    noDeposit: true,
    fromOwner: true,
    image_url: FALLBACK_UNSPLASH_URLS[4],
    latitude: 49.9531,
    longitude: 82.6214,
    districtAvgPrice: 205000,
    is_good_price: true,
    status: 'AVAILABLE',
    type: { id: 1, name: 'Квартира' },
    address: {
      city: 'Усть-Каменогорск',
      district: 'Ульбинский',
      street: 'ул. Казахстан',
      building: '68',
      apartment: '12',
      lat: 49.9531,
      lng: 82.6214,
    },
    createdAt: '2026-10-29T09:00:00Z',
  },
  {
    id: 6,
    ownerId: 1,
    title: 'Уютная 1-комнатная у парка Кирова',
    description: 'Тихий исторический центр, окна во двор, в шаговой доступности парк им. Касыма Кайсенова.',
    rooms: 1,
    area: 38,
    monthlyPrice: 155000,
    petsAllowed: true,
    noDeposit: true,
    fromOwner: true,
    image_url: FALLBACK_UNSPLASH_URLS[5],
    latitude: 49.9469,
    longitude: 82.6261,
    districtAvgPrice: 195000,
    is_good_price: true,
    status: 'AVAILABLE',
    type: { id: 1, name: 'Квартира' },
    address: {
      city: 'Усть-Каменогорск',
      district: 'Октябрьский',
      street: 'ул. Кирова',
      building: '43',
      apartment: '7',
      lat: 49.9469,
      lng: 82.6261,
    },
    createdAt: '2026-10-29T14:00:00Z',
  },
  {
    id: 7,
    ownerId: 1,
    title: 'Панорамные 3-комнатные апартаменты на Стрелке',
    description: 'Вид на слияние Иртыша и Ульбы, просторная лоджия, гардеробная, парковочное место.',
    rooms: 3,
    area: 88,
    monthlyPrice: 290000,
    petsAllowed: false,
    noDeposit: false,
    fromOwner: false,
    image_url: FALLBACK_UNSPLASH_URLS[6],
    latitude: 49.9562,
    longitude: 82.5968,
    districtAvgPrice: 265000,
    is_good_price: false,
    status: 'AVAILABLE',
    type: { id: 3, name: 'Апартаменты' },
    address: {
      city: 'Усть-Каменогорск',
      district: 'Стрелка',
      street: 'наб. Славского',
      building: '56',
      apartment: '91',
      lat: 49.9562,
      lng: 82.5968,
    },
    createdAt: '2026-10-30T11:00:00Z',
  },
  {
    id: 8,
    ownerId: 1,
    title: 'Светлая студия на Стрелке у набережной',
    description: 'Компактная современная студия для одного или пары, высокоскоростной интернет, смарт-ТВ.',
    rooms: 1,
    area: 32,
    monthlyPrice: 150000,
    petsAllowed: false,
    noDeposit: true,
    fromOwner: true,
    image_url: FALLBACK_UNSPLASH_URLS[7],
    latitude: 49.9548,
    longitude: 82.6012,
    districtAvgPrice: 220000,
    is_good_price: true,
    status: 'AVAILABLE',
    type: { id: 2, name: 'Студия' },
    address: {
      city: 'Усть-Каменогорск',
      district: 'Стрелка',
      street: 'ул. Пермитина',
      building: '27',
      apartment: '34',
      lat: 49.9548,
      lng: 82.6012,
    },
    createdAt: '2026-10-31T10:30:00Z',
  },
  {
    id: 9,
    ownerId: 1,
    title: 'Семейная 3-комнатная квартира на пр. Сатпаева',
    description: 'Рядом ТРЦ Maxi Mall, театр им. Жамбыла, закрытая детская площадка, два санузла.',
    rooms: 3,
    area: 82,
    monthlyPrice: 240000,
    petsAllowed: true,
    noDeposit: false,
    fromOwner: true,
    image_url: FALLBACK_UNSPLASH_URLS[8],
    latitude: 49.9224,
    longitude: 82.6542,
    districtAvgPrice: 210000,
    is_good_price: false,
    status: 'AVAILABLE',
    type: { id: 1, name: 'Квартира' },
    address: {
      city: 'Усть-Каменогорск',
      district: 'КШТ',
      street: 'пр-т Сатпаева',
      building: '34',
      apartment: '105',
      lat: 49.9224,
      lng: 82.6542,
    },
    createdAt: '2026-11-01T13:00:00Z',
  },
  {
    id: 10,
    ownerId: 1,
    title: '2-комнатная в новостройке на Есенберлина',
    description: 'Первая сдача, автономное отопление, современная кухня со встроенной посудомоечной машиной.',
    rooms: 2,
    area: 62,
    monthlyPrice: 200000,
    petsAllowed: false,
    noDeposit: false,
    fromOwner: false,
    image_url: FALLBACK_UNSPLASH_URLS[9],
    latitude: 49.9195,
    longitude: 82.6618,
    districtAvgPrice: 210000,
    is_good_price: false,
    status: 'AVAILABLE',
    type: { id: 1, name: 'Квартира' },
    address: {
      city: 'Усть-Каменогорск',
      district: 'КШТ',
      street: 'ул. Есенберлина',
      building: '19',
      apartment: '44',
      lat: 49.9195,
      lng: 82.6618,
    },
    createdAt: '2026-11-02T15:00:00Z',
  },
  {
    id: 11,
    ownerId: 1,
    title: 'Тёплая 2-комнатная возле ВКТУ им. Серикбаева',
    description: 'Отличный вариант для преподавателей или студентов, рядом трамвайная линия и супермаркеты.',
    rooms: 2,
    area: 51,
    monthlyPrice: 170000,
    petsAllowed: false,
    noDeposit: true,
    fromOwner: true,
    image_url: FALLBACK_UNSPLASH_URLS[10],
    latitude: 49.9674,
    longitude: 82.6189,
    districtAvgPrice: 195000,
    is_good_price: true,
    status: 'AVAILABLE',
    type: { id: 1, name: 'Квартира' },
    address: {
      city: 'Усть-Каменогорск',
      district: 'Ульбинский',
      street: 'пр-т Шакарима',
      building: '75',
      apartment: '18',
      lat: 49.9674,
      lng: 82.6189,
    },
    createdAt: '2026-11-03T10:00:00Z',
  },
  {
    id: 12,
    ownerId: 1,
    title: 'Студия в районе центрального автовокзала',
    description: 'Удобная транспортная развязка, свежий косметический ремонт, низкие коммунальные платежи.',
    rooms: 1,
    area: 30,
    monthlyPrice: 130000,
    petsAllowed: true,
    noDeposit: true,
    fromOwner: true,
    image_url: FALLBACK_UNSPLASH_URLS[11],
    latitude: 49.951,
    longitude: 82.6335,
    districtAvgPrice: 195000,
    is_good_price: true,
    status: 'AVAILABLE',
    type: { id: 2, name: 'Студия' },
    address: {
      city: 'Усть-Каменогорск',
      district: 'Октябрьский',
      street: 'ул. Кабанбай батыра',
      building: '114',
      apartment: '60',
      lat: 49.951,
      lng: 82.6335,
    },
    createdAt: '2026-11-03T16:00:00Z',
  },
];

function getStoredProps(): Property[] {
  if (typeof window === 'undefined') return SEED_PROPERTIES;
  try {
    const raw = localStorage.getItem('velvet_static_properties');
    if (raw) return JSON.parse(raw);
  } catch {}
  return SEED_PROPERTIES;
}

function saveStoredProps(props: Property[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('velvet_static_properties', JSON.stringify(props));
  } catch {}
}

export function handleStaticFallbackGet<T>(
  path: string,
  params: Record<string, string | number | boolean | undefined> = {},
): T {
  const allProps = getStoredProps();

  if (path === '/dictionaries/districts') {
    const districts = Array.from(new Set(allProps.map((p) => p.address.district))).sort();
    return districts as unknown as T;
  }

  if (path === '/properties/my' || path === '/landlord/properties') {
    return allProps as unknown as T;
  }

  if (path === '/applications' || path === '/landlord/applications' || path === '/tenant/applications') {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('velvet_static_applications');
      if (raw) return JSON.parse(raw) as T;
    }
    return [] as unknown as T;
  }

  if (path === '/favorites') {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('velvet_static_favorites');
      const favIds: number[] = raw ? JSON.parse(raw) : [1, 3];
      return allProps.filter((p) => favIds.includes(p.id)) as unknown as T;
    }
    return [] as unknown as T;
  }

  const propMatch = path.match(/^\/properties\/(\d+)$/);
  if (propMatch) {
    const id = Number(propMatch[1]);
    const found = allProps.find((p) => p.id === id) ?? allProps[0];
    return found as unknown as T;
  }

  if (path === '/properties') {
    let items = allProps.filter((p) => p.status === 'AVAILABLE');
    if (params.district) {
      items = items.filter((p) => p.address.district.toUpperCase() === String(params.district).toUpperCase());
    }
    if (params.minPrice !== undefined && params.minPrice !== '') {
      items = items.filter((p) => p.monthlyPrice >= Number(params.minPrice));
    }
    if (params.maxPrice !== undefined && params.maxPrice !== '') {
      items = items.filter((p) => p.monthlyPrice <= Number(params.maxPrice));
    }
    if (params.petsAllowed !== undefined) {
      items = items.filter((p) => Boolean(p.petsAllowed) === Boolean(params.petsAllowed));
    }
    if (params.noDeposit !== undefined) {
      items = items.filter((p) => Boolean(p.noDeposit) === Boolean(params.noDeposit));
    }
    if (params.fromOwner !== undefined) {
      items = items.filter((p) => Boolean(p.fromOwner) === Boolean(params.fromOwner));
    }

    if (params.sortBy === 'price_asc') items.sort((a, b) => a.monthlyPrice - b.monthlyPrice);
    else if (params.sortBy === 'price_desc') items.sort((a, b) => b.monthlyPrice - a.monthlyPrice);
    else if (params.sortBy === 'area_desc') items.sort((a, b) => b.area - a.area);

    const page = Number(params.page ?? 1);
    const limit = Number(params.limit ?? 8);
    const total = items.length;
    const paged = items.slice((page - 1) * limit, page * limit);
    const result: Paginated<Property> = { items: paged, total, page, limit };
    return result as unknown as T;
  }

  return [] as unknown as T;
}

export function handleStaticFallbackMutation<T>(
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: any,
): T {
  if (path === '/auth/login') {
    const email = String(body?.email ?? 'landlord@example.com').toLowerCase();
    const isLandlord = email.includes('landlord') || email.includes('alikhan');
    return {
      user: {
        id: 1,
        fullName: isLandlord ? 'Иван Петров (Арендодатель)' : 'Анна Смирнова (Арендатор)',
        email,
        role: isLandlord ? 'LANDLORD' : 'TENANT',
      },
    } as unknown as T;
  }

  if (path === '/auth/register') {
    return {
      user: {
        id: Date.now(),
        fullName: body?.fullName ?? 'Пользователь ВКО',
        email: body?.email ?? 'user@example.com',
        role: body?.role ?? 'TENANT',
      },
    } as unknown as T;
  }

  const favMatch = path.match(/^\/favorites\/(\d+)$/);
  if (favMatch && typeof window !== 'undefined') {
    const propId = Number(favMatch[1]);
    const raw = localStorage.getItem('velvet_static_favorites');
    const favs: number[] = raw ? JSON.parse(raw) : [];
    const next = method === 'DELETE' ? favs.filter((id) => id !== propId) : Array.from(new Set([...favs, propId]));
    localStorage.setItem('velvet_static_favorites', JSON.stringify(next));
    return { propertyId: propId, favorited: method !== 'DELETE' } as unknown as T;
  }

  const appMatch = path.match(/^\/properties\/(\d+)\/applications$/);
  if (appMatch && method === 'POST' && typeof window !== 'undefined') {
    const propId = Number(appMatch[1]);
    const allProps = getStoredProps();
    const prop = allProps.find((p) => p.id === propId);
    const raw = localStorage.getItem('velvet_static_applications');
    const apps = raw ? JSON.parse(raw) : [];
    const created = {
      id: apps.length + 1,
      propertyId: propId,
      propertyTitle: prop?.title ?? `Объект #${propId}`,
      tenantName: 'Анна Смирнова (Арендатор)',
      desiredStartDate: body?.desiredStartDate ?? '2026-12-01',
      leaseMonths: Number(body?.leaseMonths ?? 12),
      status: 'PENDING',
    };
    apps.unshift(created);
    localStorage.setItem('velvet_static_applications', JSON.stringify(apps));
    return created as unknown as T;
  }

  if (path === '/properties' && method === 'POST') {
    const allProps = getStoredProps();
    const nextId = Math.max(0, ...allProps.map((p) => p.id)) + 1;
    const created: Property = {
      id: nextId,
      ownerId: 1,
      title: body?.title ?? 'Новая резиденция',
      description: body?.description ?? null,
      rooms: Number(body?.rooms ?? 2),
      area: Number(body?.area ?? 54),
      monthlyPrice: Number(body?.monthlyPrice ?? 180000),
      petsAllowed: Boolean(body?.petsAllowed),
      noDeposit: Boolean(body?.noDeposit),
      fromOwner: Boolean(body?.fromOwner ?? true),
      image_url: FALLBACK_UNSPLASH_URLS[nextId % FALLBACK_UNSPLASH_URLS.length],
      latitude: Number(body?.latitude ?? 49.953),
      longitude: Number(body?.longitude ?? 82.618),
      districtAvgPrice: 195000,
      is_good_price: true,
      status: 'AVAILABLE',
      type: { id: 1, name: 'Квартира' },
      address: {
        city: body?.address?.city ?? 'Усть-Каменогорск',
        district: body?.address?.district ?? 'Ульбинский',
        street: body?.address?.street ?? 'пр-т Назарбаева',
        building: body?.address?.building ?? '1',
        apartment: null,
        lat: Number(body?.latitude ?? 49.953),
        lng: Number(body?.longitude ?? 82.618),
      },
      createdAt: new Date().toISOString(),
    };
    saveStoredProps([created, ...allProps]);
    return created as unknown as T;
  }

  return { contractId: 1, paymentsCreated: 12 } as unknown as T;
}
