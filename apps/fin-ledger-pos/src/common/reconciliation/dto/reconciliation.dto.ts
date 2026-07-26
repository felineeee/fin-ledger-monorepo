// src/reconciliation/dto/reconciliation.dto.ts
import { IsOptional, IsUUID, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LedgerEntryType } from '../../../db/types.js';

export class LedgerQueryDto {
  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Filter by specific payment' })
  @IsOptional()
  @IsUUID('4')
  payment_id?: string;

  @ApiPropertyOptional({ enum: ['PAYMENT_CREATED', 'AUTHORIZED', 'CAPTURED', 'TIP_ADDED', 'VOIDED', 'REFUNDED', 'FEE_DEDUCTED'] })
  @IsOptional()
  @IsEnum(['PAYMENT_CREATED', 'AUTHORIZED', 'CAPTURED', 'TIP_ADDED', 'VOIDED', 'REFUNDED', 'FEE_DEDUCTED'])
  entry_type?: LedgerEntryType;
}

export class DailyReconciliationQueryDto {
  @ApiPropertyOptional({ example: '2026-07-26', description: 'Target date for reconciliation (defaults to today)' })
  @IsOptional()
  @IsDateString()
  date?: string;
}

export class DiscrepancyQueryDto {
  @ApiPropertyOptional({ example: '2026-07-26', description: 'Filter discrepancies by date' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Filter by location' })
  @IsOptional()
  @IsUUID('4')
  location_id?: string;
}