import { IsIn, IsOptional, IsString } from 'class-validator';
import type { ContributionStatus } from '../entities/individual-need-investigation-contribution.entity';

export const CONTRIBUTION_STATUSES: ContributionStatus[] = [
  'Pending',
  'Complete',
];

export class UpdateContributionDto {
  @IsOptional()
  @IsIn(CONTRIBUTION_STATUSES)
  status?: ContributionStatus;

  @IsOptional()
  @IsString()
  cognition?: string;

  @IsOptional()
  @IsString()
  memory?: string;

  @IsOptional()
  @IsString()
  selfManagement?: string;

  @IsOptional()
  @IsString()
  attention?: string;

  @IsOptional()
  @IsString()
  socialInteraction?: string;

  @IsOptional()
  @IsString()
  communication?: string;

  @IsOptional()
  @IsString()
  comment?: string;
}
