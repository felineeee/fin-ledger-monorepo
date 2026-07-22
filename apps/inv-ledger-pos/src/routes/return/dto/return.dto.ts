import {
  IsString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Min,
  MinLength,
  IsIn,
  IsEmail,
  IsBoolean,
  IsDateString,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  NotEquals,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProcessReturnDto {
  @IsUUID('4')
  @IsNotEmpty()
  store_location_id!: string;

  @IsUUID('4')
  @IsNotEmpty()
  product_id!: string;

  @IsOptional()
  @IsUUID('4')
  variant_id?: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
