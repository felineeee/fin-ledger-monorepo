// src/finance/dto/finance.dto.ts
import { IsNumber, IsNotEmpty, IsOptional, IsUUID, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// --- FEES ---
export class CreateFeeScheduleDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Payment Method ID' })
  @IsUUID('4')
  @IsNotEmpty()
  payment_method_id!: string;

  @ApiProperty({ example: 4000, description: 'Flat fee per transaction (e.g., Rp 4,000 for VA)' })
  @IsNumber()
  @Min(0)
  flat_fee!: number;

  @ApiProperty({ example: 0.015, description: 'Percentage fee (e.g., 0.015 for 1.5% e-wallet)' })
  @IsNumber()
  @Min(0)
  @Max(1)
  percentage_fee!: number;
}

export class UpdateFeeScheduleDto {
  @ApiPropertyOptional({ example: 4500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  flat_fee?: number;

  @ApiPropertyOptional({ example: 0.02 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  percentage_fee?: number;
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