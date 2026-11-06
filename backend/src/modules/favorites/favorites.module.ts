import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Injectable,
  Module,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUser } from '../../common/types/auth-user';
import { OracleService } from '../../database/oracle.service';
import { mapRow } from '../properties/properties.repository';
import { Property } from '../properties/property.entity';

@Injectable()
export class FavoritesService {
  constructor(private readonly db: OracleService) {}

  async findFavorites(userId: number): Promise<Property[]> {
    const rows = await this.db.query<any>(
      `SELECT p.property_id, p.landlord_id, p.title, p.description, p.rooms, p.area,
              p.monthly_price, p.pets_allowed, p.no_deposit, p.from_owner, p.image_url,
              p.status, p.created_at,
              t.type_id, t.type_name,
              a.city, a.district, a.street, a.building, a.apartment, a.lat, a.lng,
              AVG(p.monthly_price) OVER (PARTITION BY UPPER(a.district)) AS district_avg_price,
              f.created_at AS favorited_at
         FROM favorites f
         JOIN properties p     ON p.property_id = f.property_id
         JOIN property_types t ON t.type_id = p.type_id
         JOIN addresses a      ON a.address_id = p.address_id
        WHERE f.user_id = :userId
        ORDER BY f.created_at DESC`,
      { userId },
    );
    return rows.map(mapRow);
  }

  async addFavorite(userId: number, propertyId: number): Promise<{ propertyId: number; favorited: boolean }> {
    const props = await this.db.query<any>(
      'SELECT p.property_id FROM properties p JOIN property_types t ON t.type_id = p.type_id JOIN addresses a ON a.address_id = p.address_id WHERE p.property_id = :id',
      { id: propertyId },
    );
    if (!props.length) {
      throw new NotFoundException(`Property ${propertyId} not found`);
    }

    const existing = await this.db.query<any>(
      'SELECT user_id, property_id FROM favorites f WHERE f.user_id = :userId AND f.property_id = :propertyId',
      { userId, propertyId },
    );
    if (existing.length === 0) {
      await this.db.execute(
        `INSERT INTO favorites (user_id, property_id, created_at)
         VALUES (:userId, :propertyId, SYSTIMESTAMP)`,
        { userId, propertyId },
      );
    }
    return { propertyId, favorited: true };
  }

  async removeFavorite(userId: number, propertyId: number): Promise<void> {
    await this.db.execute(
      `DELETE FROM favorites WHERE user_id = :userId AND property_id = :propertyId`,
      { userId, propertyId },
    );
  }
}

@Controller('favorites')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TENANT')
export class FavoritesController {
  constructor(private readonly service: FavoritesService) {}

  @Get()
  findMine(@CurrentUser() user: AuthUser) {
    return this.service.findFavorites(user.id);
  }

  @Post(':propertyId')
  add(@Param('propertyId', ParseIntPipe) propertyId: number, @CurrentUser() user: AuthUser) {
    return this.service.addFavorite(user.id, propertyId);
  }

  @Delete(':propertyId')
  @HttpCode(204)
  remove(@Param('propertyId', ParseIntPipe) propertyId: number, @CurrentUser() user: AuthUser) {
    return this.service.removeFavorite(user.id, propertyId);
  }
}

@Module({
  controllers: [FavoritesController],
  providers: [FavoritesService],
})
export class FavoritesModule {}

