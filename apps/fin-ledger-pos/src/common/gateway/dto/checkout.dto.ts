// src/gateway/dto/checkout.dto.ts
import { IsString, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum VirtualAccountChannel {
  BCA = 'BCA',
  BNI = 'BNI',
  BRI = 'BRI',
  MANDIRI = 'MANDIRI',
  PERMATA = 'PERMATA',
  CIMB = 'CIMB',
  BSM = 'BSM',
}

export enum EWalletChannel {
  OVO = 'ID_OVO',
  DANA = 'ID_DANA',
  LINKAJA = 'ID_LINKAJA',
  SHOPEEPAY = 'ID_SHOPEEPAY',
  GOPAY = 'ID_GOPAY',
}

export enum QRISChannel {
  QRIS = 'QRIS',
}

export const PaymentChannel = {
  ...VirtualAccountChannel,
  ...EWalletChannel,
  ...QRISChannel,
} as const;

export type PaymentChannel =
  | VirtualAccountChannel
  | EWalletChannel
  | QRISChannel;

export class CreateCheckoutSessionDto {
  @ApiProperty({
    example: VirtualAccountChannel.BCA,
    enum: PaymentChannel,
    description: 'Specific payment channel code (e.g. BCA, ID_OVO, QRIS)',
  })
  @IsEnum(PaymentChannel, {
    message: 'channel_code must be a valid Xendit payment channel',
  })
  @IsNotEmpty()
  channel_code!: PaymentChannel;

  @ApiPropertyOptional({
    example: '+6281234567890',
    description: 'Required for OVO or certain e-wallets',
  })
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiPropertyOptional({
    example: 'https://your-pos.com/success',
    description: 'Redirection URL for E-Wallets/Cards',
  })
  @IsOptional()
  @IsString()
  return_url?: string;

  @ApiPropertyOptional({
    example: 'tok_123456',
    description: 'Tokenized card payload for Credit/Debit',
  })
  @IsOptional()
  @IsString()
  card_token?: string;
}
