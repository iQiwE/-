import * as fs from 'fs';
import * as path from 'path';
import { Result } from 'oracledb';

const SNAPSHOT_FILE = path.resolve(__dirname, '..', '..', 'oracle-data-snapshot.json');

export const UNSPLASH_INTERIOR_URLS: string[] = [
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=600&q=80',
];

export function defaultImageUrlForPropertyId(id: number): string {
  const idx = Math.max(0, Number(id) - 1) % UNSPLASH_INTERIOR_URLS.length;
  return UNSPLASH_INTERIOR_URLS[idx];
}

export function sanitizePropertyImageUrl(rawUrl: unknown, propertyId: number): string {
  if (typeof rawUrl !== 'string') return defaultImageUrlForPropertyId(propertyId);
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.startsWith('data:')) {
    return defaultImageUrlForPropertyId(propertyId);
  }
  // Пропускаем только проверенные фото интерьеров (белый список), иначе — заглушка
  if (trimmed.startsWith('https://')) {
    return UNSPLASH_INTERIOR_URLS.includes(trimmed) ? trimmed : defaultImageUrlForPropertyId(propertyId);
  }
  if (trimmed.startsWith('/uploads/')) {
    const fileName = path.basename(trimmed);
    // Исключаем тестовый скриншот интерфейса
    if (fileName === 'property-46-1793942954215-493262.png') {
      return defaultImageUrlForPropertyId(propertyId);
    }
    const diskPath = path.resolve(__dirname, '..', '..', 'uploads', fileName);
    if (fs.existsSync(diskPath)) {
      return `/uploads/${fileName}`;
    }
    return defaultImageUrlForPropertyId(propertyId);
  }
  return defaultImageUrlForPropertyId(propertyId);
}

export interface LandlordRecord {
  ID: number;
  FULL_NAME: string;
  EMAIL: string;
  PHONE: string | null;
  PASSWORD_HASH: string;
}

export interface TenantRecord {
  ID: number;
  FULL_NAME: string;
  EMAIL: string;
  PHONE: string | null;
  PASSWORD_HASH: string;
}

export interface FavoriteRecord {
  USER_ID: number;
  PROPERTY_ID: number;
  CREATED_AT: Date | string;
}

/**
 * Хранилище таблиц Oracle (LANDLORDS, TENANTS, PROPERTY_TYPES, ADDRESSES, PROPERTIES,
 * FAVORITES, RENTAL_APPLICATIONS, CONTRACTS, PAYMENTS) с автоматической миграцией
 * и синхронизацией в oracle-data-snapshot.json.
 */
export class InMemoryOracleStore {
  private seq = {
    landlord: 2,
    tenant: 1,
    type: 4,
    address: 14,
    property: 14,
    application: 0,
    contract: 0,
    payment: 0,
  };

