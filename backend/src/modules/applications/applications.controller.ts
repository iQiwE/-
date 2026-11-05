import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUser } from '../../common/types/auth-user';
import { ApplicationStatus } from './application.entity';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApplicationsController {
  constructor(private readonly service: ApplicationsService) {}

  @Post('properties/:id/applications')
  submit(
    @Param('id', ParseIntPipe) propertyId: number,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.service.submit(propertyId, user, dto);
  }

  @Get('tenant/applications')
  @Roles('TENANT')
  findMine(@CurrentUser() user: AuthUser) {
    return this.service.findForTenant(user.id);
  }

  @Get('landlord/applications')
  @Roles('LANDLORD')
  findIncoming(@CurrentUser() user: AuthUser, @Query('status') status?: ApplicationStatus) {
    return this.service.findForLandlord(user.id, status);
  }

  @Patch('applications/:id/approve')
  @Roles('LANDLORD')
  approve(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.service.approve(id, user.id);
  }

  @Patch('applications/:id/reject')
  @HttpCode(204)
  @Roles('LANDLORD')
  reject(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.service.reject(id, user.id);
  }
}

