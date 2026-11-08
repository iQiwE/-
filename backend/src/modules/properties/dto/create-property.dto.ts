import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

const toBoolean = ({ value }: { value: unknown }) => {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1' || value === 1) return true;
  if (value === 'false' || value === '0' || value === 0) return false;
  return undefined;
};

export class AddressDto {
  @IsString() @IsNotEmpty() @MaxLength(100) city!: string;
  @IsString() @IsNotEmpty() @MaxLength(100) district!: string;
  @IsString() @IsNotEmpty() @MaxLength(150) street!: string;
  @IsString() @IsNotEmpty() @MaxLength(30) building!: string;
  @IsOptional() @IsString() @MaxLength(30) apartment?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(-90) @Max(90) lat?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(-180) @Max(180) lng?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(-90) @Max(90) latitude?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(-180) @Max(180) longitude?: number;
}

export class CreatePropertyDto {
  @IsString() @IsNotEmpty() @MaxLength(200) title!: string;
  @IsOptional() @IsString() @MaxLength(4000) description?: string;
  @IsInt() @Min(1) @Max(100) typeId!: number;
  @IsInt() @IsPositive() @Max(50) rooms!: number;
  @IsNumber() @IsPositive() @Max(10000) area!: number;
  @IsNumber() @IsPositive() @Max(100000000) monthlyPrice!: number;

  @IsOptional() @Transform(toBoolean) @IsBoolean() petsAllowed?: boolean;
  @IsOptional() @Transform(toBoolean) @IsBoolean() noDeposit?: boolean;
  @IsOptional() @Transform(toBoolean) @IsBoolean() fromOwner?: boolean;
  @IsOptional() @IsString() @MaxLength(1000) imageUrl?: string;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(-90) @Max(90) latitude?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(-180) @Max(180) longitude?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(-90) @Max(90) lat?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(-180) @Max(180) lng?: number;

  @ValidateNested() @Type(() => AddressDto)
  address!: AddressDto;
}
