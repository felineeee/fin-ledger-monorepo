import {
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsObject,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import type { PaymentMethodType } from '../../../db/types.js';
import { PaymentChannelCode } from '../../../db/types.js';

/* @TODO need planned utilization of
 * is_active
 * config
 */
export class CreatePaymentMethodDto {
  @ApiProperty({
    example: 'Xendit ShopeePay E-Wallet',
    description: 'Display name for the POS or checkout UI',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    enum: ['CASH', 'CARD', 'WALLET', 'VIRTUAL_ACCOUNT', 'QRIS'],
    example: 'WALLET',
    description: 'High-level payment method classification',
  })
  @IsEnum(['CASH', 'CARD', 'WALLET', 'VIRTUAL_ACCOUNT', 'QRIS'])
  @IsNotEmpty()
  type!: PaymentMethodType;

  @ApiPropertyOptional({
    enum: [
      'BCA',
      'BNI',
      'MANDIRI',
      'BRI',
      'PERMATA',
      'CIMB',
      'GOPAY',
      'SHOPEEPAY',
      'DANA',
      'OVO',
      'LINKAJA',
      'NOBU',
      'QRIS',
      'CARD',
      'GENERIC',
    ],
    example: 'SHOPEEPAY',
    default: 'GENERIC',
    description:
      'Specific provider channel code for direct API routing (e.g., SHOPEEPAY, BCA, NOBU)',
  })
  @IsOptional()
  @IsEnum([
    'BCA',
    'BNI',
    'MANDIRI',
    'BRI',
    'PERMATA',
    'CIMB',
    'GOPAY',
    'SHOPEEPAY',
    'DANA',
    'OVO',
    'LINKAJA',
    'NOBU',
    'QRIS',
    'CARD',
    'GENERIC',
  ])
  channel_code?: PaymentChannelCode = 'GENERIC';

  @ApiPropertyOptional({
    example: 'XENDIT',
    default: 'DEFAULT',
    description: 'Payment gateway or provider name (e.g. XENDIT, MANUAL)',
  })
  @IsOptional()
  @IsString()
  provider?: string = 'DEFAULT';

  @ApiPropertyOptional({
    example: true,
    default: true,
    description: 'Whether this method is currently available for new payments',
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean = true;

  @ApiPropertyOptional({
    example: {
      channel_code: 'SHOPEEPAY',
      redirect_url: 'https://mysite.com/callback',
    },
    description: 'JSON configuration for terminal, gateway, or fee schedules',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  @IsObject()
  config?: Record<string, any>;
}

export class UpdatePaymentMethodDto {
  @ApiPropertyOptional({ example: 'Main Register Cash (Updated)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    enum: ['CASH', 'CARD', 'WALLET', 'VIRTUAL_ACCOUNT', 'QRIS'],
  })
  @IsOptional()
  @IsEnum(['CASH', 'CARD', 'WALLET', 'VIRTUAL_ACCOUNT', 'QRIS'])
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