  private state = {
    landlords: [
      {
        ID: 1,
        FULL_NAME: 'Иван Петров (Арендодатель)',
        EMAIL: 'landlord@example.com',
        PHONE: '+79001112233',
        PASSWORD_HASH: '$2b$10$xvB8XDvLB9FmiuB4sQsgMuDG24SgIcz4fBjxP/oY.rKdcI3JOo8Gq',
      },
    ] as LandlordRecord[],
    tenants: [
      {
        ID: 1,
        FULL_NAME: 'Анна Смирнова (Арендатор)',
        EMAIL: 'tenant@example.com',
        PHONE: '+79004445566',
        PASSWORD_HASH: '$2b$10$xvB8XDvLB9FmiuB4sQsgMuDG24SgIcz4fBjxP/oY.rKdcI3JOo8Gq',
      },
    ] as TenantRecord[],
    propertyTypes: [
      { TYPE_ID: 1, TYPE_NAME: 'Квартира' },
      { TYPE_ID: 2, TYPE_NAME: 'Студия' },
      { TYPE_ID: 3, TYPE_NAME: 'Апартаменты' },
      { TYPE_ID: 4, TYPE_NAME: 'Лофт' },
    ],
    addresses: [
      { ADDRESS_ID: 1, CITY: 'Усть-Каменогорск', DISTRICT: 'Ульбинский', STREET: 'пр-т Назарбаева', BUILDING: '42', APARTMENT: '15', LAT: 49.9565, LNG: 82.6119 },
      { ADDRESS_ID: 2, CITY: 'Усть-Каменогорск', DISTRICT: 'Октябрьский', STREET: 'наб. Славского', BUILDING: '24', APARTMENT: '58', LAT: 49.9482, LNG: 82.6154 },
      { ADDRESS_ID: 3, CITY: 'Усть-Каменогорск', DISTRICT: 'КШТ', STREET: 'пр-т Казыбек би', BUILDING: '11', APARTMENT: '32', LAT: 49.9268, LNG: 82.6485 },
      { ADDRESS_ID: 4, CITY: 'Риддер', DISTRICT: 'Центральный', STREET: 'пр-т Независимости', BUILDING: '19', APARTMENT: '8', LAT: 50.3441, LNG: 83.5129 },
      { ADDRESS_ID: 5, CITY: 'Усть-Каменогорск', DISTRICT: 'Ульбинский', STREET: 'ул. Казахстан', BUILDING: '68', APARTMENT: '12', LAT: 49.9531, LNG: 82.6214 },
      { ADDRESS_ID: 6, CITY: 'Усть-Каменогорск', DISTRICT: 'Октябрьский', STREET: 'ул. Кирова', BUILDING: '43', APARTMENT: '7', LAT: 49.9469, LNG: 82.6261 },
      { ADDRESS_ID: 7, CITY: 'Усть-Каменогорск', DISTRICT: 'Стрелка', STREET: 'наб. Славского', BUILDING: '56', APARTMENT: '91', LAT: 49.9562, LNG: 82.5968 },
      { ADDRESS_ID: 8, CITY: 'Усть-Каменогорск', DISTRICT: 'Стрелка', STREET: 'ул. Пермитина', BUILDING: '27', APARTMENT: '34', LAT: 49.9548, LNG: 82.6012 },
      { ADDRESS_ID: 9, CITY: 'Усть-Каменогорск', DISTRICT: 'КШТ', STREET: 'пр-т Сатпаева', BUILDING: '34', APARTMENT: '105', LAT: 49.9224, LNG: 82.6542 },
      { ADDRESS_ID: 10, CITY: 'Усть-Каменогорск', DISTRICT: 'КШТ', STREET: 'ул. Есенберлина', BUILDING: '19', APARTMENT: '44', LAT: 49.9195, LNG: 82.6618 },
      { ADDRESS_ID: 11, CITY: 'Усть-Каменогорск', DISTRICT: 'Ульбинский', STREET: 'пр-т Шакарима', BUILDING: '75', APARTMENT: '18', LAT: 49.9674, LNG: 82.6189 },
      { ADDRESS_ID: 12, CITY: 'Усть-Каменогорск', DISTRICT: 'Октябрьский', STREET: 'ул. Кабанбай батыра', BUILDING: '114', APARTMENT: '60', LAT: 49.9510, LNG: 82.6335 },
      { ADDRESS_ID: 13, CITY: 'Усть-Каменогорск', DISTRICT: 'Защита', STREET: 'ул. Вострецова', BUILDING: '21', APARTMENT: '9', LAT: 49.9912, LNG: 82.5890 },
      { ADDRESS_ID: 14, CITY: 'Усть-Каменогорск', DISTRICT: 'Согра', STREET: 'ул. Согринская', BUILDING: '15', APARTMENT: '4', LAT: 49.9825, LNG: 82.6940 },
    ],
    properties: [
      {
        PROPERTY_ID: 1,
        LANDLORD_ID: 1,
        TYPE_ID: 1,
        ADDRESS_ID: 1,
        TITLE: 'Видовая 2-комнатная квартира на пр. Назарбаева',
        DESCRIPTION: 'Просторная светлая квартира в центре Усть-Каменогорска с современным ремонтом и полной комплектацией бытовой техникой.',
        ROOMS: 2,
        AREA: 64,
        MONTHLY_PRICE: 210000,
        PETS_ALLOWED: 1,
        NO_DEPOSIT: 0,
        FROM_OWNER: 1,
        STATUS: 'AVAILABLE',
        CREATED_AT: new Date('2026-10-20T10:00:00Z'),
      },
      {
        PROPERTY_ID: 2,
        LANDLORD_ID: 1,
        TYPE_ID: 3,
        ADDRESS_ID: 2,
        TITLE: 'Апартаменты на набережной Славского с видом на Иртыш',
        DESCRIPTION: 'Панорамный вид на Иртыш, закрытый двор, паркинг, круглосуточное видеонаблюдение.',
        ROOMS: 3,
        AREA: 92,
        MONTHLY_PRICE: 320000,
        PETS_ALLOWED: 0,
        NO_DEPOSIT: 0,
        FROM_OWNER: 0,
        STATUS: 'AVAILABLE',
        CREATED_AT: new Date('2026-10-22T12:00:00Z'),
      },
      {
        PROPERTY_ID: 3,
        LANDLORD_ID: 1,
        TYPE_ID: 2,
        ADDRESS_ID: 3,
        TITLE: 'Уютная студия в районе КШТ',
        DESCRIPTION: 'Новый жилой комплекс, тихий двор, рядом школы, парки и торговые центры, свежий ремонт.',
        ROOMS: 1,
        AREA: 34,
        MONTHLY_PRICE: 140000,
        PETS_ALLOWED: 0,
        NO_DEPOSIT: 1,
        FROM_OWNER: 1,
        STATUS: 'AVAILABLE',
        CREATED_AT: new Date('2026-10-25T15:30:00Z'),
      },
      {
        PROPERTY_ID: 4,
        LANDLORD_ID: 1,
        TYPE_ID: 4,
        ADDRESS_ID: 4,
        TITLE: 'Просторная квартира в центре Риддера с видом на горы',
        DESCRIPTION: 'Тёплый кирпичный дом, высокие потолки, балкон с панорамой на Ивановский хребет.',
        ROOMS: 2,
        AREA: 72,
        MONTHLY_PRICE: 165000,
        PETS_ALLOWED: 1,
        NO_DEPOSIT: 0,
        FROM_OWNER: 1,
        STATUS: 'AVAILABLE',
        CREATED_AT: new Date('2026-10-28T09:15:00Z'),
      },
      {
        PROPERTY_ID: 5,
        LANDLORD_ID: 1,
        TYPE_ID: 1,
        ADDRESS_ID: 5,
        TITLE: '2-комнатная квартира возле ТД Даниэль',
        DESCRIPTION: 'Свежий евроремонт, кондиционер, вся бытовая техника, рядом центральный рынок и остановки.',
        ROOMS: 2,
        AREA: 56,
        MONTHLY_PRICE: 195000,
        PETS_ALLOWED: 0,
        NO_DEPOSIT: 1,
        FROM_OWNER: 1,
        STATUS: 'AVAILABLE',
        CREATED_AT: new Date('2026-10-29T09:00:00Z'),
      },
      {
        PROPERTY_ID: 6,
        LANDLORD_ID: 1,
        TYPE_ID: 1,
        ADDRESS_ID: 6,
        TITLE: 'Уютная 1-комнатная у парка Кирова',
        DESCRIPTION: 'Тихий исторический центр, окна во двор, в шаговой доступности парк им. Касыма Кайсенова.',
        ROOMS: 1,
        AREA: 38,
        MONTHLY_PRICE: 155000,
        PETS_ALLOWED: 1,
        NO_DEPOSIT: 1,
        FROM_OWNER: 1,
        STATUS: 'AVAILABLE',
        CREATED_AT: new Date('2026-10-29T14:00:00Z'),
      },
      {
        PROPERTY_ID: 7,
        LANDLORD_ID: 1,
        TYPE_ID: 3,
        ADDRESS_ID: 7,
        TITLE: 'Панорамные 3-комнатные апартаменты на Стрелке',
        DESCRIPTION: 'Вид на слияние Иртыша и Ульбы, просторная лоджия, гардеробная, парковочное место.',
        ROOMS: 3,
        AREA: 88,
        MONTHLY_PRICE: 290000,
        PETS_ALLOWED: 0,
        NO_DEPOSIT: 0,
        FROM_OWNER: 0,
        STATUS: 'AVAILABLE',
        CREATED_AT: new Date('2026-10-30T11:00:00Z'),
      },
      {
        PROPERTY_ID: 8,
        LANDLORD_ID: 1,
        TYPE_ID: 2,
        ADDRESS_ID: 8,
        TITLE: 'Светлая студия на Стрелке у набережной',
        DESCRIPTION: 'Компактная современная студия для одного или пары, высокоскоростной интернет, смарт-ТВ.',
        ROOMS: 1,
        AREA: 32,
        MONTHLY_PRICE: 150000,
        PETS_ALLOWED: 0,
        NO_DEPOSIT: 1,
        FROM_OWNER: 1,
        STATUS: 'AVAILABLE',
        CREATED_AT: new Date('2026-10-31T10:30:00Z'),
      },
      {
        PROPERTY_ID: 9,
        LANDLORD_ID: 1,
        TYPE_ID: 1,
        ADDRESS_ID: 9,
        TITLE: 'Семейная 3-комнатная квартира на пр. Сатпаева',
        DESCRIPTION: 'Рядом ТРЦ Maxi Mall, театр им. Жамбыла, закрытая детская площадка, два санузла.',
        ROOMS: 3,
        AREA: 82,
        MONTHLY_PRICE: 240000,
        PETS_ALLOWED: 1,
        NO_DEPOSIT: 0,
        FROM_OWNER: 1,
        STATUS: 'AVAILABLE',
        CREATED_AT: new Date('2026-11-01T13:00:00Z'),
      },
      {
        PROPERTY_ID: 10,
        LANDLORD_ID: 1,
        TYPE_ID: 1,
        ADDRESS_ID: 10,
        TITLE: '2-комнатная в новостройке на Есенберлина',
        DESCRIPTION: 'Первая сдача, автономное отопление, современная кухня со встроенной посудомоечной машиной.',
        ROOMS: 2,
        AREA: 62,
        MONTHLY_PRICE: 200000,
        PETS_ALLOWED: 0,
        NO_DEPOSIT: 0,
        FROM_OWNER: 0,
        STATUS: 'AVAILABLE',
        CREATED_AT: new Date('2026-11-02T15:00:00Z'),
      },
      {
        PROPERTY_ID: 11,
        LANDLORD_ID: 1,
        TYPE_ID: 1,
        ADDRESS_ID: 11,
        TITLE: 'Тёплая 2-комнатная возле ВКТУ им. Серикбаева',
        DESCRIPTION: 'Отличный вариант для преподавателей или студентов, рядом трамвайная линия и супермаркеты.',
        ROOMS: 2,
        AREA: 51,
        MONTHLY_PRICE: 170000,
        PETS_ALLOWED: 0,
        NO_DEPOSIT: 1,
        FROM_OWNER: 1,
        STATUS: 'AVAILABLE',
        CREATED_AT: new Date('2026-11-03T10:00:00Z'),
      },
      {
        PROPERTY_ID: 12,
        LANDLORD_ID: 1,
        TYPE_ID: 2,
        ADDRESS_ID: 12,
        TITLE: 'Студия в районе центрального автовокзала',
        DESCRIPTION: 'Удобная транспортная развязка, свежий косметический ремонт, низкие коммунальные платежи.',
        ROOMS: 1,
        AREA: 30,
        MONTHLY_PRICE: 130000,
        PETS_ALLOWED: 1,
        NO_DEPOSIT: 1,
        FROM_OWNER: 1,
        STATUS: 'AVAILABLE',
        CREATED_AT: new Date('2026-11-03T16:00:00Z'),
      },
      {
        PROPERTY_ID: 13,
        LANDLORD_ID: 1,
        TYPE_ID: 1,
        ADDRESS_ID: 13,
        TITLE: '1-комнатная квартира в районе ж/д вокзала Защита',
        DESCRIPTION: 'Спокойный спальный район, полностью меблирована, застеклённый балкон.',
        ROOMS: 1,
        AREA: 36,
        MONTHLY_PRICE: 115000,
        PETS_ALLOWED: 1,
        NO_DEPOSIT: 1,
        FROM_OWNER: 1,
        STATUS: 'AVAILABLE',
        CREATED_AT: new Date('2026-11-04T09:00:00Z'),
      },
      {
        PROPERTY_ID: 14,
        LANDLORD_ID: 1,
        TYPE_ID: 4,
        ADDRESS_ID: 14,
        TITLE: 'Светлый 2-комнатный лофт в Новой Согре',
        DESCRIPTION: 'Зелёный экологичный район рядом с дендропарком, индивидуальная планировка, высокие потолки.',
        ROOMS: 2,
        AREA: 66,
        MONTHLY_PRICE: 160000,
        PETS_ALLOWED: 1,
        NO_DEPOSIT: 0,
        FROM_OWNER: 1,
        STATUS: 'AVAILABLE',
        CREATED_AT: new Date('2026-11-04T12:00:00Z'),
      },
    ],
    favorites: [] as FavoriteRecord[],
    applications: [] as any[],
    contracts: [] as any[],
    payments: [] as any[],
  };

