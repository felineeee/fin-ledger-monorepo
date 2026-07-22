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
import { PartialType } from '@nestjs/mapped-types';

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsEmail()
  contact_email?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  lead_time_days?: number;
}

export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class PurchaseOrderItemDto {
  @IsUUID('4')
  @IsNotEmpty()
  product_id!: string;

  @IsOptional()
  @IsUUID('4')
  variant_id?: string;

  @IsInt()
  @Min(1)
  quantity_ordered!: number;

  @IsString()
  @IsNotEmpty()
  unit_cost!: string;
}

export class CreatePurchaseOrderDto {
  @IsUUID('4')
  @IsNotEmpty()
  supplier_id!: string;

  @IsUUID('4')
  @IsNotEmpty()
  destination_location_id!: string;

  @IsOptional()
  @IsDateString()
  expected_delivery_date?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => PurchaseOrderItemDto)
  items!: PurchaseOrderItemDto[];
}

export class UpdatePurchaseOrderDto {
  @IsOptional()
  @IsUUID('4')
  supplier_id?: string;

  @IsOptional()
  @IsDateString()
  expected_delivery_date?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => PurchaseOrderItemDto)
  items?: PurchaseOrderItemDto[];
}

export class UpdatePOStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['SENT', 'CANCELLED'])
  status!: string;
}

export class ReceivePOItemDto {
  @IsUUID('4')
  @IsNotEmpty()
  po_item_id!: string;

  @IsInt()
  @Min(0)
  quantity_received!: number;
}

export class ReceivePODto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceivePOItemDto)
  items!: ReceivePOItemDto[];
}
