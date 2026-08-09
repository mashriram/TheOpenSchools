import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateFeeCategoryDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @MaxLength(6)
  shortName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
