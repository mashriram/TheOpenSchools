import { IsOptional, IsString, IsUUID } from 'class-validator';

export class AddFamilyChildDto {
  @IsUUID('4')
  personId: string;

  @IsOptional()
  @IsString()
  comment?: string;
}
