import { IsString, MaxLength } from 'class-validator';

export class RecordConsentDto {
  @IsString()
  @MaxLength(20)
  policyVersion: string;
}
