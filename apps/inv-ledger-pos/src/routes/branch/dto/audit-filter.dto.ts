import { IsOptional, IsUUID, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AuditFilterDto {
  @ApiPropertyOptional({ description: 'Filter by specific location' })
  @IsOptional()
  @IsUUID('4')
  location_id?: string;

  @ApiPropertyOptional({ description: 'Filter by specific product' })
  @IsOptional()
  @IsUUID('4')
  product_id?: string;

  @ApiPropertyOptional({
    description: 'Start date (ISO 8601)',
    example: '2026-07-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'End date (ISO 8601)',
    example: '2026-07-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 50, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 50;
}
