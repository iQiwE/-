import { Injectable } from '@nestjs/common';
import oracledb, { BindParameters } from 'oracledb';
import { defaultImageUrlForPropertyId } from '../../database/in-memory-oracle.store';
import { OracleService, TxConnection } from '../../database/oracle.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { PropertyFilterDto } from './dto/property-filter.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { Paginated, Property, PropertyStatus } from './property.entity';

const BASE_SELECT = `
  SELECT p.property_id, p.landlord_id, p.title, p.description, p.rooms, p.area,
         p.monthly_price, p.pets_allowed, p.no_deposit, p.from_owner, p.image_url,
         p.latitude, p.longitude,
         p.status, p.created_at,
         t.type_id, t.type_name,
         a.address_id, a.city, a.district, a.street, a.building, a.apartment, a.lat, a.lng,
         AVG(p.monthly_price) OVER (PARTITION BY UPPER(a.district)) AS district_avg_price
    FROM properties p
    JOIN property_types t ON t.type_id = p.type_id
    JOIN addresses a      ON a.address_id = p.address_id`;

/** Белый список обновляемых колонок: защита от SQL-инъекций в динамическом UPDATE. */
const UPDATABLE_COLUMNS: Partial<Record<keyof UpdatePropertyDto, string>> = {
  title: 'title',
  description: 'description',
  typeId: 'type_id',
  rooms: 'rooms',
  area: 'area',
  monthlyPrice: 'monthly_price',
  petsAllowed: 'pets_allowed',
  noDeposit: 'no_deposit',
  fromOwner: 'from_owner',
  imageUrl: 'image_url',
  latitude: 'latitude',
  longitude: 'longitude',
};

/** Доступ к данным PROPERTIES и ADDRESSES. Бизнес-правил не содержит (SRP). */
@Injectable()
export class PropertiesRepository {
  constructor(private readonly db: OracleService) {}

  async findAvailable(filter: PropertyFilterDto): Promise<Paginated<Property>> {
    // Принудительная фильтрация только доступных квартир (AVAILABLE) без активных договоров
    const where: string[] = [
      `p.status = 'AVAILABLE'`,
      `NOT EXISTS (SELECT 1 FROM contracts c WHERE c.property_id = p.property_id AND c.status = 'ACTIVE')`,
    ];
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
    if (filter.petsAllowed !== undefined) {
      where.push('p.pets_allowed = :petsAllowed');
      binds.petsAllowed = filter.petsAllowed ? 1 : 0;
    }
    if (filter.noDeposit !== undefined) {
      where.push('p.no_deposit = :noDeposit');
      binds.noDeposit = filter.noDeposit ? 1 : 0;
    }
    if (filter.fromOwner !== undefined) {
      where.push('p.from_owner = :fromOwner');
      binds.fromOwner = filter.fromOwner ? 1 : 0;
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
          AND NOT EXISTS (SELECT 1 FROM contracts c WHERE c.property_id = p.property_id AND c.status = 'ACTIVE')
        ORDER BY a.district`,
    );
    return rows.map((r) => r.DISTRICT);
  }

  /** Создаёт адрес и объект в рамках переданной транзакции. */
  async create(ownerId: number, dto: CreatePropertyDto, tx: TxConnection): Promise<number> {
    const resolvedLat =
      dto.latitude ?? dto.lat ?? dto.address?.latitude ?? dto.address?.lat ?? 49.953;
    const resolvedLng =
      dto.longitude ?? dto.lng ?? dto.address?.longitude ?? dto.address?.lng ?? 82.618;

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
        lat: Number(resolvedLat),
        lng: Number(resolvedLng),
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      tx,
    );
    const addressId = (addr.outBinds as any).id[0];

    const prop = await this.db.execute(
      `INSERT INTO properties (landlord_id, type_id, address_id, title, description, rooms, area, monthly_price, pets_allowed, no_deposit, from_owner, image_url, latitude, longitude, status, created_at)
       VALUES (:landlordId, :typeId, :addressId, :title, :description, :rooms, :area, :monthlyPrice, :petsAllowed, :noDeposit, :fromOwner, :imageUrl, :latitude, :longitude, 'AVAILABLE', SYSTIMESTAMP)
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
        petsAllowed: dto.petsAllowed ? 1 : 0,
        noDeposit: dto.noDeposit ? 1 : 0,
        fromOwner: dto.fromOwner !== undefined ? (dto.fromOwner ? 1 : 0) : 1,
        imageUrl: dto.imageUrl ?? null,
        latitude: Number(resolvedLat),
        longitude: Number(resolvedLng),
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      tx,
    );
    return (prop.outBinds as any).id[0];
  }

