// src/payments/dto/refunds.dto.ts
import { IsNumber, IsNotEmpty, IsOptional, IsString, Min, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RefundStatus } from '../../../db/types.js';

export class CreateRefundDto {
  @ApiProperty({ example: 15000, description: 'Amount to refund' })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  amount!: number;

  @ApiPropertyOptional({ example: 'Customer returned the item', description: 'Reason for the refund' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateRefundStatusDto {
  @ApiProperty({ enum: ['PENDING', 'COMPLETED', 'FAILED'], description: 'The new status of the refund' })
  @IsEnum(['PENDING', 'COMPLETED', 'FAILED'])
  @IsNotEmpty()
  status!: RefundStatus;
}