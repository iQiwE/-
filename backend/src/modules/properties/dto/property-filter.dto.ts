import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export type PropertySortBy = 'newest' | 'price_asc' | 'price_desc' | 'area_desc';

export class PropertyFilterDto {
  @IsOptional() @IsString()
  district?: string;

  @IsOptional() @Type(() => Number) @Min(0)
  minPrice?: number;

  @IsOptional() @Type(() => Number) @Min(0)
  maxPrice?: number;

  @IsOptional() @Type(() => Number) @IsInt()
  typeId?: number;

  @IsOptional() @IsIn(['newest', 'price_asc', 'price_desc', 'area_desc'])
  sortBy?: PropertySortBy = 'newest';

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit: number = 8;
}

