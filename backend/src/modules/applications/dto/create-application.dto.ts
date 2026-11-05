import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/** Дата начала проверяется в сервисе относительно текущих суток (не на момент загрузки модуля). */
export class CreateApplicationDto {
  @Type(() => Date) @IsDate()
  desiredStartDate!: Date;

  @IsInt() @Min(1) @Max(60)
  leaseMonths!: number;

  @IsOptional() @IsString() @MaxLength(1000)
  message?: string;
}

