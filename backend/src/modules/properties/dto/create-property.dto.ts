import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, MaxLength, ValidateNested } from 'class-validator';

export class AddressDto {
  @IsString() @IsNotEmpty() city!: string;
  @IsString() @IsNotEmpty() district!: string;
  @IsString() @IsNotEmpty() street!: string;
  @IsString() @IsNotEmpty() building!: string;
  @IsOptional() @IsString() apartment?: string;
  @IsOptional() @Type(() => Number) @IsNumber() lat?: number;
  @IsOptional() @Type(() => Number) @IsNumber() lng?: number;
}

export class CreatePropertyDto {
  @IsString() @IsNotEmpty() @MaxLength(200) title!: string;
  @IsOptional() @IsString() @MaxLength(4000) description?: string;
  @IsInt() typeId!: number;
  @IsInt() @IsPositive() rooms!: number;
  @IsPositive() area!: number;
  @IsPositive() monthlyPrice!: number;

  @ValidateNested() @Type(() => AddressDto)
  address!: AddressDto;
}