  constructor() {
    this.loadOrMigrateSnapshot();
  }

  private defaultAmenitiesForPropertyId(id: number): { PETS_ALLOWED: number; NO_DEPOSIT: number; FROM_OWNER: number } {
    const petsSet = new Set([1, 4, 6, 9, 12, 13, 14]);
    const noDepositSet = new Set([3, 5, 6, 8, 11, 12, 13]);
    const notOwnerSet = new Set([2, 7, 10]);
    return {
      PETS_ALLOWED: petsSet.has(id) ? 1 : 0,
      NO_DEPOSIT: noDepositSet.has(id) ? 1 : 0,
      FROM_OWNER: notOwnerSet.has(id) ? 0 : 1,
    };
  }

  private loadOrMigrateSnapshot(): void {
    try {
      if (fs.existsSync(SNAPSHOT_FILE)) {
        const parsed = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf-8'));

        if (parsed.state?.landlords && parsed.state?.tenants) {
          this.seq = parsed.seq;
          this.state = {
            ...this.state,
            ...parsed.state,
            favorites: Array.isArray(parsed.state.favorites) ? parsed.state.favorites : [],
            properties: (parsed.state.properties ?? []).map((p: any) => {
              const propId = Number(p.PROPERTY_ID);
              const def = this.defaultAmenitiesForPropertyId(propId);
              return {
                ...p,
                PETS_ALLOWED: p.PETS_ALLOWED !== undefined ? Number(p.PETS_ALLOWED) : def.PETS_ALLOWED,
                NO_DEPOSIT: p.NO_DEPOSIT !== undefined ? Number(p.NO_DEPOSIT) : def.NO_DEPOSIT,
                FROM_OWNER: p.FROM_OWNER !== undefined ? Number(p.FROM_OWNER) : def.FROM_OWNER,
                IMAGE_URL: sanitizePropertyImageUrl(p.IMAGE_URL, propId),
              };
            }),
          };
          this.ensureExtendedSeedData();
          this.persistSnapshot();
          return;
        }
      }
      this.ensureExtendedSeedData();
      this.persistSnapshot();
    } catch {
      // ignore fs errors
    }
  }

