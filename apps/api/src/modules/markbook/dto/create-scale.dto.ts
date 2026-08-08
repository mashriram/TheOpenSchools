import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateScaleDto {
  @IsString()
  @MaxLength(60)
  name: string;

  @IsString()
  @MaxLength(16)
  shortName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
