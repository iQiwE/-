import { Injectable } from '@nestjs/common';
import oracledb, { BindParameters } from 'oracledb';
import { OracleService, TxConnection } from '../../database/oracle.service';
import { ApplicationStatus, RentalApplication } from './application.entity';
import { CreateApplicationDto } from './dto/create-application.dto';

const BASE_SELECT = `
  SELECT ra.application_id, ra.property_id, ra.tenant_id, ra.desired_start_date,
         ra.lease_months, ra.message, ra.status, ra.created_at,
<<<<<<< Updated upstream
         p.title AS property_title, p.landlord_id, t.full_name AS tenant_name
    FROM rental_applications ra
    JOIN properties p ON p.property_id = ra.property_id
    JOIN tenants t    ON t.id = ra.tenant_id`;
=======
         p.title AS property_title, p.owner_id, u.full_name AS tenant_name
    FROM rental_applications ra
    JOIN properties p ON p.property_id = ra.property_id
    JOIN users u      ON u.user_id = ra.tenant_id`;
>>>>>>> Stashed changes

/** Доступ к данным RENTAL_APPLICATIONS. */
@Injectable()
export class ApplicationsRepository {
  constructor(private readonly db: OracleService) {}

  async create(propertyId: number, tenantId: number, dto: CreateApplicationDto): Promise<number> {
    const result = await this.db.execute(
      `INSERT INTO rental_applications (property_id, tenant_id, desired_start_date, lease_months, message, status, created_at)
       VALUES (:propertyId, :tenantId, :startDate, :leaseMonths, :message, 'PENDING', SYSTIMESTAMP)
       RETURNING application_id INTO :id`,
      {
        propertyId,
        tenantId,
        startDate: dto.desiredStartDate,
        leaseMonths: dto.leaseMonths,
        message: dto.message ?? null,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
    );
    return (result.outBinds as any).id[0];
  }

  /** forUpdate = true блокирует строку заявки до конца транзакции. */
  async findById(id: number, tx?: TxConnection, forUpdate = false): Promise<RentalApplication | null> {
    const lock = forUpdate ? ' FOR UPDATE OF ra.status' : '';
    const rows = await this.db.query<any>(`${BASE_SELECT} WHERE ra.application_id = :id${lock}`, { id }, tx);
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async findByLandlord(landlordId: number, status?: ApplicationStatus): Promise<RentalApplication[]> {
    const binds: BindParameters = { landlordId };
<<<<<<< Updated upstream
    let sql = `${BASE_SELECT} WHERE p.landlord_id = :landlordId`;
=======
    let sql = `${BASE_SELECT} WHERE p.owner_id = :landlordId`;
>>>>>>> Stashed changes
    if (status) {
      sql += ' AND ra.status = :status';
      binds.status = status;
    }
    const rows = await this.db.query<any>(`${sql} ORDER BY ra.created_at DESC`, binds);
    return rows.map(mapRow);
  }

  async findByTenant(tenantId: number): Promise<RentalApplication[]> {
    const rows = await this.db.query<any>(
      `${BASE_SELECT} WHERE ra.tenant_id = :tenantId ORDER BY ra.created_at DESC`,
      { tenantId },
    );
    return rows.map(mapRow);
  }

  async hasPending(propertyId: number, tenantId: number): Promise<boolean> {
    const rows = await this.db.query<{ CNT: number }>(
      `SELECT COUNT(*) AS cnt FROM rental_applications
        WHERE property_id = :propertyId AND tenant_id = :tenantId AND status = 'PENDING'`,
      { propertyId, tenantId },
    );
    return rows[0].CNT > 0;
  }

  async updateStatus(id: number, status: ApplicationStatus, tx?: TxConnection): Promise<void> {
    await this.db.execute(
      `UPDATE rental_applications SET status = :status WHERE application_id = :id`,
      { id, status },
      tx,
    );
  }

  /** Отклоняет остальные ожидающие заявки на объект после одобрения одной. */
  async rejectOtherPending(propertyId: number, exceptId: number, tx: TxConnection): Promise<void> {
    await this.db.execute(
      `UPDATE rental_applications SET status = 'REJECTED'
        WHERE property_id = :propertyId AND application_id <> :exceptId AND status = 'PENDING'`,
      { propertyId, exceptId },
      tx,
    );
  }
}

function mapRow(r: any): RentalApplication {
  return {
    id: r.APPLICATION_ID,
    propertyId: r.PROPERTY_ID,
    propertyTitle: r.PROPERTY_TITLE,
<<<<<<< Updated upstream
    ownerId: r.LANDLORD_ID ?? r.OWNER_ID,
=======
    ownerId: r.OWNER_ID,
>>>>>>> Stashed changes
    tenantId: r.TENANT_ID,
    tenantName: r.TENANT_NAME,
    desiredStartDate: r.DESIRED_START_DATE,
    leaseMonths: r.LEASE_MONTHS,
    message: r.MESSAGE,
    status: r.STATUS,
    createdAt: r.CREATED_AT,
  };
}

