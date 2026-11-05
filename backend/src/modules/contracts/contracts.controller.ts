import { Controller, ForbiddenException, Get, NotFoundException, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUser } from '../../common/types/auth-user';
import { OracleService } from '../../database/oracle.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContractsController {
  constructor(private readonly db: OracleService) {}

  @Get('contracts')
  async findMine(@CurrentUser() user: AuthUser) {
<<<<<<< Updated upstream
    const whereClause =
      user.role === 'LANDLORD' ? 'c.landlord_id = :userId' : 'c.tenant_id = :userId';
=======
>>>>>>> Stashed changes
    const rows = await this.db.query<any>(
      `SELECT c.contract_id, c.application_id, c.property_id, c.tenant_id, c.landlord_id,
              c.start_date, c.end_date, c.monthly_amount, c.status, p.title AS property_title
         FROM contracts c
         JOIN properties p ON p.property_id = c.property_id
<<<<<<< Updated upstream
        WHERE ${whereClause}`,
=======
        WHERE c.landlord_id = :userId OR c.tenant_id = :userId`,
>>>>>>> Stashed changes
      { userId: user.id },
    );
    return rows.map((r) => ({
      id: r.CONTRACT_ID,
      applicationId: r.APPLICATION_ID,
      propertyId: r.PROPERTY_ID,
      propertyTitle: r.PROPERTY_TITLE,
      tenantId: r.TENANT_ID,
      landlordId: r.LANDLORD_ID,
      startDate: r.START_DATE,
      endDate: r.END_DATE,
      monthlyAmount: r.MONTHLY_AMOUNT,
      status: r.STATUS,
    }));
  }

  @Get('contracts/:id/payments')
  async findPayments(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    const contracts = await this.db.query<any>(
      'SELECT contract_id, landlord_id, tenant_id FROM contracts c WHERE c.contract_id = :id',
      { id },
    );
    const c = contracts[0];
    if (!c) throw new NotFoundException('Contract not found');
<<<<<<< Updated upstream
    const isParticipant =
      (user.role === 'LANDLORD' && c.LANDLORD_ID === user.id) ||
      (user.role === 'TENANT' && c.TENANT_ID === user.id);
    if (!isParticipant) {
=======
    if (c.LANDLORD_ID !== user.id && c.TENANT_ID !== user.id) {
>>>>>>> Stashed changes
      throw new ForbiddenException('Not a participant of this contract');
    }

    const rows = await this.db.query<any>(
      'SELECT payment_id, contract_id, due_date, amount, status, paid_at FROM payments WHERE contract_id = :contractId ORDER BY due_date',
      { contractId: id },
    );
    return rows.map((r) => ({
      id: r.PAYMENT_ID,
      contractId: r.CONTRACT_ID,
      dueDate: r.DUE_DATE,
      amount: r.AMOUNT,
      status: r.STATUS,
      paidAt: r.PAID_AT,
    }));
  }

  @Patch('payments/:id/pay')
  @Roles('TENANT')
  async pay(@Param('id', ParseIntPipe) id: number) {
    await this.db.execute(
      `UPDATE payments SET status = 'PAID', paid_at = SYSTIMESTAMP WHERE payment_id = :id`,
      { id },
    );
    return { id, status: 'PAID' };
  }
}

