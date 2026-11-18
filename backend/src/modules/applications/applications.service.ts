import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { addMonths, startOfToday } from '../../common/utils/date.utils';
import { AuthUser } from '../../common/types/auth-user';
import { OracleService, TxConnection } from '../../database/oracle.service';
import { ContractsRepository } from '../contracts/contracts.repository';
import { PaymentScheduleService } from '../payments/payment-schedule.service';
import { PaymentsRepository } from '../payments/payments.repository';
import { PropertiesRepository } from '../properties/properties.repository';
import { ApplicationStatus, RentalApplication } from './application.entity';
import { ApplicationsRepository } from './applications.repository';
import { CreateApplicationDto } from './dto/create-application.dto';

export interface ApprovalResult {
  applicationId: number;
  propertyId: number;
  contractId: number;
  paymentsCreated: number;
}

/** Жизненный цикл заявки: подача → одобрение (договор + платежи) / отклонение. */
@Injectable()
export class ApplicationsService {
  constructor(
    private readonly db: OracleService,
    private readonly applications: ApplicationsRepository,
    private readonly properties: PropertiesRepository,
    private readonly contracts: ContractsRepository,
    private readonly payments: PaymentsRepository,
    private readonly schedule: PaymentScheduleService,
  ) {}

  async submit(propertyId: number, user: AuthUser, dto: CreateApplicationDto): Promise<RentalApplication> {
    if (dto.desiredStartDate < startOfToday()) {
      throw new BadRequestException('Desired start date cannot be in the past');
    }

    const property = await this.properties.findById(propertyId);
    if (!property) throw new NotFoundException(`Property ${propertyId} not found`);
    if (user.role === 'LANDLORD' && property.ownerId === user.id) {
      throw new ForbiddenException('Cannot apply to own property');
    }
    if (user.role !== 'TENANT') {
      throw new ForbiddenException('Only users with role TENANT can submit rental applications');
    }
    if (property.status !== 'AVAILABLE') throw new ConflictException('Property is not available for rent');
    if (await this.applications.hasPending(propertyId, user.id)) {
      throw new ConflictException('You already have a pending application for this property');
    }

    const id = await this.applications.create(propertyId, user.id, dto);
    return (await this.applications.findById(id))!;
  }

  findForLandlord(landlordId: number, status?: ApplicationStatus) {
    return this.applications.findByLandlord(landlordId, status);
  }

  findForTenant(tenantId: number) {
    return this.applications.findByTenant(tenantId);
  }

  /**
   * Одобрение заявки — атомарная операция:
   *  1) блокировка заявки и объекта (SELECT ... FOR UPDATE) против гонок;
   *  2) заявка → APPROVED, прочие ожидающие заявки на объект → REJECTED;
   *  3) объект → RENTED;
   *  4) создание договора в CONTRACTS;
   *  5) генерация ежемесячных платежей в PAYMENTS.
   */
  async approve(applicationId: number, landlordId: number): Promise<ApprovalResult> {
    return this.db.transaction(async (tx) => {
      const application = await this.lockPendingOwned(applicationId, landlordId, tx);

      const property = await this.properties.findById(application.propertyId, tx, true);
      if (!property || property.status !== 'AVAILABLE') {
        throw new ConflictException('Property is no longer available');
      }

      await this.applications.updateStatus(application.id, 'APPROVED', tx);
      await this.applications.rejectOtherPending(property.id, application.id, tx);
      await this.db.execute(
        `UPDATE PROPERTIES SET status = 'RENTED' WHERE property_id = :property_id`,
        { property_id: property.id },
        tx,
      );

      const startDate = new Date(application.desiredStartDate);
      const contractId = await this.contracts.create(
        {
          applicationId: application.id,
          propertyId: property.id,
          tenantId: application.tenantId,
          landlordId,
          startDate,
          endDate: addMonths(startDate, application.leaseMonths),
          monthlyAmount: property.monthlyPrice,
        },
        tx,
      );

      const schedule = this.schedule.generateMonthly(startDate, application.leaseMonths, property.monthlyPrice);
      await this.payments.createMany(contractId, schedule, tx);

      return {
        applicationId: application.id,
        propertyId: property.id,
        contractId,
        paymentsCreated: schedule.length,
      };
    });
  }

  async reject(applicationId: number, landlordId: number): Promise<void> {
    await this.db.transaction(async (tx) => {
      await this.lockPendingOwned(applicationId, landlordId, tx);
      await this.applications.updateStatus(applicationId, 'REJECTED', tx);
    });
  }

  /** Блокирует заявку и проверяет: существует, принадлежит арендодателю, в статусе PENDING. */
  private async lockPendingOwned(id: number, landlordId: number, tx: TxConnection): Promise<RentalApplication> {
    const application = await this.applications.findById(id, tx, true);
    if (!application) throw new NotFoundException(`Application ${id} not found`);
    if (application.ownerId !== landlordId) throw new ForbiddenException('Not the owner of this property');
    if (application.status !== 'PENDING') {
      throw new ConflictException(`Application already ${application.status.toLowerCase()}`);
    }
    return application;
  }
}

