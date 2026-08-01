// src/payments/disputes/dto/disputes.dto.ts
import { IsString, IsOptional, IsEnum, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DisputeStatus {
  PENDING = 'PENDING',
  WON = 'WON',
  LOST = 'LOST',
}

export class SubmitEvidenceDto {
  @ApiProperty({
    example: 'Customer physically signed the receipt at the register.',
    description: 'Text explanation',
  })
  @IsString()
  evidence_text!: string;

  @ApiPropertyOptional({
    example: 'https://your-bucket.s3.amazonaws.com/receipts/123.pdf',
    description: 'URL to the receipt/signature image',
  })
  @IsOptional()
  @IsUrl()
  evidence_url?: string;
}

export class UpdateDisputeStatusDto {
  @ApiProperty({ enum: DisputeStatus, example: DisputeStatus.WON })
  @IsEnum(DisputeStatus)
  status!: DisputeStatus;
}
