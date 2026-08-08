import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateTimetableDto {
  @IsUUID('4')
  schoolYearId: string;

  @IsString()
  @MaxLength(30)
  name: string;

  @IsString()
  @MaxLength(12)
  shortName: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  yearGroupIds?: string[];
}
