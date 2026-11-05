import { Injectable } from '@nestjs/common';
import oracledb from 'oracledb';
import { OracleService, TxConnection } from '../../database/oracle.service';
import { ScheduledPayment } from './payment-schedule.service';

/** Доступ к данным PAYMENTS. */
@Injectable()
export class PaymentsRepository {
  constructor(private readonly db: OracleService) {}

  /** Пакетная вставка графика платежей (executeMany). */
  async createMany(contractId: number, payments: ScheduledPayment[], tx: TxConnection): Promise<void> {
    if (!payments.length) return;

    await this.db.executeMany(
      `INSERT INTO payments (contract_id, due_date, amount, status)
       VALUES (:contractId, :dueDate, :amount, 'PENDING')`,
      payments.map((p) => ({ contractId, dueDate: p.dueDate, amount: p.amount })),
      {
        bindDefs: {
          contractId: { type: oracledb.NUMBER },
          dueDate: { type: oracledb.DATE },
          amount: { type: oracledb.NUMBER },
        },
      },
      tx,
    );
  }
}

