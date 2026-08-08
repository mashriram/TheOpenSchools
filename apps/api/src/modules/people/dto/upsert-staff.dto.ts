import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';

export class UpsertStaffDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  initials?: string;

  @IsOptional()
  @IsString()
  @MaxLength(90)
  jobTitle?: string;

  @IsOptional()
  @IsBoolean()
  firstAidQualified?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(90)
  firstAidQualification?: string;

  @IsOptional()
  @IsDateString()
  firstAidExpiry?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  countryOfOrigin?: string;

  @IsOptional()
  @IsString()
  qualifications?: string;

  @IsOptional()
  @IsString()
  biography?: string;

  @IsOptional()
  @IsBoolean()
  coverageExclude?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  coveragePriority?: number;
}
