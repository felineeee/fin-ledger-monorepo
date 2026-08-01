// src/finance/dto/finance.dto.ts
import {
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsDateString,
  Min,
  Max,
  IsEnum,
  IsString,
  IsInt,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SettlementStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
}

// --- FEES ---
export class CreateFeeScheduleDto {
  @IsUUID()
  payment_method_id!: string;

  @IsOptional()
  @IsString()
  channel_code?: string;

  @Type(() => Number)
  @IsNumber()
  flat_fee!: number;

  @Type(() => Number)
  @IsNumber()
  percentage_fee!: number;

  @Type(() => Number)
  @IsNumber()
  vat_rate!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  min_fee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  max_fee?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateFeeScheduleDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  flat_fee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  percentage_fee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  vat_rate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  min_fee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  max_fee?: number;
}

// --- REPORTING ---
export class ReportQueryDto {
  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ example: '2026-07-31' })
  @IsOptional()
  @IsDateString()
  end_date?: string;
}

export class QuerySettlementsDto {
  @ApiPropertyOptional({
    description: 'Filter by payment processor (e.g., XENDIT)',
  })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({
    enum: SettlementStatus,
    description: 'Filter by settlement status',
  })
  @IsOptional()
  @IsEnum(SettlementStatus)
  status?: SettlementStatus;

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

export class MarkSettlementPaidDto {
  @ApiPropertyOptional({
    example: '2026-07-31T09:00:00Z',
    description: 'The actual date the funds hit the bank account',
  })
  @IsOptional()
  @IsDateString()
  actual_deposit_date?: string;

  @ApiPropertyOptional({
    example: 'Reconciled with BCA corporate statement.',
    description: 'Audit notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
