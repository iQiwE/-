import { Injectable } from '@nestjs/common';
import oracledb from 'oracledb';
import { OracleService, TxConnection } from '../../database/oracle.service';

export interface NewContract {
  applicationId: number;
  propertyId: number;
  tenantId: number;
  landlordId: number;
  startDate: Date;
  endDate: Date;
  monthlyAmount: number;
}

/** Доступ к данным CONTRACTS. */
@Injectable()
export class ContractsRepository {
  constructor(private readonly db: OracleService) {}

  async create(c: NewContract, tx: TxConnection): Promise<number> {
    const result = await this.db.execute(
      `INSERT INTO contracts (application_id, property_id, tenant_id, landlord_id, start_date, end_date, monthly_amount, status)
       VALUES (:applicationId, :propertyId, :tenantId, :landlordId, :startDate, :endDate, :monthlyAmount, 'ACTIVE')
       RETURNING contract_id INTO :id`,
      {
        applicationId: c.applicationId,
        propertyId: c.propertyId,
        tenantId: c.tenantId,
        landlordId: c.landlordId,
        startDate: c.startDate,
        endDate: c.endDate,
        monthlyAmount: c.monthlyAmount,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      tx,
    );
    return (result.outBinds as any).id[0];
  }
}

