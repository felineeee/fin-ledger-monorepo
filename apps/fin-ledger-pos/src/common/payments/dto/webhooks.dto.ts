// src/payments/dto/webhooks.dto.ts
import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Xendit payload varies heavily by event type, so we use a loose shape for the body
// but strictly type our Dispute actions.
export class DisputeResponseDto {
  @ApiProperty({ example: 'Delivery proof signed by customer attached.', description: 'Evidence description' })
  @IsString()
  @IsNotEmpty()
  evidence_text!: string;

  @ApiPropertyOptional({ example: 'https://storage/proof.pdf', description: 'URL to evidence document' })
  @IsOptional()
  @IsString()
  evidence_url?: string;
}

export class UpdateDisputeStatusDto {
  @ApiProperty({ enum: ['PENDING', 'WON', 'LOST'] })
  @IsEnum(['PENDING', 'WON', 'LOST'])
  @IsNotEmpty()
  status!: 'PENDING' | 'WON' | 'LOST';
}