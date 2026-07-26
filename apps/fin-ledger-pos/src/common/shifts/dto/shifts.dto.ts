// src/shifts/dto/shifts.dto.ts
import {
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Min,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ShiftStatus } from '../../../db/types.js';

export class OpenShiftDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Store location ID',
  })
  @IsUUID('4')
  @IsNotEmpty()
  location_id!: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Employee/Cashier ID',
  })
  @IsUUID('4')
  @IsNotEmpty()
  cashier_id!: string;

  @ApiProperty({
    example: 500000,
    description: 'Starting cash float in the drawer (e.g., IDR)',
  })
  @IsNumber()
  @Min(0)
  starting_float!: number;
}

export class CashDropDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Active Shift ID',
  })
  @IsUUID('4')
  @IsNotEmpty()
  shift_id!: string;

  @ApiProperty({ example: 1000000, description: 'Amount moved to safe' })
  @IsNumber()
  @Min(1)
  amount!: number;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Manager/Cashier recording the drop',
  })
  @IsUUID('4')
  @IsNotEmpty()
  recorded_by!: string;
}

export class CloseShiftDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID('4')
  @IsNotEmpty()
  shift_id!: string;

  @ApiProperty({
    example: 2500000,
    description: 'Actual physical cash counted in the drawer',
  })
  @IsNumber()
  @Min(0)
  actual_cash!: number;
}

export class ShiftQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  location_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  cashier_id?: string;

  @ApiPropertyOptional({ enum: ['OPEN', 'CLOSED', 'FORCE_CLOSED'] })
  @IsOptional()
  @IsEnum(['OPEN', 'CLOSED', 'FORCE_CLOSED'])
  status?: ShiftStatus;
}
