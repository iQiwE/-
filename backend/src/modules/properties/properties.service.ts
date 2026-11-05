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

  /** Мягкое удаление: история договоров и платежей сохраняется. */
  async remove(id: number, ownerId: number): Promise<void> {
    const property = await this.getOwned(id, ownerId);
    if (property.status === 'RENTED') {
<<<<<<< Updated upstream
      throw new ConflictException('Нельзя снять с публикации объект, находящийся в аренде (RENTED)');
=======
      throw new ConflictException('Cannot unpublish a rented property');
>>>>>>> Stashed changes
    }
    await this.repo.updateStatus(id, 'INACTIVE');
  }

<<<<<<< Updated upstream
  /** Повторная публикация снятого объекта (INACTIVE -> AVAILABLE) или освобождение после аренды. */
  async activate(id: number, ownerId: number): Promise<Property> {
    await this.getOwned(id, ownerId);
    await this.repo.updateStatus(id, 'AVAILABLE');
    return this.findOne(id);
  }

=======
>>>>>>> Stashed changes
  /** Проверяет существование объекта и права владельца. */
  private async getOwned(id: number, ownerId: number): Promise<Property> {
    const property = await this.findOne(id);
    if (property.ownerId !== ownerId) throw new ForbiddenException('Not the owner of this property');
    return property;
  }
}

