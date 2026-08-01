// src/finance/dto/reports.dto.ts
import { IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ReportQueryDto {
  @ApiPropertyOptional({
    example: '2026-07-01T00:00:00Z',
    description: 'Start date for the report period',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    example: '2026-07-31T23:59:59Z',
    description: 'End date for the report period',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;
}
