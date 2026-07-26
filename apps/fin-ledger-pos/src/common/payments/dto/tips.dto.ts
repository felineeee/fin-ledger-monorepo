// src/payments/dto/tips.dto.ts
import { IsNumber, IsNotEmpty, IsOptional, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTipDto {
  @ApiProperty({ example: 15000, description: 'The absolute total tip amount intended for this payment' })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  amount!: number;
}

export class TipReportQueryDto {
  @ApiPropertyOptional({ example: '2026-07-01T00:00:00Z', description: 'Filter start date' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ example: '2026-07-31T23:59:59Z', description: 'Filter end date' })
  @IsOptional()
  @IsDateString()
  end_date?: string;
}