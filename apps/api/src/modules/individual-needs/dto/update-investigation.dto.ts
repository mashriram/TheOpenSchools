import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import type { IndividualNeedInvestigationStatus } from '../entities/individual-need-investigation.entity';

export const INVESTIGATION_STATUSES: IndividualNeedInvestigationStatus[] = [
  'Referral',
  'Resolved',
  'Investigation',
  'Investigation Complete',
];

export class UpdateInvestigationDto {
  @IsOptional()
  @IsIn(INVESTIGATION_STATUSES)
  status?: IndividualNeedInvestigationStatus;

  @IsOptional()
  @IsString()
  strategiesTried?: string;

  @IsOptional()
  @IsBoolean()
  parentsInformed?: boolean;

  @IsOptional()
  @IsString()
  parentsResponse?: string;

  @IsOptional()
  @IsString()
  resolutionDetails?: string;
}
