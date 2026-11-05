import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUser } from '../../common/types/auth-user';
import { CreatePropertyDto } from './dto/create-property.dto';
import { PropertyFilterDto } from './dto/property-filter.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertiesService } from './properties.service';

@Controller()
export class PropertiesController {
  constructor(private readonly service: PropertiesService) {}

  @Get('properties')
  findCatalog(@Query() filter: PropertyFilterDto) {
    return this.service.findCatalog(filter);
  }

  @Get('properties/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Get('landlord/properties')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LANDLORD')
  findMine(@CurrentUser() user: AuthUser) {
    return this.service.findByOwner(user.id);
  }

  @Post('properties')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LANDLORD')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePropertyDto) {
    return this.service.create(user.id, dto);
  }

  @Patch('properties/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LANDLORD')
  update(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser, @Body() dto: UpdatePropertyDto) {
    return this.service.update(id, user.id, dto);
  }

  @Delete('properties/:id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LANDLORD')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.service.remove(id, user.id);
  }
<<<<<<< Updated upstream

  @Patch('properties/:id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LANDLORD')
  activate(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.service.activate(id, user.id);
  }
=======
>>>>>>> Stashed changes
}

