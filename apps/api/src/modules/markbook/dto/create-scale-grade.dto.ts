import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateScaleGradeDto {
  @IsString()
  @MaxLength(40)
  name: string;

  @IsString()
  @MaxLength(8)
  shortName: string;

  @IsInt()
  value: number;

  @IsOptional()
  @IsInt()
  sequenceNumber?: number;

  @IsOptional()
  @IsBoolean()
  lowestAcceptable?: boolean;
}
