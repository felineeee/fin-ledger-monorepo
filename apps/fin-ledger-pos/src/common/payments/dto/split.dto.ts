// src/payments/dto/split.dto.ts
import { IsNumber, IsNotEmpty, IsOptional, IsUUID, IsEnum, Min, ValidateNested, IsArray, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentChannel } from '../../../db/types.js';

export class SplitPaymentItemDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID('4')
  @IsNotEmpty()
  payment_method_id!: string;

  @ApiProperty({ enum: ['IN_PERSON', 'ONLINE'] })
  @IsEnum(['IN_PERSON', 'ONLINE'])
  @IsNotEmpty()
  channel!: PaymentChannel;

  @ApiProperty({ example: 25000, description: 'Amount covered by this specific method' })
  @IsNumber()
  @Min(1)
  amount!: number;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsUUID('4')
  shift_id?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsUUID('4')
  terminal_id?: string;

  @ApiPropertyOptional({ example: 'AUTH999', description: 'Terminal auth code if pre-captured on hardware' })
  @IsOptional()
  @IsString()
  auth_code?: string;
}

export class SplitPaymentDto {
  @ApiProperty({ type: [SplitPaymentItemDto], description: 'Array of payments making up the split tender' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SplitPaymentItemDto)
  @IsNotEmpty()
  payments!: SplitPaymentItemDto[];
}

export class OrderBalanceQueryDto {
  @ApiProperty({ example: 100000, description: 'The grand total of the order from the POS/Cart service' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  order_total!: number;
}