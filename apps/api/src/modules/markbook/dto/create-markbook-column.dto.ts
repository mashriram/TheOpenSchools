import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateMarkbookColumnDto {
  @IsString()
  @MaxLength(60)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  sequenceNumber?: number;

  @IsOptional()
  @IsBoolean()
  attainmentEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  effortEnabled?: boolean;

  @IsOptional()
  @IsUUID('4')
  scaleIdAttainment?: string;

  @IsOptional()
  @IsUUID('4')
  scaleIdEffort?: string;

  @IsOptional()
  @IsBoolean()
  viewableStudents?: boolean;

  @IsOptional()
  @IsBoolean()
  viewableParents?: boolean;

  @IsOptional()
  @IsBoolean()
  complete?: boolean;

  @IsOptional()
  @IsDateString()
  completeDate?: string;
}
