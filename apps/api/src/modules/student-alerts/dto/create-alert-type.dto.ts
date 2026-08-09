import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import type { AlertTypeCategory } from '../entities/alert-type.entity';

export const ALERT_TYPE_CATEGORIES: AlertTypeCategory[] = [
  'Core',
  'Additional',
];

export class CreateAlertTypeDto {
  @IsString()
  @MaxLength(60)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  tag?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  adminOnly?: boolean;

  @IsOptional()
  @IsBoolean()
  useLevels?: boolean;

  @IsOptional()
  @IsIn(ALERT_TYPE_CATEGORIES)
  type?: AlertTypeCategory;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  colorBG?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  thresholdLow?: number;

  @IsOptional()
  @IsInt()
  thresholdMed?: number;

  @IsOptional()
  @IsInt()
  thresholdHigh?: number;

  @IsOptional()
  @IsInt()
  sequenceNumber?: number;
}
