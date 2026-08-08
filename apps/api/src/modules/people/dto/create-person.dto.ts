import {
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  PERSON_GENDERS,
  PERSON_STATUSES,
  type PersonGender,
  type PersonStatus,
} from '@purpleschools/shared-types';

/**
 * A practical subset of Person's full 1:1-parity column list (M4) - covers
 * what an admin actually fills in when adding someone to the directory, not
 * every column that exists. Fields not listed here keep their entity
 * defaults and can be set later via PATCH.
 */
export class CreatePersonDto {
  @IsString()
  @MaxLength(60)
  surname: string;

  @IsString()
  @MaxLength(60)
  firstName: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  preferredName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  title?: string;

  @IsOptional()
  @IsIn(PERSON_GENDERS)
  gender?: PersonGender;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  emailAlternate?: string;

  @IsOptional()
  @IsIn(PERSON_STATUSES)
  status?: PersonStatus;

  @IsOptional()
  @IsUUID('4')
  houseId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  studentIdNumber?: string;
}
