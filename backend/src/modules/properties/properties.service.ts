import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OracleService } from '../../database/oracle.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { PropertyFilterDto } from './dto/property-filter.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { Paginated, Property } from './property.entity';
import { PropertiesRepository } from './properties.repository';

/** Бизнес-правила управления объектами недвижимости. */
@Injectable()
export class PropertiesService {
  constructor(
    private readonly repo: PropertiesRepository,
    private readonly db: OracleService,
  ) {}

  findCatalog(filter: PropertyFilterDto): Promise<Paginated<Property>> {
    return this.repo.findAvailable(filter);
  }

  async findOne(id: number): Promise<Property> {
    const property = await this.repo.findById(id);
    if (!property) throw new NotFoundException(`Property ${id} not found`);
    return property;
  }

  findByOwner(ownerId: number): Promise<Property[]> {
    return this.repo.findByOwner(ownerId);
  }

  async create(ownerId: number, dto: CreatePropertyDto): Promise<Property> {
    const id = await this.db.transaction((tx) => this.repo.create(ownerId, dto, tx));
    return this.findOne(id);
  }

  async update(id: number, ownerId: number, dto: UpdatePropertyDto): Promise<Property> {
    await this.getOwned(id, ownerId);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async updateImage(id: number, ownerId: number, imageUrl: string): Promise<Property> {
    await this.getOwned(id, ownerId);
    await this.repo.updateImageUrl(id, imageUrl);
    return this.findOne(id);
  }

  /** Полное удаление объекта недвижимости и связанных записей из БД (только владельцем). */
  async remove(id: number, ownerId: number): Promise<void> {
    await this.getOwned(id, ownerId);
    await this.db.transaction((tx) => this.repo.deleteById(id, ownerId, tx));
  }

  /** Снятие объекта с публикации (AVAILABLE -> INACTIVE) с сохранением истории. */
  async deactivate(id: number, ownerId: number): Promise<Property> {
    const property = await this.getOwned(id, ownerId);
    if (property.status === 'RENTED') {
      throw new ConflictException('Нельзя снять с публикации объект, находящийся в аренде (RENTED)');
    }
    await this.repo.updateStatus(id, 'INACTIVE');
    return this.findOne(id);
  }

  /** Повторная публикация снятого объекта (INACTIVE -> AVAILABLE) или освобождение после аренды. */
  async activate(id: number, ownerId: number): Promise<Property> {
    await this.getOwned(id, ownerId);
    await this.db.execute(
      `UPDATE contracts SET status = 'CLOSED' WHERE property_id = :propertyId AND status = 'ACTIVE'`,
      { propertyId: id },
    );
    await this.repo.updateStatus(id, 'AVAILABLE');
    return this.findOne(id);
  }

  /** Проверяет существование объекта и права владельца (landlord_id === ownerId из JWT). */
  private async getOwned(id: number, ownerId: number): Promise<Property> {
    const property = await this.findOne(id);
    if (Number(property.ownerId) !== Number(ownerId)) {
      throw new ForbiddenException('Вы можете управлять только собственными объектами недвижимости');
    }
    return property;
  }
}