  /**
   * Гарантирует наличие 3 дополнительных арендодателей и 30 тестовых квартир
   * (по 10 объектов на каждого из 3 новых арендодателей).
   */
  private ensureExtendedSeedData(): void {
    const newLandlords = [
      {
        FULL_NAME: 'Алихан Серикович Нурпеисов',
        EMAIL: 'alikhan@example.com',
        PHONE: '+77015551001',
        PASSWORD_HASH: '$2b$10$KMDdA4RdMv9GR27FDwpfTOV8x0As3HgvXBonhenga.6evcSIGp716',
      },
      {
        FULL_NAME: 'Дана Маратовна Ахметова',
        EMAIL: 'dana@example.com',
        PHONE: '+77025552002',
        PASSWORD_HASH: '$2b$10$DVgvD/c0pGTiUX9J6wrU2eGASGA4JGIQv1GvZHMFKMRoLE/ZFRJhq',
      },
      {
        FULL_NAME: 'Тимур Ерланович Касымов',
        EMAIL: 'timur@example.com',
        PHONE: '+77055553003',
        PASSWORD_HASH: '$2b$10$WGj9J1Pw4VX7g72DWQdKpOD.DPjPgKpSLWNFVdNL.OAM7DN8HHfUe',
      },
    ];

    const landlordIdByEmail = new Map<string, number>();
    for (const nl of newLandlords) {
      let existing = this.state.landlords.find((l) => l.EMAIL.toUpperCase() === nl.EMAIL.toUpperCase());
      if (!existing) {
        const nextId = Math.max(this.seq.landlord, ...this.state.landlords.map((l) => l.ID), 0) + 1;
        this.seq.landlord = nextId;
        existing = { ID: nextId, ...nl };
        this.state.landlords.push(existing);
      }
      landlordIdByEmail.set(nl.EMAIL, existing.ID);
    }

    const l1 = landlordIdByEmail.get('alikhan@example.com')!;
    const l2 = landlordIdByEmail.get('dana@example.com')!;
    const l3 = landlordIdByEmail.get('timur@example.com')!;

    const seedApartments = [
      // === Арендодатель 1: Алихан Нурпеисов (10 квартир) ===
      { landlordId: l1, typeId: 1, city: 'Усть-Каменогорск', district: 'Ульбинский', street: 'пр-т Назарбаева', building: '77', apartment: '24', lat: 49.9612, lng: 82.6105, title: 'Светлая 2-комнатная у Дворца спорта', description: 'Уютная квартира с видом на проспект, рядом Дворец спорта им. Б. Александрова, кондиционер и гардеробная.', rooms: 2, area: 58, monthlyPrice: 185000, petsAllowed: 1, noDeposit: 0, fromOwner: 1 },
      { landlordId: l1, typeId: 3, city: 'Усть-Каменогорск', district: 'Ульбинский', street: 'ул. Протозанова', building: '31', apartment: '12', lat: 49.9508, lng: 82.6178, title: 'Видовые 3-комнатные апартаменты на набережной Ульбы', description: 'Дизайнерский ремонт, панорамное остекление, закрытый двор со шлагбаумом, два санузла.', rooms: 3, area: 94, monthlyPrice: 285000, petsAllowed: 0, noDeposit: 0, fromOwner: 1 },
      { landlordId: l1, typeId: 2, city: 'Усть-Каменогорск', district: 'Октябрьский', street: 'ул. Максима Горького', building: '52', apartment: '8', lat: 49.9476, lng: 82.6234, title: 'Современная студия в деловом центре', description: 'Компактная студия в шаговой доступности от ЦУМа и парковой зоны, без залога.', rooms: 1, area: 33, monthlyPrice: 145000, petsAllowed: 0, noDeposit: 1, fromOwner: 1 },
      { landlordId: l1, typeId: 1, city: 'Усть-Каменогорск', district: 'КШТ', street: 'пр-т Аль-Фараби', building: '28', apartment: '65', lat: 49.9182, lng: 82.6675, title: 'Просторная 2-комнатная в новом ЖК на Аль-Фараби', description: 'Дом 2025 года постройки, просторная кухня-гостиная, теплые полы, детская площадка.', rooms: 2, area: 65, monthlyPrice: 190000, petsAllowed: 1, noDeposit: 1, fromOwner: 1 },
      { landlordId: l1, typeId: 1, city: 'Усть-Каменогорск', district: 'Стрелка', street: 'наб. Славского', building: '64', apartment: '41', lat: 49.9578, lng: 82.5932, title: 'Евродвушка на Стрелке с видом на Иртыш', description: 'Полностью укомплектована мебелью и техникой Bosch, прямой выход к прогулочной набережной.', rooms: 2, area: 54, monthlyPrice: 215000, petsAllowed: 1, noDeposit: 0, fromOwner: 1 },
      { landlordId: l1, typeId: 2, city: 'Усть-Каменогорск', district: 'Ульбинский', street: 'ул. Серикбаева', building: '19', apartment: '33', lat: 49.9695, lng: 82.6152, title: 'Уютная 1-комнатная студия у кампуса ВКТУ', description: 'Идеально для студентов и молодых специалистов, скоростной оптоволоконный интернет, рабочая зона.', rooms: 1, area: 31, monthlyPrice: 125000, petsAllowed: 0, noDeposit: 1, fromOwner: 1 },
      { landlordId: l1, typeId: 1, city: 'Усть-Каменогорск', district: 'Октябрьский', street: 'ул. Ауэзова', building: '86', apartment: '19', lat: 49.9539, lng: 82.6295, title: 'Семейная 3-комнатная на проспекте Ауэзова', description: 'Окна на две стороны, застекленная лоджия, рядом гимназия и супермаркет.', rooms: 3, area: 78, monthlyPrice: 235000, petsAllowed: 1, noDeposit: 0, fromOwner: 1 },
      { landlordId: l1, typeId: 1, city: 'Усть-Каменогорск', district: 'КШТ', street: 'ул. Утепова', building: '15', apartment: '88', lat: 49.9291, lng: 82.6438, title: '1-комнатная квартира на Утепова возле парка', description: 'Чистая и теплая квартира, вся необходимая бытовая техника, тихие соседи.', rooms: 1, area: 40, monthlyPrice: 138000, petsAllowed: 1, noDeposit: 1, fromOwner: 1 },
      { landlordId: l1, typeId: 1, city: 'Риддер', district: 'Центральный', street: 'ул. Гоголя', building: '41', apartment: '14', lat: 50.3468, lng: 83.5162, title: 'Тёплая 2-комнатная в центре Риддера', description: 'Кирпичный дом, индивидуальные счетчики тепла, свежий ремонт в светлых тонах.', rooms: 2, area: 52, monthlyPrice: 135000, petsAllowed: 1, noDeposit: 1, fromOwner: 1 },
      { landlordId: l1, typeId: 4, city: 'Усть-Каменогорск', district: 'Стрелка', street: 'ул. Кайсенова', building: '110', apartment: '52', lat: 49.9519, lng: 82.6054, title: 'Стильный двухуровневый лофт на Кайсенова', description: 'Потолки 3.6 м, кирпичная кладка, авторское освещение и просторная рабочая студия.', rooms: 2, area: 74, monthlyPrice: 260000, petsAllowed: 0, noDeposit: 0, fromOwner: 1 },

      // === Арендодатель 2: Дана Ахметова (10 квартир) ===
      { landlordId: l2, typeId: 3, city: 'Усть-Каменогорск', district: 'КШТ', street: 'пр-т Сатпаева', building: '62', apartment: '104', lat: 49.9208, lng: 82.6589, title: 'Премиум-апартаменты у ТРЦ Maxi Mall', description: 'Панорамный 12-й этаж, система умный дом, подземный паркинг и консьерж-сервис.', rooms: 3, area: 98, monthlyPrice: 310000, petsAllowed: 0, noDeposit: 0, fromOwner: 1 },
      { landlordId: l2, typeId: 1, city: 'Усть-Каменогорск', district: 'Ульбинский', street: 'ул. Ворошилова', building: '99', apartment: '16', lat: 49.9682, lng: 82.6311, title: 'Уютная 1-комнатная квартира на Ворошилова', description: 'После капитального ремонта, новая сантехника и кухонный гарнитур, без залога.', rooms: 1, area: 36, monthlyPrice: 132000, petsAllowed: 1, noDeposit: 1, fromOwner: 1 },
      { landlordId: l2, typeId: 1, city: 'Усть-Каменогорск', district: 'Октябрьский', street: 'ул. Бурова', building: '25', apartment: '47', lat: 49.9564, lng: 82.6348, title: '2-комнатная квартира в районе площади Ушанова', description: 'Отличная транспортная доступность во все концы города, раздельные комнаты.', rooms: 2, area: 55, monthlyPrice: 175000, petsAllowed: 1, noDeposit: 0, fromOwner: 1 },
      { landlordId: l2, typeId: 1, city: 'Усть-Каменогорск', district: 'Защита', street: 'ул. Деповская', building: '14', apartment: '6', lat: 49.9934, lng: 82.5842, title: 'Доступная 2-комнатная в районе Защита', description: 'Тихий зеленый двор, рядом школа и поликлиника, можно с домашними питомцами.', rooms: 2, area: 49, monthlyPrice: 120000, petsAllowed: 1, noDeposit: 1, fromOwner: 1 },
      { landlordId: l2, typeId: 2, city: 'Усть-Каменогорск', district: 'Согра', street: 'ул. Егорова', building: '9', apartment: '21', lat: 49.9841, lng: 82.6985, title: 'Светлая студия в экологичном районе Согра', description: 'Чистый воздух, рядом березовая роща, автономный бойлер и современная мебель.', rooms: 1, area: 29, monthlyPrice: 110000, petsAllowed: 1, noDeposit: 1, fromOwner: 1 },
      { landlordId: l2, typeId: 1, city: 'Усть-Каменогорск', district: 'Аблакетка', street: 'ул. Островского', building: '18', apartment: '11', lat: 49.9145, lng: 82.5920, title: 'Видовая 2-комнатная на Аблакетке у Иртыша', description: 'Прекрасный вид на реку и горы, спокойный район, полностью меблирована.', rooms: 2, area: 53, monthlyPrice: 140000, petsAllowed: 1, noDeposit: 0, fromOwner: 1 },
      { landlordId: l2, typeId: 1, city: 'Усть-Каменогорск', district: 'Ульбинский', street: 'бул. Гагарина', building: '22', apartment: '39', lat: 49.9635, lng: 82.6254, title: 'Просторная 3-комнатная на бульваре Гагарина', description: 'Зеленая прогулочная аллея прямо под окнами, паркет, кондиционеры в каждой комнате.', rooms: 3, area: 76, monthlyPrice: 220000, petsAllowed: 0, noDeposit: 0, fromOwner: 1 },
      { landlordId: l2, typeId: 2, city: 'Усть-Каменогорск', district: 'КШТ', street: 'ул. Кокжал Барака', building: '12', apartment: '73', lat: 49.9168, lng: 82.6594, title: 'Новая студия в ЖК на Кокжал Барака', description: 'Никто не жил, свежий ремонт в скандинавском стиле, гардеробная ниша.', rooms: 1, area: 35, monthlyPrice: 148000, petsAllowed: 0, noDeposit: 1, fromOwner: 0 },
      { landlordId: l2, typeId: 3, city: 'Риддер', district: 'Центральный', street: 'пр-т Гагарина', building: '14', apartment: '29', lat: 50.3422, lng: 83.5084, title: '3-комнатные апартаменты в Риддере для большой семьи', description: 'Просторная гостиная, панорамный вид на горные вершины, закрытая парковка.', rooms: 3, area: 86, monthlyPrice: 185000, petsAllowed: 1, noDeposit: 0, fromOwner: 1 },
      { landlordId: l2, typeId: 1, city: 'Усть-Каменогорск', district: 'Стрелка', street: 'ул. Крылова', building: '70', apartment: '15', lat: 49.9528, lng: 82.6089, title: 'Светлая 1-комнатная на Крылова возле набережной', description: 'Уютная квартира в престижном районе, 3 минуты пешком до набережной Славского.', rooms: 1, area: 41, monthlyPrice: 165000, petsAllowed: 0, noDeposit: 1, fromOwner: 1 },

      // === Арендодатель 3: Тимур Касымов (10 квартир) ===
      { landlordId: l3, typeId: 1, city: 'Усть-Каменогорск', district: 'Ульбинский', street: 'ул. Космическая', building: '11', apartment: '30', lat: 49.9658, lng: 82.6134, title: '2-комнатная квартира на Космической', description: 'Тихий ухоженный двор, свежий косметический ремонт, низкие коммунальные платежи.', rooms: 2, area: 50, monthlyPrice: 160000, petsAllowed: 1, noDeposit: 1, fromOwner: 1 },
      { landlordId: l3, typeId: 4, city: 'Усть-Каменогорск', district: 'Октябрьский', street: 'ул. Тохтарова', building: '48', apartment: '17', lat: 49.9495, lng: 82.6192, title: 'Дизайнерский лофт в историческом квартале на Тохтарова', description: 'Уникальный интерьер, высокие окна, барная стойка, акустическая подготовка.', rooms: 2, area: 68, monthlyPrice: 255000, petsAllowed: 0, noDeposit: 0, fromOwner: 1 },
      { landlordId: l3, typeId: 1, city: 'Усть-Каменогорск', district: 'КШТ', street: 'ул. Жибек Жолы', building: '7', apartment: '92', lat: 49.9245, lng: 82.6512, title: 'Семейная 2-комнатная на Жибек Жолы', description: 'Рядом детский сад, школа НИШ и легкоатлетический манеж, просторная лоджия.', rooms: 2, area: 60, monthlyPrice: 182000, petsAllowed: 1, noDeposit: 0, fromOwner: 1 },
      { landlordId: l3, typeId: 2, city: 'Усть-Каменогорск', district: 'Октябрьский', street: 'ул. Потанина', building: '29', apartment: '44', lat: 49.9618, lng: 82.6288, title: 'Компактная студия на Потанина без депозита', description: 'Отличный бюджетный вариант для одного человека, вся мебель и стиральная машина.', rooms: 1, area: 28, monthlyPrice: 122000, petsAllowed: 0, noDeposit: 1, fromOwner: 1 },
      { landlordId: l3, typeId: 3, city: 'Усть-Каменогорск', district: 'Стрелка', street: 'наб. Славского', building: '40', apartment: '78', lat: 49.9541, lng: 82.6035, title: '4-комнатные резиденции на Стрелке с террасой', description: 'Эксклюзивные апартаменты с панорамой на Иртыш, три спальни, два санузла, гардеробная.', rooms: 4, area: 125, monthlyPrice: 360000, petsAllowed: 1, noDeposit: 0, fromOwner: 0 },
      { landlordId: l3, typeId: 1, city: 'Усть-Каменогорск', district: 'Ульбинский', street: 'ул. Карбышева', building: '54', apartment: '10', lat: 49.9721, lng: 82.6085, title: 'Уютная 1-комнатная на Карбышева', description: 'Свежий ремонт, пластиковые окна, тихий озелененный двор, можно с кошкой или небольшой собакой.', rooms: 1, area: 37, monthlyPrice: 134000, petsAllowed: 1, noDeposit: 1, fromOwner: 1 },
      { landlordId: l3, typeId: 1, city: 'Усть-Каменогорск', district: 'Аблакетка', street: 'ул. Челюскина', building: '8', apartment: '5', lat: 49.9172, lng: 82.5885, title: 'Недорогая 1-комнатная квартира на Аблакетке', description: 'Чистая и аккуратная квартира от собственника без посредников и без залога.', rooms: 1, area: 34, monthlyPrice: 105000, petsAllowed: 1, noDeposit: 1, fromOwner: 1 },
      { landlordId: l3, typeId: 3, city: 'Усть-Каменогорск', district: 'КШТ', street: 'пр-т Казыбек би', building: '25', apartment: '118', lat: 49.9282, lng: 82.6501, title: 'Современные 2-комнатные апартаменты на Казыбек би', description: 'Панорамная лоджия, встроенная техника Samsung, закрытая территория с парковкой.', rooms: 2, area: 67, monthlyPrice: 210000, petsAllowed: 0, noDeposit: 0, fromOwner: 1 },
      { landlordId: l3, typeId: 2, city: 'Риддер', district: 'Центральный', street: 'ул. Ауэзова', building: '12', apartment: '20', lat: 50.3455, lng: 83.5145, title: 'Светлая студия в центре Риддера посуточно/помесячно', description: 'Долгосрочная аренда от собственника, быстрый Wi-Fi, рядом городской парк и кафе.', rooms: 1, area: 32, monthlyPrice: 118000, petsAllowed: 0, noDeposit: 1, fromOwner: 1 },
      { landlordId: l3, typeId: 1, city: 'Усть-Каменогорск', district: 'Октябрьский', street: 'ул. Белинского', building: '38', apartment: '14', lat: 49.9585, lng: 82.6262, title: 'Просторная 3-комнатная квартира на Белинского', description: 'Тихий центр, кирпичный теплый дом, три изолированные спальни, отлично подойдет семье.', rooms: 3, area: 80, monthlyPrice: 225000, petsAllowed: 1, noDeposit: 0, fromOwner: 1 },
    ];

    const baseTime = new Date('2026-11-05T08:00:00Z').getTime();
    seedApartments.forEach((apt, idx) => {
      const exists = this.state.properties.some((p) => p.TITLE === apt.title);
      if (!exists) {
        const nextAddrId = Math.max(this.seq.address, ...this.state.addresses.map((a) => a.ADDRESS_ID), 0) + 1;
        this.seq.address = nextAddrId;
        this.state.addresses.push({
          ADDRESS_ID: nextAddrId,
          CITY: apt.city,
          DISTRICT: apt.district,
          STREET: apt.street,
          BUILDING: apt.building,
          APARTMENT: apt.apartment,
          LAT: apt.lat,
          LNG: apt.lng,
        });

        const nextPropId = Math.max(this.seq.property, ...this.state.properties.map((p) => p.PROPERTY_ID), 0) + 1;
        this.seq.property = nextPropId;
        this.state.properties.push({
          PROPERTY_ID: nextPropId,
          LANDLORD_ID: apt.landlordId,
          TYPE_ID: apt.typeId,
          ADDRESS_ID: nextAddrId,
          TITLE: apt.title,
          DESCRIPTION: apt.description,
          ROOMS: apt.rooms,
          AREA: apt.area,
          MONTHLY_PRICE: apt.monthlyPrice,
          PETS_ALLOWED: apt.petsAllowed,
          NO_DEPOSIT: apt.noDeposit,
          FROM_OWNER: apt.fromOwner,
          IMAGE_URL: defaultImageUrlForPropertyId(nextPropId),
          LATITUDE: apt.lat,
          LONGITUDE: apt.lng,
          STATUS: 'AVAILABLE',
          CREATED_AT: new Date(baseTime + idx * 1800 * 1000),
        } as any);
      }
    });

    // Гарантируем, что у всех объектов в памяти заполнены валидный IMAGE_URL и координаты LATITUDE/LONGITUDE
    const rentedPropertyIds = new Set<number>([
      ...this.state.contracts
        .filter((c: any) => c.STATUS === 'ACTIVE')
        .map((c: any) => Number(c.PROPERTY_ID)),
      ...this.state.applications
        .filter((a: any) => a.STATUS === 'APPROVED')
        .map((a: any) => Number(a.PROPERTY_ID)),
    ]);

    for (const p of this.state.properties as any[]) {
      const propId = Number(p.PROPERTY_ID);
      if (rentedPropertyIds.has(propId)) {
        p.STATUS = 'RENTED';
      }
      p.IMAGE_URL = sanitizePropertyImageUrl(p.IMAGE_URL, propId);
      const addr = this.state.addresses.find((a) => a.ADDRESS_ID === p.ADDRESS_ID);
      if (p.LATITUDE === undefined || p.LATITUDE === null) {
        p.LATITUDE = Number(addr?.LAT ?? 49.953);
      }
      if (p.LONGITUDE === undefined || p.LONGITUDE === null) {
        p.LONGITUDE = Number(addr?.LNG ?? 82.618);
      }
    }
    this.persistSnapshot();
  }

