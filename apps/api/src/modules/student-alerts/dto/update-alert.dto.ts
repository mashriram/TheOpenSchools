import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';
import {
  SAFEGUARDING_SEVERITY_LEVELS,
  type SafeguardingSeverityLevel,
} from '@purpleschools/shared-types';
import type { AlertStatus } from '../entities/alert.entity';

export const ALERT_STATUSES: AlertStatus[] = [
  'Pending',
  'Approved',
  'Declined',
  'Cancelled',
];

export class UpdateAlertDto {
  @IsOptional()
  @IsIn(ALERT_STATUSES)
  status?: AlertStatus;

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

  @IsOptional()
  @IsString()
  notesStatus?: string;
}
