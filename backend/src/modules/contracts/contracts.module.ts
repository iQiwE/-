import { Module } from '@nestjs/common';
import { ContractsController } from './contracts.controller';
import { ContractsRepository } from './contracts.repository';

@Module({
  controllers: [ContractsController],
  providers: [ContractsRepository],
  exports: [ContractsRepository],
})
export class ContractsModule {}
