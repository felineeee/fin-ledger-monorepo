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

export class TransferItemDto {
  @IsUUID('4')
  @IsNotEmpty()
  product_id!: string;

  @IsOptional()
  @IsUUID('4')
  variant_id?: string;

  @IsInt()
  @Min(1)
  quantity_requested!: number;
}

export class CreateTransferDto {
  @IsUUID('4')
  @IsNotEmpty()
  source_location_id!: string;

  @IsUUID('4')
  @IsNotEmpty()
  @NotEquals('source_location_id', {
    message: 'Destination cannot match source location',
  })
  destination_location_id!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => TransferItemDto)
  items!: TransferItemDto[];
}

export class DispatchTransferItemDto {
  @IsUUID('4')
  @IsNotEmpty()
  product_id!: string;

  @IsOptional()
  @IsUUID('4')
  variant_id?: string;

  @IsInt()
  @Min(0)
  quantity_dispatched!: number;
}

export class DispatchTransferDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DispatchTransferItemDto)
  items!: DispatchTransferItemDto[];
}

export class ReceiveTransferItemDto {
  @IsUUID('4')
  @IsNotEmpty()
  product_id!: string;

  @IsOptional()
  @IsUUID('4')
  variant_id?: string;

  @IsInt()
  @Min(0)
  quantity_received!: number;
}

export class ReceiveTransferDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiveTransferItemDto)
  items!: ReceiveTransferItemDto[];
}
