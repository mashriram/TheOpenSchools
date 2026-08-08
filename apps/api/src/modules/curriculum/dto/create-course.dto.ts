import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCourseDto {
  @IsUUID('4')
  schoolYearId: string;

  @IsOptional()
  @IsUUID('4')
  departmentId?: string;

  @IsString()
  @MaxLength(60)
  name: string;

  @IsString()
  @MaxLength(16)
  shortName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  includeInCurriculumMaps?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sequenceNumber?: number;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  yearGroupIds?: string[];
}
