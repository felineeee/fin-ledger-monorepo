import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateGatewayConfigDto {
  @ApiPropertyOptional({
    example: 'xnd_development_...',
    description: 'Xendit Secret API Key',
  })
  @IsOptional()
  @IsString()
  secret_key?: string;

  @ApiPropertyOptional({
    example: '...',
    description: 'Xendit Webhook Verification Token',
  })
  @IsOptional()
  @IsString()
  webhook_token?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Enable or disable the Xendit integration globally',
  })
  @IsOptional()
  @IsBoolean()
  is_enabled?: boolean;
}
