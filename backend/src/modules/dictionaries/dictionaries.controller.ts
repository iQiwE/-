import { Controller, Get } from '@nestjs/common';
import { OracleService } from '../../database/oracle.service';
import { PropertiesRepository } from '../properties/properties.repository';

@Controller('dictionaries')
export class DictionariesController {
  constructor(
    private readonly properties: PropertiesRepository,
    private readonly db: OracleService,
  ) {}

  @Get('districts')
  districts() {
    return this.properties.findDistricts();
  }

  @Get('property-types')
  async propertyTypes() {
    const rows = await this.db.query<{ TYPE_ID: number; TYPE_NAME: string }>(
      'SELECT type_id, type_name FROM property_types ORDER BY type_name',
    );
    return rows.map((r) => ({ id: r.TYPE_ID, name: r.TYPE_NAME }));
  }

  @Get('db-snapshot')
  async dbSnapshot() {
    const [properties, addresses, landlords, tenants, types, applications, contracts, payments, favorites] =
      await Promise.all([
        this.db.query<any>('SELECT * FROM PROPERTIES ORDER BY PROPERTY_ID'),
        this.db.query<any>('SELECT * FROM ADDRESSES ORDER BY ADDRESS_ID'),
        this.db.query<any>('SELECT * FROM LANDLORDS ORDER BY ID'),
        this.db.query<any>('SELECT * FROM TENANTS ORDER BY ID'),
        this.db.query<any>('SELECT type_id, type_name FROM property_types ORDER BY type_name'),
        this.db.query<any>('SELECT * FROM RENTAL_APPLICATIONS ORDER BY APPLICATION_ID'),
        this.db.query<any>('SELECT * FROM CONTRACTS ORDER BY CONTRACT_ID'),
        this.db.query<any>('SELECT * FROM PAYMENTS ORDER BY PAYMENT_ID'),
        this.db.query<any>('SELECT * FROM FAVORITES ORDER BY CREATED_AT DESC'),
      ]);

    const users = [
      ...landlords.map((l: any) => ({
        ID: l.ID,
        FULL_NAME: l.FULL_NAME,
        EMAIL: l.EMAIL,
        PHONE: l.PHONE ?? '—',
        ROLE: 'LANDLORD',
        PASSWORD_HASH: l.PASSWORD_HASH,
      })),
      ...tenants.map((t: any) => ({
        ID: 100 + Number(t.ID),
        FULL_NAME: t.FULL_NAME,
        EMAIL: t.EMAIL,
        PHONE: t.PHONE ?? '—',
        ROLE: 'TENANT',
        PASSWORD_HASH: t.PASSWORD_HASH,
      })),
    ];

    return {
      PROPERTIES: properties.map((p: any) => ({
        PROPERTY_ID: p.PROPERTY_ID,
        LANDLORD_ID: p.LANDLORD_ID,
        TYPE_ID: p.TYPE_ID,
        ADDRESS_ID: p.ADDRESS_ID,
        TITLE: p.TITLE,
        ROOMS: p.ROOMS,
        AREA: `${p.AREA} м²`,
        MONTHLY_PRICE: `${Number(p.MONTHLY_PRICE).toLocaleString('ru-RU')} ₸`,
        PETS_ALLOWED: p.PETS_ALLOWED,
        NO_DEPOSIT: p.NO_DEPOSIT,
        FROM_OWNER: p.FROM_OWNER,
        STATUS: p.STATUS,
      })),
      ADDRESSES: addresses.map((a: any) => ({
        ADDRESS_ID: a.ADDRESS_ID,
        CITY: a.CITY,
        DISTRICT: a.DISTRICT,
        STREET: a.STREET,
        BUILDING: a.BUILDING,
        APARTMENT: a.APARTMENT ?? '—',
        LAT: Number(a.LAT).toFixed(4),
        LNG: Number(a.LNG).toFixed(4),
      })),
      USERS: users,
      PROPERTY_TYPES: types.map((t: any) => ({
        TYPE_ID: t.TYPE_ID,
        NAME: t.TYPE_NAME,
      })),
      RENTAL_APPLICATIONS: applications.map((a: any) => ({
        APPLICATION_ID: a.APPLICATION_ID,
        PROPERTY_ID: a.PROPERTY_ID,
        TENANT_ID: a.TENANT_ID,
        DESIRED_START_DATE: String(a.DESIRED_START_DATE).slice(0, 10),
        LEASE_MONTHS: a.LEASE_MONTHS,
        STATUS: a.STATUS,
        MESSAGE: a.MESSAGE ?? '—',
      })),
      CONTRACTS: contracts.map((c: any) => ({
        CONTRACT_ID: c.CONTRACT_ID,
        APPLICATION_ID: c.APPLICATION_ID,
        PROPERTY_ID: c.PROPERTY_ID,
        TENANT_ID: c.TENANT_ID,
        START_DATE: String(c.START_DATE).slice(0, 10),
        END_DATE: String(c.END_DATE).slice(0, 10),
        MONTHLY_AMOUNT: `${Number(c.MONTHLY_AMOUNT).toLocaleString('ru-RU')} ₸`,
        STATUS: c.STATUS,
      })),
      PAYMENTS: payments.map((pm: any) => ({
        PAYMENT_ID: pm.PAYMENT_ID,
        CONTRACT_ID: pm.CONTRACT_ID,
        DUE_DATE: String(pm.DUE_DATE).slice(0, 10),
        AMOUNT: `${Number(pm.AMOUNT).toLocaleString('ru-RU')} ₸`,
        PAID_AT: pm.PAID_AT ? String(pm.PAID_AT).slice(0, 19).replace('T', ' ') : '—',
        STATUS: pm.STATUS,
      })),
      FAVORITES: favorites,
    };
  }
}

