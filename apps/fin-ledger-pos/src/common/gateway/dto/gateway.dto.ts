import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUrl, IsString, IsPhoneNumber } from 'class-validator';

export class CreateCheckoutSessionDto {
  @ApiPropertyOptional({
    example: 'https://my-store.com/success',
    description: 'Redirect URL after successful payment',
  })
  @IsOptional()
  @IsUrl()
  success_redirect_url?: string;

  @ApiPropertyOptional({
    example: 'https://my-store.com/fail',
    description: 'Redirect URL after failed payment',
  })
  @IsOptional()
  @IsUrl()
  failure_redirect_url?: string;

  @ApiPropertyOptional({
    example: 'SHOPEEPAY',
    description:
      'Channel code for direct API checkouts (e.g., SHOPEEPAY, DANA, BCA, BNI, NOBU, QRIS). If omitted, falls back to hosted invoice.',
  })
  @IsOptional()
  @IsString()
  channel_code?: string;

  @ApiPropertyOptional({
    example: '+6281234567890',
    description:
      'Customer phone number required by certain E-Wallet channels (e.g., OVO)',
  })
  @IsOptional()
  @IsPhoneNumber('ID')
  phone_number?: string;
}
