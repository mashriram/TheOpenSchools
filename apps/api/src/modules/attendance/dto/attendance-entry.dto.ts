import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class AttendanceEntryDto {
  @IsUUID('4')
  personId: string;

  @IsUUID('4')
  attendanceCodeId: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  comment?: string;
}
