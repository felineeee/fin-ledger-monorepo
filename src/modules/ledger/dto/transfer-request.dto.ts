import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';

export class TransferRequestDto {
  @IsUUID()
  @IsNotEmpty()
  source_account_id!: string;

  @IsNotEmpty()
  @IsUUID('4', { message: 'target_account_id must be a valid UUID v4' })
  target_account_id!: string;

  @IsNotEmpty()
  @IsInt({
    message: 'amount must be a whole integer representing minor units (cents)',
  })
  @Min(1, { message: 'amount must be greater than zero cents' })
  amount!: number;

  @IsOptional()
  @IsUUID('4')
  @MaxLength(255, { message: 'description cannot exceed 255 characters' })
  description?: string;
}
