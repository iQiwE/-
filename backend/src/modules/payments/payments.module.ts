import { Module } from '@nestjs/common';
import { PaymentScheduleService } from './payment-schedule.service';
import { PaymentsRepository } from './payments.repository';

@Module({
  providers: [PaymentsRepository, PaymentScheduleService],
  exports: [PaymentsRepository, PaymentScheduleService],
})
export class PaymentsModule {}

