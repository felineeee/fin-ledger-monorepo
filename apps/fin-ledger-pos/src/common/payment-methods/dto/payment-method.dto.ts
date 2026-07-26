import {
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsObject,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { PaymentMethodType } from '../../../db/types.js';

export class CreatePaymentMethodDto {
  @ApiProperty({
    example: 'Main Register Cash',
    description: 'Display name for the POS or checkout',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    enum: ['CASH', 'CARD', 'WALLET', 'VIRTUAL_ACCOUNT'],
    example: 'CASH',
  })
  @IsEnum(['CASH', 'CARD', 'WALLET', 'VIRTUAL_ACCOUNT'])
  @IsNotEmpty()
  type!: PaymentMethodType;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this method is currently available for new payments',
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    example: { require_drawer_open: true },
    description: 'JSON configuration for terminal or gateway',
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}

export class UpdatePaymentMethodDto {
  @ApiPropertyOptional({ example: 'Main Register Cash (Updated)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: ['CASH', 'CARD', 'WALLET', 'VIRTUAL_ACCOUNT'] })
  @IsOptional()
  @IsEnum(['CASH', 'CARD', 'WALLET', 'VIRTUAL_ACCOUNT'])
  type?: PaymentMethodType;

  @ApiPropertyOptional({
    example: false,
    description: 'Set to false to soft-delete/deactivate',
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ example: { require_drawer_open: false } })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}
