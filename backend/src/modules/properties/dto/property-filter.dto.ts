import { Type } from 'class-transformer';
<<<<<<< Updated upstream
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export type PropertySortBy = 'newest' | 'price_asc' | 'price_desc' | 'area_desc';
=======
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
>>>>>>> Stashed changes

export class PropertyFilterDto {
  @IsOptional() @IsString()
  district?: string;

  @IsOptional() @Type(() => Number) @Min(0)
  minPrice?: number;

  @IsOptional() @Type(() => Number) @Min(0)
  maxPrice?: number;

  @IsOptional() @Type(() => Number) @IsInt()
  typeId?: number;

<<<<<<< Updated upstream
  @IsOptional() @IsIn(['newest', 'price_asc', 'price_desc', 'area_desc'])
  sortBy?: PropertySortBy = 'newest';

=======
>>>>>>> Stashed changes
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
<<<<<<< Updated upstream
  limit: number = 8;
=======
  limit: number = 12;
>>>>>>> Stashed changes
}

