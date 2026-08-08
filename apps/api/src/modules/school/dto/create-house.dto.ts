import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateHouseDto {
  @IsString()
  @MaxLength(60)
  name: string;

  @IsString()
  @MaxLength(8)
  shortName: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  logoUrl?: string;
}
