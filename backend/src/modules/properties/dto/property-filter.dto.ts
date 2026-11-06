import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export type PropertySortBy = 'newest' | 'price_asc' | 'price_desc' | 'area_desc';

const toOptionalBoolean = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1' || value === 1) return true;
  if (value === 'false' || value === '0' || value === 0) return false;
  return value;
};

export class PropertyFilterDto {
  @IsOptional() @IsString() @MaxLength(100)
  district?: string;

  @IsOptional() @Type(() => Number) @Min(0) @Max(100000000)
  minPrice?: number;

  @IsOptional() @Type(() => Number) @Min(0) @Max(100000000)
  maxPrice?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  typeId?: number;

  @IsOptional() @Transform(toOptionalBoolean) @IsBoolean()
  petsAllowed?: boolean;

  @IsOptional() @Transform(toOptionalBoolean) @IsBoolean()
  noDeposit?: boolean;

  @IsOptional() @Transform(toOptionalBoolean) @IsBoolean()
  fromOwner?: boolean;

  @IsOptional() @IsIn(['newest', 'price_asc', 'price_desc', 'area_desc'])
  sortBy?: PropertySortBy = 'newest';

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(10000)
  page: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit: number = 8;
}
