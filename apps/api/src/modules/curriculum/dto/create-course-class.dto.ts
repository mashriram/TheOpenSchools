import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateCourseClassDto {
  @IsString()
  @MaxLength(30)
  name: string;

  @IsString()
  @MaxLength(16)
  shortName: string;

  @IsOptional()
  @IsBoolean()
  reportable?: boolean;

  @IsOptional()
  @IsBoolean()
  takesAttendance?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  enrolmentMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  enrolmentMax?: number;
}
