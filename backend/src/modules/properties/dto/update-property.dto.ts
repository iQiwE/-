import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { AddressDto, CreatePropertyDto } from './create-property.dto';

export class UpdateAddressDto extends PartialType(AddressDto) {}

/** Обновление атрибутов объявления, адреса и геокоординат (latitude / longitude). */
export class UpdatePropertyDto extends PartialType(OmitType(CreatePropertyDto, ['address'] as const)) {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateAddressDto)
  address?: UpdateAddressDto;
}
