import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpsertMarkbookEntryDto {
  @IsUUID('4')
  personId: string;

  @IsOptional()
  @IsUUID('4')
  attainmentScaleGradeId?: string;

  @IsOptional()
  @IsUUID('4')
  effortScaleGradeId?: string;

  @IsOptional()
  @IsString()
  comment?: string;
}
