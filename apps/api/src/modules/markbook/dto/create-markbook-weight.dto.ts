import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMarkbookWeightDto {
  @IsString()
  @MaxLength(40)
  name: string;

  @IsNumber()
  @Min(0)
  weighting: number;

  @IsOptional()
  @IsInt()
  sequenceNumber?: number;
}
