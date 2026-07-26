// src/terminals/dto/terminals.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TerminalStatus } from '../../../db/types.js';

export class CreateTerminalDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Store location ID' })
  @IsUUID('4')
  @IsNotEmpty()
  location_id!: string;

  @ApiProperty({ example: 'Front Register 1', description: 'Display name for the POS app' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'WSC51-239481', description: 'Hardware serial number' })
  @IsOptional()
  @IsString()
  serial_number?: string;
}

export class UpdateTerminalDto {
  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Move to a new location' })
  @IsOptional()
  @IsUUID('4')
  location_id?: string;

  @ApiPropertyOptional({ example: 'Front Register 1 (Updated)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'WSC51-239481' })
  @IsOptional()
  @IsString()
  serial_number?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE'] })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'MAINTENANCE'])
  status?: TerminalStatus;
}

export class TerminalQueryDto {
  @ApiPropertyOptional({ description: 'Filter terminals by specific location' })
  @IsOptional()
  @IsUUID('4')
  location_id?: string;
}