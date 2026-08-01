// src/payments/dto/gateway.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsUrl,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
}

// export class UpdateGatewayConfigDto {
//   @ApiProperty({ example: 'xnd_development_O4...', description: 'Xendit Secret API Key' })
//   @IsOptional()
//   @IsString()
//   api_key?: string;

//   @ApiProperty({ example: 'xnd_webhook_123...', description: 'Xendit Webhook Verification Token' })
//   @IsOptional()
//   @IsString()
//   webhook_secret?: string;

//   @ApiPropertyOptional({
//     example: ['CREDIT_CARD', 'VIRTUAL_ACCOUNT', 'QRIS', 'EWALLET', 'PAYLATER'],
//     description: 'Enabled payment channels for the hosted checkout'
//   })
//   @IsOptional()
//   @IsArray()
//   enabled_channels?: string[];
// }
