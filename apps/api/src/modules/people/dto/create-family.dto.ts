import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  FAMILY_STATUSES,
  type FamilyStatus,
} from '@purpleschools/shared-types';

export class CreateFamilyDto {
  @IsString()
  @MaxLength(90)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(90)
  nameAddress?: string;

  @IsOptional()
  @IsString()
  homeAddress?: string;

  @IsOptional()
  @IsIn(FAMILY_STATUSES)
  status?: FamilyStatus;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  languageHomePrimary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  languageHomeSecondary?: string;
}
