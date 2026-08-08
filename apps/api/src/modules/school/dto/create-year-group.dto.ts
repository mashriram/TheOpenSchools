import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateYearGroupDto {
  @IsString()
  @MaxLength(60)
  name: string;

  @IsString()
  @MaxLength(8)
  shortName: string;

  @IsInt()
  sequenceNumber: number;

  @IsOptional()
  @IsUUID('4')
  headOfYearPersonId?: string;
}
