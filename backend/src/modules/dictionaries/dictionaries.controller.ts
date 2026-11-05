import { Controller, Get } from '@nestjs/common';
import { OracleService } from '../../database/oracle.service';
import { PropertiesRepository } from '../properties/properties.repository';

@Controller('dictionaries')
export class DictionariesController {
  constructor(
    private readonly properties: PropertiesRepository,
    private readonly db: OracleService,
  ) {}

  @Get('districts')
  districts() {
    return this.properties.findDistricts();
  }

  @Get('property-types')
  async propertyTypes() {
    const rows = await this.db.query<{ TYPE_ID: number; TYPE_NAME: string }>(
      'SELECT type_id, type_name FROM property_types ORDER BY type_name',
    );
    return rows.map((r) => ({ id: r.TYPE_ID, name: r.TYPE_NAME }));
  }
}

