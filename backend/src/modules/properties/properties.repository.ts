import { Injectable } from '@nestjs/common';
import oracledb, { BindParameters } from 'oracledb';
import { OracleService, TxConnection } from '../../database/oracle.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { PropertyFilterDto } from './dto/property-filter.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { Paginated, Property, PropertyStatus } from './property.entity';

const BASE_SELECT = `
  SELECT p.property_id, p.landlord_id, p.title, p.description, p.rooms, p.area,
         p.monthly_price, p.status, p.created_at,
         t.type_id, t.type_name,
         a.city, a.district, a.street, a.building, a.apartment, a.lat, a.lng
    FROM properties p
    JOIN property_types t ON t.type_id = p.type_id
    JOIN addresses a      ON a.address_id = p.address_id`;

/** Белый список обновляемых колонок: защита от SQL-инъекций в динамическом UPDATE. */
const UPDATABLE_COLUMNS: Record<keyof UpdatePropertyDto, string> = {
  title: 'title',
  description: 'description',
  typeId: 'type_id',
  rooms: 'rooms',
  area: 'area',
  monthlyPrice: 'monthly_price',
};

/** Доступ к данным PROPERTIES и ADDRESSES. Бизнес-правил не содержит (SRP). */
@Injectable()
export class PropertiesRepository {
  constructor(private readonly db: OracleService) {}

  async findAvailable(filter: PropertyFilterDto): Promise<Paginated<Property>> {
    const where: string[] = [`p.status = 'AVAILABLE'`];
    const binds: BindParameters = {};

    if (filter.district) {
      where.push('UPPER(a.district) = UPPER(:district)');
      binds.district = filter.district;
    }
    if (filter.minPrice !== undefined) {
      where.push('p.monthly_price >= :minPrice');
      binds.minPrice = filter.minPrice;
    }
    if (filter.maxPrice !== undefined) {
      where.push('p.monthly_price <= :maxPrice');
      binds.maxPrice = filter.maxPrice;
    }
    if (filter.typeId !== undefined) {
      where.push('p.type_id = :typeId');
      binds.typeId = filter.typeId;
    }

    binds.offset = (filter.page - 1) * filter.limit;
    binds.limit = filter.limit;
    if (filter.sortBy) binds.sortBy = filter.sortBy;

    const orderByMap: Record<string, string> = {
      newest: 'q.created_at DESC',
      price_asc: 'q.monthly_price ASC, q.created_at DESC',
      price_desc: 'q.monthly_price DESC, q.created_at DESC',
      area_desc: 'q.area DESC, q.created_at DESC',
    };
    const orderBy = orderByMap[filter.sortBy ?? 'newest'] ?? 'q.created_at DESC';

    // COUNT(*) OVER() возвращает общее количество за один запрос
    const rows = await this.db.query<any>(
      `SELECT q.*, COUNT(*) OVER() AS total_count FROM (${BASE_SELECT} WHERE ${where.join(' AND ')}) q
        ORDER BY ${orderBy}
       OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
      binds,
    );

    return {
      items: rows.map(mapRow),
      total: rows[0]?.TOTAL_COUNT ?? 0,
      page: filter.page,
      limit: filter.limit,
    };
  }

  async findById(id: number, tx?: TxConnection, forUpdate = false): Promise<Property | null> {
    const lock = forUpdate ? ' FOR UPDATE OF p.status' : '';
    const rows = await this.db.query<any>(`${BASE_SELECT} WHERE p.property_id = :id${lock}`, { id }, tx);
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async findByOwner(landlordId: number): Promise<Property[]> {
    const rows = await this.db.query<any>(
      `${BASE_SELECT} WHERE p.landlord_id = :landlordId ORDER BY p.created_at DESC`,
      { landlordId },
    );
    return rows.map(mapRow);
  }

  async findDistricts(): Promise<string[]> {
    const rows = await this.db.query<{ DISTRICT: string }>(
      `SELECT DISTINCT a.district FROM addresses a
         JOIN properties p ON p.address_id = a.address_id
        WHERE p.status = 'AVAILABLE'
        ORDER BY a.district`,
    );
    return rows.map((r) => r.DISTRICT);
  }

  /** Создаёт адрес и объект в рамках переданной транзакции. */
  async create(ownerId: number, dto: CreatePropertyDto, tx: TxConnection): Promise<number> {
    const addr = await this.db.execute(
      `INSERT INTO addresses (city, district, street, building, apartment, lat, lng)
       VALUES (:city, :district, :street, :building, :apartment, :lat, :lng)
       RETURNING address_id INTO :id`,
      {
        city: dto.address.city,
        district: dto.address.district,
        street: dto.address.street,
        building: dto.address.building,
        apartment: dto.address.apartment ?? null,
        lat: dto.address.lat ?? 49.953,
        lng: dto.address.lng ?? 82.618,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      tx,
    );
    const addressId = (addr.outBinds as any).id[0];

    const prop = await this.db.execute(
      `INSERT INTO properties (landlord_id, type_id, address_id, title, description, rooms, area, monthly_price, status, created_at)
       VALUES (:landlordId, :typeId, :addressId, :title, :description, :rooms, :area, :monthlyPrice, 'AVAILABLE', SYSTIMESTAMP)
       RETURNING property_id INTO :id`,
      {
        landlordId: ownerId,
        typeId: dto.typeId,
        addressId,
        title: dto.title,
        description: dto.description ?? null,
        rooms: dto.rooms,
        area: dto.area,
        monthlyPrice: dto.monthlyPrice,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      tx,
    );
    return (prop.outBinds as any).id[0];
  }

  async update(id: number, dto: UpdatePropertyDto): Promise<void> {
    const sets: string[] = [];
    const binds: BindParameters = { id };

    (Object.keys(dto) as (keyof UpdatePropertyDto)[]).forEach((key) => {
      if (dto[key] !== undefined && UPDATABLE_COLUMNS[key]) {
        sets.push(`${UPDATABLE_COLUMNS[key]} = :${key}`);
        binds[key] = dto[key] as any;
      }
    });
    if (!sets.length) return;

    await this.db.execute(`UPDATE properties SET ${sets.join(', ')} WHERE property_id = :id`, binds);
  }

  async updateStatus(id: number, status: PropertyStatus, tx?: TxConnection): Promise<void> {
    await this.db.execute(`UPDATE properties SET status = :status WHERE property_id = :id`, { id, status }, tx);
  }
}

/** Преобразование строки Oracle (UPPER_CASE) в доменную модель. */
function mapRow(r: any): Property {
  return {
    id: r.PROPERTY_ID,
    ownerId: r.LANDLORD_ID ?? r.OWNER_ID,
    title: r.TITLE,
    description: r.DESCRIPTION,
    rooms: r.ROOMS,
    area: r.AREA,
    monthlyPrice: r.MONTHLY_PRICE,
    status: r.STATUS,
    createdAt: r.CREATED_AT,
    type: { id: r.TYPE_ID, name: r.TYPE_NAME },
    address: {
      city: r.CITY,
      district: r.DISTRICT,
      street: r.STREET,
      building: r.BUILDING,
      apartment: r.APARTMENT,
      lat: Number(r.LAT ?? 49.953),
      lng: Number(r.LNG ?? 82.618),
    },
  };
}

