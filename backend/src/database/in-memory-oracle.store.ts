import * as fs from 'fs';
import * as path from 'path';
import { Result } from 'oracledb';

const SNAPSHOT_FILE = path.resolve(__dirname, '..', '..', 'oracle-data-snapshot.json');

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

/**
 * Хранилище таблиц Oracle (LANDLORDS, TENANTS, PROPERTY_TYPES, ADDRESSES, PROPERTIES,
 * RENTAL_APPLICATIONS, CONTRACTS, PAYMENTS) с автоматической миграцией из старой
 * таблицы USERS и синхронизацией в oracle-data-snapshot.json.
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
        PASSWORD_HASH: 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791',
      },
      {
        ID: 2,
        FULL_NAME: 'Филипинов Филип Филипович',
        EMAIL: 'Philip@exaample.com',
        PHONE: '+77777777777',
        PASSWORD_HASH: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
      },
    ] as LandlordRecord[],
    tenants: [
      {
        ID: 1,
        FULL_NAME: 'Анна Смирнова (Арендатор)',
        EMAIL: 'tenant@example.com',
        PHONE: '+79004445566',
        PASSWORD_HASH: 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791',
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
        STATUS: 'AVAILABLE',
        CREATED_AT: new Date('2026-11-04T12:00:00Z'),
      },
    ],
    applications: [] as any[],
    contracts: [] as any[],
    payments: [] as any[],
  };

  constructor() {
    this.loadOrMigrateSnapshot();
  }

  private loadOrMigrateSnapshot(): void {
    try {
      if (fs.existsSync(SNAPSHOT_FILE)) {
        const parsed = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf-8'));

        // Если снимок уже в новой схеме с LANDLORDS и TENANTS
        if (parsed.state?.landlords && parsed.state?.tenants) {
          this.seq = parsed.seq;
          this.state = parsed.state;
          return;
        }

        // Автоматическая миграция со старой схемы (USERS -> LANDLORDS + TENANTS, OWNER_ID -> LANDLORD_ID)
        if (Array.isArray(parsed.state?.users)) {
          const oldUsers = parsed.state.users as any[];
          const landlordIdMap = new Map<number, number>();
          const tenantIdMap = new Map<number, number>();

          const landlords: LandlordRecord[] = [];
          const tenants: TenantRecord[] = [];

          for (const u of oldUsers) {
            if (u.ROLE === 'LANDLORD') {
              const newId = landlords.length + 1;
              landlordIdMap.set(Number(u.USER_ID), newId);
              landlords.push({
                ID: newId,
                FULL_NAME: u.FULL_NAME,
                EMAIL: u.EMAIL,
                PHONE: u.PHONE ?? null,
                PASSWORD_HASH: u.PASSWORD_HASH,
              });
            } else {
              const newId = tenants.length + 1;
              tenantIdMap.set(Number(u.USER_ID), newId);
              tenants.push({
                ID: newId,
                FULL_NAME: u.FULL_NAME,
                EMAIL: u.EMAIL,
                PHONE: u.PHONE ?? null,
                PASSWORD_HASH: u.PASSWORD_HASH,
              });
            }
          }

          this.state.landlords = landlords;
          this.state.tenants = tenants;
          this.state.propertyTypes = parsed.state.propertyTypes ?? this.state.propertyTypes;
          this.state.addresses = parsed.state.addresses ?? this.state.addresses;
          this.state.properties = (parsed.state.properties ?? []).map((p: any) => ({
            PROPERTY_ID: p.PROPERTY_ID,
            LANDLORD_ID: landlordIdMap.get(Number(p.OWNER_ID ?? p.LANDLORD_ID)) ?? Number(p.LANDLORD_ID ?? 1),
            TYPE_ID: p.TYPE_ID,
            ADDRESS_ID: p.ADDRESS_ID,
            TITLE: p.TITLE,
            DESCRIPTION: p.DESCRIPTION,
            ROOMS: p.ROOMS,
            AREA: p.AREA,
            MONTHLY_PRICE: p.MONTHLY_PRICE,
            STATUS: p.STATUS,
            CREATED_AT: p.CREATED_AT,
          }));
          this.state.applications = (parsed.state.applications ?? []).map((a: any) => ({
            ...a,
            TENANT_ID: tenantIdMap.get(Number(a.TENANT_ID)) ?? Number(a.TENANT_ID ?? 1),
          }));
          this.state.contracts = parsed.state.contracts ?? [];
          this.state.payments = parsed.state.payments ?? [];

          this.seq = {
            landlord: landlords.length,
            tenant: tenants.length,
            type: this.state.propertyTypes.length,
            address: this.state.addresses.length,
            property: this.state.properties.length,
            application: this.state.applications.length,
            contract: this.state.contracts.length,
            payment: this.state.payments.length,
          };
          this.persistSnapshot();
          return;
        }
      }
      this.persistSnapshot();
    } catch {
      // ignore fs errors
    }
  }

  private persistSnapshot(): void {
    try {
      fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify({ seq: this.seq, state: this.state }, null, 2), 'utf-8');
    } catch {
      // ignore fs errors
    }
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
    if (norm === 'SELECT * FROM RENTAL_APPLICATIONS ORDER BY APPLICATION_ID') {
      return [...this.state.applications] as unknown as T[];
    }

    if (norm.includes('FROM PROPERTY_TYPES')) {
      return [...this.state.propertyTypes].sort((a, b) => a.TYPE_NAME.localeCompare(b.TYPE_NAME)) as unknown as T[];
    }

    if (norm.includes('SELECT DISTINCT A.DISTRICT')) {
      const districts = new Set<string>();
      for (const p of this.state.properties) {
        if (p.STATUS === 'AVAILABLE') {
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

    if (norm.includes('FROM PROPERTIES P')) {
      let joined = this.state.properties.map((p) => {
        const t = this.state.propertyTypes.find((x) => x.TYPE_ID === p.TYPE_ID)!;
        const a = this.state.addresses.find((x) => x.ADDRESS_ID === p.ADDRESS_ID)!;
        return { ...p, ...t, ...a };
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

      joined = joined.filter((r) => r.STATUS === 'AVAILABLE');
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
      if (binds.landlordId !== undefined) {
        rows = rows.filter((c) => c.LANDLORD_ID === Number(binds.landlordId));
      }
      if (binds.tenantId !== undefined) {
        rows = rows.filter((c) => c.TENANT_ID === Number(binds.tenantId));
      }
      if (binds.id !== undefined) {
        rows = rows.filter((c) => c.CONTRACT_ID === Number(binds.id));
      }
      return rows as unknown as T[];
    }

    if (norm.includes('FROM PAYMENTS')) {
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
        STATUS: 'AVAILABLE',
        CREATED_AT: new Date(),
      });
      result = { outBinds: { id: [id] }, rowsAffected: 1 };
    } else if (norm.startsWith('UPDATE PROPERTIES SET STATUS = :STATUS')) {
      const prop = this.state.properties.find((p) => p.PROPERTY_ID === Number(binds.id));
      if (prop) prop.STATUS = binds.status;
      result = { rowsAffected: prop ? 1 : 0 };
    } else if (norm.startsWith('UPDATE PROPERTIES SET')) {
      const prop = this.state.properties.find((p) => p.PROPERTY_ID === Number(binds.id));
      if (prop) {
        if (binds.title !== undefined) prop.TITLE = binds.title;
        if (binds.description !== undefined) prop.DESCRIPTION = binds.description;
        if (binds.typeId !== undefined) prop.TYPE_ID = Number(binds.typeId);
        if (binds.rooms !== undefined) prop.ROOMS = Number(binds.rooms);
        if (binds.area !== undefined) prop.AREA = Number(binds.area);
        if (binds.monthlyPrice !== undefined) prop.MONTHLY_PRICE = Number(binds.monthlyPrice);
      }
      result = { rowsAffected: prop ? 1 : 0 };
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
