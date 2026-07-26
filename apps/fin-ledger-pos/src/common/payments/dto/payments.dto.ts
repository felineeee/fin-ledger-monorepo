// src/payments/dto/payments.dto.ts
import {
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { PaymentChannel } from '../../../db/types.js';

export class CreatePaymentDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Linked Order ID',
  })
  @IsUUID('4')
  @IsNotEmpty()
  order_id!: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Selected Payment Method ID',
  })
  @IsUUID('4')
  @IsNotEmpty()
  payment_method_id!: string;

  @ApiProperty({ enum: ['IN_PERSON', 'ONLINE'] })
  @IsEnum(['IN_PERSON', 'ONLINE'])
  @IsNotEmpty()
  channel!: PaymentChannel;

  @ApiProperty({
    example: 50000,
    description: 'Amount in smallest currency unit (e.g., IDR Rupiah)',
  })
  @IsNumber()
  @Min(1)
  amount!: number;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Required if channel is IN_PERSON',
  })
  @IsOptional()
  @IsUUID('4')
  shift_id?: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Optional card terminal ID',
  })
  @IsOptional()
  @IsUUID('4')
  terminal_id?: string;
}

export class UpdatePaymentDto {
  @ApiPropertyOptional({
    example: 55000,
    description: 'Adjust amount before capture',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Change payment method before capture',
  })
  @IsOptional()
  @IsUUID('4')
  payment_method_id?: string;
}
