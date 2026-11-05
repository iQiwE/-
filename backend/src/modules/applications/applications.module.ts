import { Module } from '@nestjs/common';
import { ContractsModule } from '../contracts/contracts.module';
import { PaymentsModule } from '../payments/payments.module';
import { PropertiesModule } from '../properties/properties.module';
import { ApplicationsController } from './applications.controller';
import { ApplicationsRepository } from './applications.repository';
import { ApplicationsService } from './applications.service';

@Module({
  imports: [PropertiesModule, ContractsModule, PaymentsModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, ApplicationsRepository],
})
export class ApplicationsModule {}

