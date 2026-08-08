import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateFormGroupDto {
  @IsUUID('4')
  schoolYearId: string;

  @IsString()
  @MaxLength(60)
  name: string;

  @IsString()
  @MaxLength(8)
  shortName: string;

  @IsOptional()
  @IsUUID('4')
  spaceId?: string;

  @IsOptional()
  @IsUUID('4')
  nextFormGroupId?: string;

  @IsOptional()
  @IsBoolean()
  attendance?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string;
}