  private persistSnapshot(): void {
    try {
      fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify({ seq: this.seq, state: this.state }, null, 2), 'utf-8');
    } catch {
      // ignore fs errors
    }
  }

  /** Считает среднюю стоимость аренды по каждому району среди всех объектов. */
  private computeDistrictAvgPriceMap(): Map<string, number> {
    const sums = new Map<string, { total: number; count: number }>();
    for (const p of this.state.properties) {
      const addr = this.state.addresses.find((a) => a.ADDRESS_ID === p.ADDRESS_ID);
      if (!addr) continue;
      const key = addr.DISTRICT.toUpperCase();
      const cur = sums.get(key) ?? { total: 0, count: 0 };
      cur.total += Number(p.MONTHLY_PRICE);
      cur.count += 1;
      sums.set(key, cur);
    }
    const avgMap = new Map<string, number>();
    for (const [key, val] of sums.entries()) {
      avgMap.set(key, val.count > 0 ? val.total / val.count : 0);
    }
    return avgMap;
  }

  /** Проверяет наличие активного договора на объект. */
  private hasActiveContract(propertyId: number): boolean {
    return this.state.contracts.some(
      (c) => Number(c.PROPERTY_ID) === Number(propertyId) && c.STATUS === 'ACTIVE',
    );
  }

  async transaction<T>(work: () => Promise<T>): Promise<T> {
    const snapshot = JSON.stringify({ seq: this.seq, state: this.state });
    try {
      const res = await work();
      this.persistSnapshot();
      return res;
    } catch (err) {
      const restored = JSON.parse(snapshot);
      this.seq = restored.seq;
      this.state = restored.state;
      this.persistSnapshot();
      throw err;
    }
  }

  async query<T>(sql: string, binds: Record<string, any> = {}): Promise<T[]> {
    const norm = sql.replace(/\s+/g, ' ').trim().toUpperCase();

    if (norm === 'SELECT * FROM LANDLORDS ORDER BY ID') {
      return [...this.state.landlords] as unknown as T[];
    }
    if (norm === 'SELECT * FROM TENANTS ORDER BY ID') {
      return [...this.state.tenants] as unknown as T[];
    }
    if (norm === 'SELECT * FROM PROPERTIES ORDER BY PROPERTY_ID') {
      return [...this.state.properties] as unknown as T[];
    }
    if (norm === 'SELECT * FROM ADDRESSES ORDER BY ADDRESS_ID') {
      return [...this.state.addresses] as unknown as T[];
    }
    if (norm === 'SELECT * FROM CONTRACTS ORDER BY CONTRACT_ID') {
      return [...this.state.contracts] as unknown as T[];
    }
    if (norm === 'SELECT * FROM PAYMENTS ORDER BY PAYMENT_ID') {
      return [...this.state.payments] as unknown as T[];
    }
    if (norm.includes('FROM PROPERTIES') && !norm.includes('JOIN') && binds.id !== undefined) {
      return this.state.properties.filter((p) => Number(p.PROPERTY_ID) === Number(binds.id)) as unknown as T[];
    }
    if (norm === 'SELECT * FROM RENTAL_APPLICATIONS ORDER BY APPLICATION_ID') {
      return [...this.state.applications] as unknown as T[];
    }
    if (norm === 'SELECT * FROM FAVORITES ORDER BY CREATED_AT DESC') {
      return [...this.state.favorites] as unknown as T[];
    }

    if (norm.includes('FROM PROPERTY_TYPES')) {
      return [...this.state.propertyTypes].sort((a, b) => a.TYPE_NAME.localeCompare(b.TYPE_NAME)) as unknown as T[];
    }

    if (norm.includes('SELECT DISTINCT A.DISTRICT')) {
      const districts = new Set<string>();
      for (const p of this.state.properties) {
        if (p.STATUS === 'AVAILABLE' && !this.hasActiveContract(p.PROPERTY_ID)) {
          const addr = this.state.addresses.find((a) => a.ADDRESS_ID === p.ADDRESS_ID);
          if (addr) districts.add(addr.DISTRICT);
        }
      }
      return Array.from(districts)
        .sort()
        .map((d) => ({ DISTRICT: d })) as unknown as T[];
    }

    if (norm.includes('FROM LANDLORDS')) {
      let rows = [...this.state.landlords];
      if (binds.email !== undefined) {
        rows = rows.filter((u) => u.EMAIL.toUpperCase() === String(binds.email).toUpperCase());
      }
      if (binds.id !== undefined) {
        rows = rows.filter((u) => u.ID === Number(binds.id));
      }
      return rows as unknown as T[];
    }

    if (norm.includes('FROM TENANTS')) {
      let rows = [...this.state.tenants];
      if (binds.email !== undefined) {
        rows = rows.filter((u) => u.EMAIL.toUpperCase() === String(binds.email).toUpperCase());
      }
      if (binds.id !== undefined) {
        rows = rows.filter((u) => u.ID === Number(binds.id));
      }
      return rows as unknown as T[];
    }

    if (norm.includes('FROM FAVORITES F')) {
      const userId = Number(binds.userId);
      const favs = this.state.favorites.filter((f) => Number(f.USER_ID) === userId);
      if (binds.propertyId !== undefined) {
        return favs.filter((f) => Number(f.PROPERTY_ID) === Number(binds.propertyId)) as unknown as T[];
      }

      if (norm.includes('JOIN PROPERTIES P')) {
        const avgMap = this.computeDistrictAvgPriceMap();
        const items = favs
          .map((f) => {
            const p = this.state.properties.find((x) => x.PROPERTY_ID === Number(f.PROPERTY_ID));
            if (!p) return null;
            const t = this.state.propertyTypes.find((x) => x.TYPE_ID === p.TYPE_ID)!;
            const a = this.state.addresses.find((x) => x.ADDRESS_ID === p.ADDRESS_ID)!;
            const districtAvg = avgMap.get(a.DISTRICT.toUpperCase()) ?? Number(p.MONTHLY_PRICE);
            return {
              ...p,
              ...t,
              ...a,
              DISTRICT_AVG_PRICE: districtAvg,
              FAVORITED_AT: f.CREATED_AT,
            };
          })
          .filter(Boolean);
        return items as unknown as T[];
      }

      return favs as unknown as T[];
    }

    if (norm.includes('FROM PROPERTIES P')) {
      const avgMap = this.computeDistrictAvgPriceMap();
      let joined = this.state.properties.map((p) => {
        const t = this.state.propertyTypes.find((x) => x.TYPE_ID === p.TYPE_ID)!;
        const a = this.state.addresses.find((x) => x.ADDRESS_ID === p.ADDRESS_ID)!;
        const districtAvg = avgMap.get(a.DISTRICT.toUpperCase()) ?? Number(p.MONTHLY_PRICE);
        return { ...p, ...t, ...a, DISTRICT_AVG_PRICE: districtAvg };
      });

      if (norm.includes('WHERE P.PROPERTY_ID = :ID')) {
        joined = joined.filter((r) => r.PROPERTY_ID === Number(binds.id));
        return joined as unknown as T[];
      }

      if (norm.includes('WHERE P.LANDLORD_ID = :LANDLORDID')) {
        joined = joined
          .filter((r) => r.LANDLORD_ID === Number(binds.landlordId))
          .sort((a, b) => new Date(b.CREATED_AT).getTime() - new Date(a.CREATED_AT).getTime());
        return joined as unknown as T[];
      }

      // Публичный каталог: строго только AVAILABLE и без активных договоров (NOT EXISTS active contract)
      joined = joined.filter((r) => r.STATUS === 'AVAILABLE' && !this.hasActiveContract(r.PROPERTY_ID));

      if (binds.district) {
        joined = joined.filter((r) => r.DISTRICT.toUpperCase() === String(binds.district).toUpperCase());
      }
      if (binds.minPrice !== undefined) {
        joined = joined.filter((r) => r.MONTHLY_PRICE >= Number(binds.minPrice));
      }
      if (binds.maxPrice !== undefined) {
        joined = joined.filter((r) => r.MONTHLY_PRICE <= Number(binds.maxPrice));
      }
      if (binds.typeId !== undefined) {
        joined = joined.filter((r) => r.TYPE_ID === Number(binds.typeId));
      }
      if (binds.petsAllowed !== undefined) {
        joined = joined.filter((r) => Number(r.PETS_ALLOWED) === Number(binds.petsAllowed));
      }
      if (binds.noDeposit !== undefined) {
        joined = joined.filter((r) => Number(r.NO_DEPOSIT) === Number(binds.noDeposit));
      }
      if (binds.fromOwner !== undefined) {
        joined = joined.filter((r) => Number(r.FROM_OWNER) === Number(binds.fromOwner));
      }

      if (binds.sortBy === 'price_asc') {
        joined.sort((a, b) => a.MONTHLY_PRICE - b.MONTHLY_PRICE);
      } else if (binds.sortBy === 'price_desc') {
        joined.sort((a, b) => b.MONTHLY_PRICE - a.MONTHLY_PRICE);
      } else if (binds.sortBy === 'area_desc') {
        joined.sort((a, b) => b.AREA - a.AREA);
      } else {
        joined.sort((a, b) => new Date(b.CREATED_AT).getTime() - new Date(a.CREATED_AT).getTime());
      }
      const total = joined.length;
      const offset = Number(binds.offset ?? 0);
      const limit = Number(binds.limit ?? 8);
      return joined.slice(offset, offset + limit).map((r) => ({ ...r, TOTAL_COUNT: total })) as unknown as T[];
    }

    if (norm.includes('COUNT(*) AS CNT FROM RENTAL_APPLICATIONS')) {
      const cnt = this.state.applications.filter(
        (a) =>
          a.PROPERTY_ID === Number(binds.propertyId) &&
          a.TENANT_ID === Number(binds.tenantId) &&
          a.STATUS === 'PENDING',
      ).length;
      return [{ CNT: cnt }] as unknown as T[];
    }

    if (norm.includes('FROM RENTAL_APPLICATIONS RA')) {
      let joined = this.state.applications.map((ra) => {
        const p = this.state.properties.find((x) => x.PROPERTY_ID === ra.PROPERTY_ID)!;
        const t = this.state.tenants.find((x) => x.ID === ra.TENANT_ID)!;
        return {
          ...ra,
          PROPERTY_TITLE: p?.TITLE ?? '',
          LANDLORD_ID: p?.LANDLORD_ID ?? 0,
          TENANT_NAME: t?.FULL_NAME ?? '',
        };
      });

      if (norm.includes('WHERE RA.APPLICATION_ID = :ID')) {
        return joined.filter((r) => r.APPLICATION_ID === Number(binds.id)) as unknown as T[];
      }
      if (norm.includes('WHERE P.LANDLORD_ID = :LANDLORDID')) {
        joined = joined.filter((r) => r.LANDLORD_ID === Number(binds.landlordId));
        if (binds.status) joined = joined.filter((r) => r.STATUS === binds.status);
        return joined.sort((a, b) => new Date(b.CREATED_AT).getTime() - new Date(a.CREATED_AT).getTime()) as unknown as T[];
      }
      if (norm.includes('WHERE RA.TENANT_ID = :TENANTID')) {
        return joined
          .filter((r) => r.TENANT_ID === Number(binds.tenantId))
          .sort((a, b) => new Date(b.CREATED_AT).getTime() - new Date(a.CREATED_AT).getTime()) as unknown as T[];
      }
    }

    if (norm.includes('FROM CONTRACTS C')) {
      let rows = this.state.contracts.map((c) => {
        const p = this.state.properties.find((x) => x.PROPERTY_ID === c.PROPERTY_ID);
        return { ...c, PROPERTY_TITLE: p?.TITLE ?? '' };
      });
      if (norm.includes('WHERE C.LANDLORD_ID = :LANDLORDID')) {
        rows = rows.filter((c) => c.LANDLORD_ID === Number(binds.landlordId));
      }
      if (norm.includes('WHERE C.TENANT_ID = :TENANTID')) {
        rows = rows.filter((c) => c.TENANT_ID === Number(binds.tenantId));
      }
      if (norm.includes('WHERE C.CONTRACT_ID = :ID')) {
        rows = rows.filter((c) => c.CONTRACT_ID === Number(binds.id));
      }
      return rows as unknown as T[];
    }

    if (norm.includes('FROM PAYMENTS')) {
      if (binds.id !== undefined) {
        return this.state.payments.filter((p) => p.PAYMENT_ID === Number(binds.id)) as unknown as T[];
      }
      return this.state.payments
        .filter((p) => p.CONTRACT_ID === Number(binds.contractId))
        .sort((a, b) => new Date(a.DUE_DATE).getTime() - new Date(b.DUE_DATE).getTime()) as unknown as T[];
    }

    return [];
  }

  async execute(sql: string, binds: Record<string, any> = {}): Promise<Result<unknown>> {
    const norm = sql.replace(/\s+/g, ' ').trim().toUpperCase();
    let result: Result<unknown> = { rowsAffected: 0 };

    if (norm.startsWith('INSERT INTO LANDLORDS')) {
      const id = ++this.seq.landlord;
      this.state.landlords.push({
        ID: id,
        FULL_NAME: binds.fullName,
        EMAIL: binds.email,
        PHONE: binds.phone ?? null,
        PASSWORD_HASH: binds.passwordHash,
      });
      result = { outBinds: { id: [id] }, rowsAffected: 1 };
    } else if (norm.startsWith('INSERT INTO TENANTS')) {
      const id = ++this.seq.tenant;
      this.state.tenants.push({
        ID: id,
        FULL_NAME: binds.fullName,
        EMAIL: binds.email,
        PHONE: binds.phone ?? null,
        PASSWORD_HASH: binds.passwordHash,
      });
      result = { outBinds: { id: [id] }, rowsAffected: 1 };
    } else if (norm.startsWith('INSERT INTO FAVORITES')) {
      const userId = Number(binds.userId);
      const propertyId = Number(binds.propertyId);
      const exists = this.state.favorites.some(
        (f) => Number(f.USER_ID) === userId && Number(f.PROPERTY_ID) === propertyId,
      );
      if (!exists) {
        this.state.favorites.push({
          USER_ID: userId,
          PROPERTY_ID: propertyId,
          CREATED_AT: new Date(),
        });
      }
      result = { rowsAffected: exists ? 0 : 1 };
    } else if (norm.startsWith('DELETE FROM FAVORITES')) {
      const before = this.state.favorites.length;
      if (binds.userId !== undefined) {
        const userId = Number(binds.userId);
        const propertyId = Number(binds.propertyId);
        this.state.favorites = this.state.favorites.filter(
          (f) => !(Number(f.USER_ID) === userId && Number(f.PROPERTY_ID) === propertyId),
        );
      } else {
        const propId = Number(binds.id ?? binds.propertyId);
        this.state.favorites = this.state.favorites.filter((f) => Number(f.PROPERTY_ID) !== propId);
      }
      result = { rowsAffected: before - this.state.favorites.length };
    } else if (norm.startsWith('DELETE FROM PAYMENTS')) {
      const propId = Number(binds.id ?? binds.propertyId);
      const contractIds = new Set(
        this.state.contracts.filter((c) => Number(c.PROPERTY_ID) === propId).map((c) => Number(c.CONTRACT_ID)),
      );
      const before = this.state.payments.length;
      this.state.payments = this.state.payments.filter((p) => !contractIds.has(Number(p.CONTRACT_ID)));
      result = { rowsAffected: before - this.state.payments.length };
    } else if (norm.startsWith('DELETE FROM CONTRACTS')) {
      const propId = Number(binds.id ?? binds.propertyId);
      const before = this.state.contracts.length;
      this.state.contracts = this.state.contracts.filter((c) => Number(c.PROPERTY_ID) !== propId);
      result = { rowsAffected: before - this.state.contracts.length };
    } else if (norm.startsWith('DELETE FROM RENTAL_APPLICATIONS')) {
      const propId = Number(binds.id ?? binds.propertyId);
      const before = this.state.applications.length;
      this.state.applications = this.state.applications.filter((a) => Number(a.PROPERTY_ID) !== propId);
      result = { rowsAffected: before - this.state.applications.length };
    } else if (norm.startsWith('DELETE FROM PROPERTIES')) {
      const propId = Number(binds.id ?? binds.propertyId);
      const ownerId = binds.ownerId !== undefined ? Number(binds.ownerId) : undefined;
      const before = this.state.properties.length;
      this.state.properties = this.state.properties.filter((p) => {
        if (Number(p.PROPERTY_ID) !== propId) return true;
        if (ownerId !== undefined && Number(p.LANDLORD_ID) !== ownerId) return true;
        return false;
      });
      result = { rowsAffected: before - this.state.properties.length };
    } else if (norm.startsWith('DELETE FROM ADDRESSES')) {
      const usedAddrIds = new Set(this.state.properties.map((p) => Number(p.ADDRESS_ID)));
      const before = this.state.addresses.length;
      this.state.addresses = this.state.addresses.filter((a) => usedAddrIds.has(Number(a.ADDRESS_ID)));
      result = { rowsAffected: before - this.state.addresses.length };
    } else if (norm.startsWith('INSERT INTO ADDRESSES')) {
      const id = ++this.seq.address;
      this.state.addresses.push({
        ADDRESS_ID: id,
        CITY: binds.city,
        DISTRICT: binds.district,
        STREET: binds.street,
        BUILDING: binds.building,
        APARTMENT: binds.apartment ?? null,
        LAT: Number(binds.lat ?? 49.953),
        LNG: Number(binds.lng ?? 82.618),
      });
      result = { outBinds: { id: [id] }, rowsAffected: 1 };
    } else if (norm.startsWith('INSERT INTO PROPERTIES')) {
      const id = ++this.seq.property;
      const addr = this.state.addresses.find((a) => a.ADDRESS_ID === Number(binds.addressId));
      const lat = Number(binds.latitude ?? binds.lat ?? addr?.LAT ?? 49.953);
      const lng = Number(binds.longitude ?? binds.lng ?? addr?.LNG ?? 82.618);
      this.state.properties.push({
        PROPERTY_ID: id,
        LANDLORD_ID: Number(binds.landlordId),
        TYPE_ID: Number(binds.typeId),
        ADDRESS_ID: Number(binds.addressId),
        TITLE: binds.title,
        DESCRIPTION: binds.description ?? null,
        ROOMS: Number(binds.rooms),
        AREA: Number(binds.area),
        MONTHLY_PRICE: Number(binds.monthlyPrice),
        PETS_ALLOWED: Number(binds.petsAllowed ?? 0),
        NO_DEPOSIT: Number(binds.noDeposit ?? 0),
        FROM_OWNER: Number(binds.fromOwner ?? 1),
        IMAGE_URL: binds.imageUrl ?? defaultImageUrlForPropertyId(id),
        LATITUDE: lat,
        LONGITUDE: lng,
        STATUS: 'AVAILABLE',
        CREATED_AT: new Date(),
      } as any);
      result = { outBinds: { id: [id] }, rowsAffected: 1 };
    } else if (norm.startsWith("UPDATE CONTRACTS SET STATUS = 'CLOSED'")) {
      let count = 0;
      for (const c of this.state.contracts) {
        if (Number(c.PROPERTY_ID) === Number(binds.propertyId) && c.STATUS === 'ACTIVE') {
          c.STATUS = 'CLOSED';
          count++;
        }
      }
      result = { rowsAffected: count };
    } else if (
      norm.startsWith('UPDATE PROPERTIES SET STATUS = :STATUS') ||
      norm.startsWith("UPDATE PROPERTIES SET STATUS = 'RENTED'")
    ) {
      const targetId = Number(binds.property_id ?? binds.propertyId ?? binds.id);
      const nextStatus = binds.status ?? 'RENTED';
      const prop = this.state.properties.find((p) => Number(p.PROPERTY_ID) === targetId);
      if (prop) prop.STATUS = nextStatus;
      result = { rowsAffected: prop ? 1 : 0 };
    } else if (norm.startsWith('UPDATE PROPERTIES SET IMAGE_URL = :IMAGEURL')) {
      const prop = this.state.properties.find((p) => p.PROPERTY_ID === Number(binds.id)) as any;
      if (prop) prop.IMAGE_URL = binds.imageUrl;
      result = { rowsAffected: prop ? 1 : 0 };
    } else if (norm.startsWith('UPDATE PROPERTIES SET')) {
      const prop = this.state.properties.find((p) => p.PROPERTY_ID === Number(binds.id)) as any;
      if (prop) {
        if (binds.title !== undefined) prop.TITLE = binds.title;
        if (binds.description !== undefined) prop.DESCRIPTION = binds.description;
        if (binds.typeId !== undefined) prop.TYPE_ID = Number(binds.typeId);
        if (binds.rooms !== undefined) prop.ROOMS = Number(binds.rooms);
        if (binds.area !== undefined) prop.AREA = Number(binds.area);
        if (binds.monthlyPrice !== undefined) prop.MONTHLY_PRICE = Number(binds.monthlyPrice);
        if (binds.petsAllowed !== undefined) prop.PETS_ALLOWED = Number(binds.petsAllowed);
        if (binds.noDeposit !== undefined) prop.NO_DEPOSIT = Number(binds.noDeposit);
        if (binds.fromOwner !== undefined) prop.FROM_OWNER = Number(binds.fromOwner);
        if (binds.imageUrl !== undefined) prop.IMAGE_URL = binds.imageUrl;
        if (binds.latitude !== undefined) prop.LATITUDE = Number(binds.latitude);
        if (binds.longitude !== undefined) prop.LONGITUDE = Number(binds.longitude);
      }
      result = { rowsAffected: prop ? 1 : 0 };
    } else if (norm.startsWith('UPDATE ADDRESSES SET')) {
      const prop = this.state.properties.find((p) => p.PROPERTY_ID === Number(binds.propertyId));
      const addr = prop
        ? this.state.addresses.find((a) => a.ADDRESS_ID === prop.ADDRESS_ID)
        : this.state.addresses.find((a) => a.ADDRESS_ID === Number(binds.addressId));
      if (addr) {
        if (binds.city !== undefined) addr.CITY = binds.city;
        if (binds.district !== undefined) addr.DISTRICT = binds.district;
        if (binds.street !== undefined) addr.STREET = binds.street;
        if (binds.building !== undefined) addr.BUILDING = binds.building;
        if (binds.apartment !== undefined) addr.APARTMENT = binds.apartment;
        if (binds.lat !== undefined) addr.LAT = Number(binds.lat);
        if (binds.lng !== undefined) addr.LNG = Number(binds.lng);
      }
      result = { rowsAffected: addr ? 1 : 0 };
    } else if (norm.startsWith('INSERT INTO RENTAL_APPLICATIONS')) {
      const id = ++this.seq.application;
      this.state.applications.push({
        APPLICATION_ID: id,
        PROPERTY_ID: Number(binds.propertyId),
        TENANT_ID: Number(binds.tenantId),
        DESIRED_START_DATE: new Date(binds.startDate),
        LEASE_MONTHS: Number(binds.leaseMonths),
        MESSAGE: binds.message ?? null,
        STATUS: 'PENDING',
        CREATED_AT: new Date(),
      });
      result = { outBinds: { id: [id] }, rowsAffected: 1 };
    } else if (norm.startsWith("UPDATE RENTAL_APPLICATIONS SET STATUS = 'REJECTED'")) {
      let count = 0;
      for (const a of this.state.applications) {
        if (
          a.PROPERTY_ID === Number(binds.propertyId) &&
          a.APPLICATION_ID !== Number(binds.exceptId) &&
          a.STATUS === 'PENDING'
        ) {
          a.STATUS = 'REJECTED';
          count++;
        }
      }
      result = { rowsAffected: count };
    } else if (norm.startsWith('UPDATE RENTAL_APPLICATIONS SET STATUS = :STATUS')) {
      const app = this.state.applications.find((a) => a.APPLICATION_ID === Number(binds.id));
      if (app) app.STATUS = binds.status;
      result = { rowsAffected: app ? 1 : 0 };
    } else if (norm.startsWith('INSERT INTO CONTRACTS')) {
      const id = ++this.seq.contract;
      this.state.contracts.push({
        CONTRACT_ID: id,
        APPLICATION_ID: Number(binds.applicationId),
        PROPERTY_ID: Number(binds.propertyId),
        TENANT_ID: Number(binds.tenantId),
        LANDLORD_ID: Number(binds.landlordId),
        START_DATE: new Date(binds.startDate),
        END_DATE: new Date(binds.endDate),
        MONTHLY_AMOUNT: Number(binds.monthlyAmount),
        STATUS: 'ACTIVE',
      });
      result = { outBinds: { id: [id] }, rowsAffected: 1 };
    } else if (norm.startsWith('UPDATE PAYMENTS')) {
      const pay = this.state.payments.find((p) => p.PAYMENT_ID === Number(binds.id));
      if (pay) {
        pay.STATUS = 'PAID';
        pay.PAID_AT = new Date();
      }
      result = { rowsAffected: pay ? 1 : 0 };
    }

    this.persistSnapshot();
    return result;
  }

  async executeMany(sql: string, binds: Record<string, any>[]): Promise<{ rowsAffected: number }> {
    const norm = sql.replace(/\s+/g, ' ').trim().toUpperCase();
    if (norm.startsWith('INSERT INTO PAYMENTS')) {
      for (const b of binds) {
        this.state.payments.push({
          PAYMENT_ID: ++this.seq.payment,
          CONTRACT_ID: Number(b.contractId),
          DUE_DATE: new Date(b.dueDate),
          AMOUNT: Number(b.amount),
          STATUS: 'PENDING',
          PAID_AT: null,
        });
      }
    }
    this.persistSnapshot();
    return { rowsAffected: binds.length };
  }
}
