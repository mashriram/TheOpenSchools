import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateFeeDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @MaxLength(6)
  shortName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsUUID('4')
  feeCategoryId: string;

  @IsNumber()
  @Min(0)
  amount: number;
}
