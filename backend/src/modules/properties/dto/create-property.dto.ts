import { Type } from 'class-transformer';
<<<<<<< Updated upstream
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, MaxLength, ValidateNested } from 'class-validator';
=======
import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, MaxLength, ValidateNested } from 'class-validator';
>>>>>>> Stashed changes

export class AddressDto {
  @IsString() @IsNotEmpty() city!: string;
  @IsString() @IsNotEmpty() district!: string;
  @IsString() @IsNotEmpty() street!: string;
  @IsString() @IsNotEmpty() building!: string;
  @IsOptional() @IsString() apartment?: string;
<<<<<<< Updated upstream
  @IsOptional() @Type(() => Number) @IsNumber() lat?: number;
  @IsOptional() @Type(() => Number) @IsNumber() lng?: number;
=======
>>>>>>> Stashed changes
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

