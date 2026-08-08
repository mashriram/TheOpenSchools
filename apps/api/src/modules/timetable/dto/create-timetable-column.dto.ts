import { IsString, MaxLength } from 'class-validator';

export class CreateTimetableColumnDto {
  @IsString()
  @MaxLength(30)
  name: string;

  @IsString()
  @MaxLength(12)
  shortName: string;
}
