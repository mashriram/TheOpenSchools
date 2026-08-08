import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateSpaceDto {
  @IsString()
  @MaxLength(60)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  type?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  bookable?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  capacity?: number;

  @IsOptional()
  @IsBoolean()
  hasComputer?: boolean;

  @IsOptional()
  @IsBoolean()
  hasProjector?: boolean;

  @IsOptional()
  @IsBoolean()
  hasTv?: boolean;

  @IsOptional()
  @IsBoolean()
  hasDvd?: boolean;

  @IsOptional()
  @IsBoolean()
  hasHifi?: boolean;

  @IsOptional()
  @IsBoolean()
  hasSpeakers?: boolean;

  @IsOptional()
  @IsBoolean()
  hasIwb?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  computerStudentCount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneInternal?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneExternal?: string;

  @IsOptional()
  @IsString()
  comment?: string;
}
