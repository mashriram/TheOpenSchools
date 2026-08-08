import { IsIn, IsOptional, IsUUID } from 'class-validator';
import type { ContributionType } from '../entities/individual-need-investigation-contribution.entity';

export const CONTRIBUTION_TYPES: ContributionType[] = [
  'Teacher',
  'Head of Year',
];

export class CreateContributionDto {
  @IsUUID('4')
  personId: string;

  @IsOptional()
  @IsIn(CONTRIBUTION_TYPES)
  type?: ContributionType;

  @IsOptional()
  @IsUUID('4')
  courseClassPersonId?: string;
}