  async update(id: number, dto: UpdatePropertyDto): Promise<void> {
    const resolvedLat =
      dto.latitude ?? dto.lat ?? dto.address?.latitude ?? dto.address?.lat;
    const resolvedLng =
      dto.longitude ?? dto.lng ?? dto.address?.longitude ?? dto.address?.lng;

    const normalizedDto: UpdatePropertyDto = {
      ...dto,
      ...(resolvedLat !== undefined ? { latitude: Number(resolvedLat) } : {}),
      ...(resolvedLng !== undefined ? { longitude: Number(resolvedLng) } : {}),
    };

    const sets: string[] = [];
    const binds: BindParameters = { id };

    (Object.keys(normalizedDto) as (keyof UpdatePropertyDto)[]).forEach((key) => {
      if (normalizedDto[key] !== undefined && UPDATABLE_COLUMNS[key]) {
        sets.push(`${UPDATABLE_COLUMNS[key]} = :${key}`);
        const rawVal = normalizedDto[key];
        binds[key] = typeof rawVal === 'boolean' ? (rawVal ? 1 : 0) : (rawVal as any);
      }
    });

    if (sets.length > 0) {
      await this.db.execute(`UPDATE properties SET ${sets.join(', ')} WHERE property_id = :id`, binds);
    }

    if (dto.address || resolvedLat !== undefined || resolvedLng !== undefined) {
      const addrSets: string[] = [];
      const addrBinds: BindParameters = { propertyId: id };

      if (dto.address?.city !== undefined) {
        addrSets.push('city = :city');
        addrBinds.city = dto.address.city;
      }
      if (dto.address?.district !== undefined) {
        addrSets.push('district = :district');
        addrBinds.district = dto.address.district;
      }
      if (dto.address?.street !== undefined) {
        addrSets.push('street = :street');
        addrBinds.street = dto.address.street;
      }
      if (dto.address?.building !== undefined) {
        addrSets.push('building = :building');
        addrBinds.building = dto.address.building;
      }
      if (dto.address?.apartment !== undefined) {
        addrSets.push('apartment = :apartment');
        addrBinds.apartment = dto.address.apartment;
      }
      if (resolvedLat !== undefined) {
        addrSets.push('lat = :lat');
        addrBinds.lat = Number(resolvedLat);
      }
      if (resolvedLng !== undefined) {
        addrSets.push('lng = :lng');
        addrBinds.lng = Number(resolvedLng);
      }

      if (addrSets.length > 0) {
        await this.db.execute(
          `UPDATE addresses SET ${addrSets.join(', ')} WHERE address_id = (SELECT address_id FROM properties WHERE property_id = :propertyId)`,
          addrBinds,
        );
      }
    }
  }

  async updateImageUrl(id: number, imageUrl: string): Promise<void> {
    await this.db.execute(`UPDATE properties SET image_url = :imageUrl WHERE property_id = :id`, {
      id,
      imageUrl,
    });
  }

  async updateStatus(id: number, status: PropertyStatus, tx?: TxConnection): Promise<void> {
    await this.db.execute(`UPDATE properties SET status = :status WHERE property_id = :id`, { id, status }, tx);
  }

  /** Каскадное удаление объекта недвижимости и всех связанных записей из таблиц Oracle. */
  async deleteById(id: number, ownerId: number, tx?: TxConnection): Promise<void> {
    await this.db.execute(
      `DELETE FROM payments WHERE contract_id IN (SELECT contract_id FROM contracts WHERE property_id = :id)`,
      { id },
      tx,
    );
    await this.db.execute(`DELETE FROM contracts WHERE property_id = :id`, { id }, tx);
    await this.db.execute(`DELETE FROM rental_applications WHERE property_id = :id`, { id }, tx);
    await this.db.execute(`DELETE FROM favorites WHERE property_id = :id`, { id }, tx);
    await this.db.execute(
      `DELETE FROM properties WHERE property_id = :id AND landlord_id = :ownerId`,
      { id, ownerId },
      tx,
    );
    await this.db.execute(
      `DELETE FROM addresses a WHERE NOT EXISTS (SELECT 1 FROM properties p WHERE p.address_id = a.address_id)`,
      {},
      tx,
    );
  }
}

/** Преобразование строки Oracle (UPPER_CASE) в доменную модель с расчётом аналитики цены (is_good_price). */
export function mapRow(r: any): Property {
  const monthlyPrice = Number(r.MONTHLY_PRICE);
  const districtAvg = Number(r.DISTRICT_AVG_PRICE ?? monthlyPrice);
  const isGoodPrice = districtAvg > 0 && monthlyPrice < districtAvg * 0.95;
  const lat = Number(r.LATITUDE ?? r.LAT ?? 49.953);
  const lng = Number(r.LONGITUDE ?? r.LNG ?? 82.618);

  return {
    id: r.PROPERTY_ID,
    ownerId: r.LANDLORD_ID ?? r.OWNER_ID,
    title: r.TITLE,
    description: r.DESCRIPTION,
    rooms: r.ROOMS,
    area: r.AREA,
    monthlyPrice,
    petsAllowed: Boolean(Number(r.PETS_ALLOWED ?? 0)),
    noDeposit: Boolean(Number(r.NO_DEPOSIT ?? 0)),
    fromOwner: Boolean(Number(r.FROM_OWNER ?? 1)),
    image_url: r.IMAGE_URL || defaultImageUrlForPropertyId(r.PROPERTY_ID),
    latitude: lat,
    longitude: lng,
    districtAvgPrice: Math.round(districtAvg),
    is_good_price: isGoodPrice,
    status: r.STATUS,
    createdAt: r.CREATED_AT,
    type: { id: r.TYPE_ID, name: r.TYPE_NAME },
    address: {
      city: r.CITY,
      district: r.DISTRICT,
      street: r.STREET,
      building: r.BUILDING,
      apartment: r.APARTMENT,
      lat,
      lng,
    },
  };
}
