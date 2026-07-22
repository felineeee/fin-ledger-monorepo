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

export class InventoryAdjustmentDto {
  @IsUUID('4')
  @IsNotEmpty()
  location_id!: string;

  @IsUUID('4')
  @IsNotEmpty()
  product_id!: string;

  @IsOptional()
  @IsUUID('4')
  variant_id?: string;

  @IsInt()
  @IsNotEmpty()
  @NotEquals(0, { message: 'quantity_change cannot be exactly 0' })
  quantity_change!: number;

  @IsString()
  @IsNotEmpty()
  @IsIn(['SHRINKAGE', 'DAMAGE', 'MANUAL_CORRECTION', 'RETURN_TO_VENDOR'])
  reason!: string;
}
export class SetReorderThresholdDto {
  @IsInt()
  @Min(0)
  reorder_threshold!: number;
}
