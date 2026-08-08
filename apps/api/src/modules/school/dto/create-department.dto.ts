import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';
import {
  DEPARTMENT_TYPES,
  type DepartmentType,
} from '@purpleschools/shared-types';

export class CreateDepartmentDto {
  @IsIn(DEPARTMENT_TYPES)
  type: DepartmentType;

  @IsString()
  @MaxLength(60)
  name: string;

  @IsString()
  @MaxLength(8)
  shortName: string;

  @IsOptional()
  @IsString()
  subjectListing?: string;

  @IsOptional()
  @IsString()
  blurb?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  logoUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sequenceNumber?: number;
}
