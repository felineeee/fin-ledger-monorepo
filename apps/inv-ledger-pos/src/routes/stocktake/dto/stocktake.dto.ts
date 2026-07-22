import {
  IsString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Min,
  MinLength,
  IsIn,
  IsEmail,
  IsBoolean,
  IsDateString,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  NotEquals,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStocktakeDto {
  @IsUUID('4')
  @IsNotEmpty()
  location_id!: string;

  @IsOptional()
  @IsUUID('4')
  filter_category_id?: string;
}

export class CountStocktakeItemDto {
  @IsUUID('4')
  @IsNotEmpty()
  product_id!: string;

  @IsOptional()
  @IsUUID('4')
  variant_id?: string;

  @IsInt()
  @Min(0)
  counted_quantity!: number;
}

export class CountStocktakeItemsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CountStocktakeItemDto)
  items!: CountStocktakeItemDto[];
}
