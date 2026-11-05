import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreatePropertyDto } from './create-property.dto';

/** Адрес меняется отдельной операцией; здесь — только атрибуты объявления. */
export class UpdatePropertyDto extends PartialType(OmitType(CreatePropertyDto, ['address'] as const)) {}

