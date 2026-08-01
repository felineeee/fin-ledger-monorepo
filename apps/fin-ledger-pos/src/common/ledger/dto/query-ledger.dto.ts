// src/common/ledger/dto/query-ledger.dto.ts
import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum LedgerEntryType {
  PAYMENT_CREATED = 'PAYMENT_CREATED',
  AUTHORIZED = 'AUTHORIZED',
  CAPTURED = 'CAPTURED',
  TIP_ADDED = 'TIP_ADDED',
  VOIDED = 'VOIDED',
  REFUNDED = 'REFUNDED',
  FEE_DEDUCTED = 'FEE_DEDUCTED',
  DISPUTED = 'DISPUTED',
}

export class QueryLedgerDto {
  @ApiPropertyOptional({ description: 'Filter by specific payment UUID' })
  @IsOptional()
  @IsString()
  payment_id?: string;

  @ApiPropertyOptional({
    enum: LedgerEntryType,
    description: 'Filter by ledger entry type',
  })
  @IsOptional()
  @IsEnum(LedgerEntryType)
  entry_type?: LedgerEntryType;

  @ApiPropertyOptional({
    example: '2026-01-01T00:00:00Z',
    description: 'Filter entries created on or after this ISO date',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    example: '2026-12-31T23:59:59Z',
    description: 'Filter entries created on or before this ISO date',
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
