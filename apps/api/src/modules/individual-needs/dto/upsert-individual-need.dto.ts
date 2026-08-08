import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpsertIndividualNeedDto {
  @IsOptional()
  @IsString()
  strategies?: string;

  @IsOptional()
  @IsString()
  targets?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsObject()
  customFields?: Record<string, unknown>;
}
