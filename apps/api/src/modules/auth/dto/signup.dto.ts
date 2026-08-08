import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  MIN_PASSWORD_LENGTH,
  SUBDOMAIN_SLUG_PATTERN,
} from '@purpleschools/shared-types';

export class SignupDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  schoolName: string;

  @IsString()
  @Matches(SUBDOMAIN_SLUG_PATTERN, {
    message:
      'subdomainSlug must be a lowercase, DNS-safe label (letters, digits, hyphens; max 63 characters)',
  })
  subdomainSlug: string;

  @IsEmail()
  @MaxLength(255)
  adminEmail: string;

  @IsString()
  @MinLength(MIN_PASSWORD_LENGTH)
  @MaxLength(255)
  adminPassword: string;

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  adminFirstName: string;

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  adminSurname: string;
}
