// src/reconciliation/dto/reconciliation.dto.ts
import {
  IsOptional,
  IsDateString,
  IsUUID,
  IsEnum,
  IsString,
  IsNumber,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import type { LedgerEntryType } from '../../../db/types.js';

export class LedgerQueryDto {
  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Filter by specific payment',
  })
  @IsOptional()
  @IsUUID('4')
  payment_id?: string;

  @ApiPropertyOptional({
    enum: [
      'PAYMENT_CREATED',
      'AUTHORIZED',
      'CAPTURED',
      'TIP_ADDED',
      'VOIDED',
      'REFUNDED',
      'FEE_DEDUCTED',
    ],
  })
  @IsOptional()
  @IsEnum([
    'PAYMENT_CREATED',
    'AUTHORIZED',
    'CAPTURED',
    'TIP_ADDED',
    'VOIDED',
    'REFUNDED',
    'FEE_DEDUCTED',
  ])
  entry_type?: LedgerEntryType;
}

export class DailyReconciliationQueryDto {
  @ApiPropertyOptional({
    example: '2026-07-26',
    description: 'Target date for reconciliation (defaults to today)',
  })
  @IsOptional()
  @IsDateString()
  date?: string;
}

export class DiscrepancyQueryDto {
  @ApiPropertyOptional({
    example: '2026-07-26',
    description: 'Filter discrepancies by date',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Filter by location',
  })
  @IsOptional()
  @IsUUID('4')
  location_id?: string;
}

export class QueryDailyReconciliationDto {
  @ApiProperty({
    example: '2026-07-31',
    description: 'Date for daily reconciliation breakdown (YYYY-MM-DD)',
  })
  @IsDateString()
  date!: string;
}

export class QueryDiscrepanciesDto {
  @ApiPropertyOptional({ description: 'Filter discrepancies by location UUID' })
  @IsOptional()
  @IsString()
  location_id?: string;

  @ApiPropertyOptional({
    example: '2026-07-01',
    description: 'Start date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    example: '2026-07-31',
    description: 'End date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({
    example: 10.0,
    description: 'Minimum absolute variance amount to flag',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  min_variance?: number;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class CloseDailyReconciliationDto {
  @ApiProperty({
    example: '2026-07-31',
    description: 'Date to lock and close (YYYY-MM-DD)',
  })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional({
    example: 'Daily reconciliation verified by manager.',
    description: 'Audit notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
