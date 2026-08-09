import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  SAFEGUARDING_SEVERITY_LEVELS,
  type SafeguardingSeverityLevel,
} from '@purpleschools/shared-types';

export class CreateAlertDto {
  @IsUUID('4')
  schoolYearId: string;

  @IsUUID('4')
  personId: string;

  @IsUUID('4')
  alertTypeId: string;

  @IsOptional()
  @IsUUID('4')
  courseClassId?: string;

  @IsOptional()
  @IsIn(SAFEGUARDING_SEVERITY_LEVELS)
  level?: SafeguardingSeverityLevel;

  @IsOptional()
  @IsDateString()
  dateStart?: string;

  @IsOptional()
  @IsDateString()
  dateEnd?: string;

  @IsOptional()
  @IsString()
  comment?: string;
}
