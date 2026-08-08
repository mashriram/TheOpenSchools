import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateInvestigationDto {
  @IsUUID('4')
  schoolYearId: string;

  @IsUUID('4')
  studentPersonId: string;

  @IsDateString()
  date: string;

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  strategiesTried?: string;

  @IsOptional()
  @IsBoolean()
  parentsInformed?: boolean;
}
