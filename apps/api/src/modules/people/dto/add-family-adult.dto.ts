import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class AddFamilyAdultDto {
  @IsUUID('4')
  personId: string;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsBoolean()
  childDataAccess?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  contactPriority?: number;

  @IsOptional()
  @IsBoolean()
  contactCall?: boolean;

  @IsOptional()
  @IsBoolean()
  contactSms?: boolean;

  @IsOptional()
  @IsBoolean()
  contactEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  contactMail?: boolean;
}
