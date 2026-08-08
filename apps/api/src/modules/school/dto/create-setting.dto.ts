import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSettingDto {
  @IsString()
  @MaxLength(40)
  scope: string;

  @IsString()
  @MaxLength(60)
  name: string;

  @IsString()
  @MaxLength(120)
  nameDisplay: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  value?: string;
}
