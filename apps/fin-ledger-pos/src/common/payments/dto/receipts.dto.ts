// src/payments/dto/receipts.dto.ts
import { IsString, IsNotEmpty, IsEnum, ValidateIf, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendReceiptDto {
  @ApiProperty({ enum: ['EMAIL', 'SMS'], description: 'Delivery method' })
  @IsEnum(['EMAIL', 'SMS'])
  @IsNotEmpty()
  method!: 'EMAIL' | 'SMS';

  @ApiProperty({ example: 'customer@example.com', description: 'Target email address or phone number' })
  @IsString()
  @IsNotEmpty()
  @ValidateIf(o => o.method === 'EMAIL')
  @IsEmail({}, { message: 'target must be a valid email address when method is EMAIL' })
  target!: string;
}