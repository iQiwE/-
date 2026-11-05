import { Injectable } from '@nestjs/common';
import { addMonths } from '../../common/utils/date.utils';

export interface ScheduledPayment {
  dueDate: Date;
  amount: number;
}

/**
 * Чистая логика расчёта графика платежей без обращения к БД:
 * легко тестируется и заменяется (OCP), например при посуточной аренде.
 */
@Injectable()
export class PaymentScheduleService {
  /** Один платёж в месяц; первый — в дату начала аренды. */
  generateMonthly(startDate: Date, months: number, amount: number): ScheduledPayment[] {
    return Array.from({ length: months }, (_, i) => ({
      dueDate: addMonths(startDate, i),
      amount,
    }));
  }
}

