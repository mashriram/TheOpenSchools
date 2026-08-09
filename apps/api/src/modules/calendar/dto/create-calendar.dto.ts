import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateCalendarDto {
  @IsString()
  @MaxLength(60)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(7)
  color?: string;

  @IsOptional()
  @IsBoolean()
  public?: boolean;

  @IsOptional()
  @IsBoolean()
  viewableStaff?: boolean;

  @IsOptional()
  @IsBoolean()
  viewableStudents?: boolean;

  @IsOptional()
  @IsBoolean()
  viewableParents?: boolean;

  @IsOptional()
  @IsBoolean()
  viewableOther?: boolean;

  @IsOptional()
  @IsBoolean()
  viewableParticipants?: boolean;

  @IsOptional()
  @IsBoolean()
  editableStaff?: boolean;

  @IsOptional()
  @IsInt()
  sequenceNumber?: number;
}
