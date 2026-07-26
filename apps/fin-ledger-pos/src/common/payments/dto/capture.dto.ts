// src/payments/dto/capture.dto.ts
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CaptureCardPresentDto {
  @ApiPropertyOptional({ example: 'AUTH12345', description: 'Authorization code from the physical terminal' })
  @IsOptional()
  @IsString()
  auth_code?: string;

  @ApiPropertyOptional({ example: 'EMV_CHIP', description: 'Method of card entry (EMV, SWIPE, CONTACTLESS)' })
  @IsOptional()
  @IsString()
  entry_method?: string;
}

export class ReversePaymentDto {
  @ApiProperty({ example: 'Cashier entered wrong amount', description: 'Reason for the same-day void/reversal' })
  @IsNotEmpty()
  @IsString()
  reason!: string;
}