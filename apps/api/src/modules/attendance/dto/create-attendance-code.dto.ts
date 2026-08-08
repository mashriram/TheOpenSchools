import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import type {
  AttendanceCodeType,
  AttendanceDirection,
  AttendanceScope,
} from '../entities/attendance-code.entity';

export const ATTENDANCE_CODE_TYPES: AttendanceCodeType[] = [
  'Core',
  'Additional',
];
export const ATTENDANCE_DIRECTIONS: AttendanceDirection[] = ['In', 'Out'];
export const ATTENDANCE_SCOPES: AttendanceScope[] = [
  'Onsite',
  'Onsite - Late',
  'Offsite',
  'Offsite - Left',
  'Offsite - Late',
];

export class CreateAttendanceCodeDto {
  @IsString()
  @MaxLength(30)
  name: string;

  @IsString()
  @MaxLength(4)
  shortName: string;

  @IsOptional()
  @IsIn(ATTENDANCE_CODE_TYPES)
  type?: AttendanceCodeType;

  @IsIn(ATTENDANCE_DIRECTIONS)
  direction: AttendanceDirection;

  @IsIn(ATTENDANCE_SCOPES)
  scope: AttendanceScope;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  reportable?: boolean;

  @IsOptional()
  @IsBoolean()
  allowFutureDate?: boolean;

  @IsOptional()
  @IsBoolean()
  prefill?: boolean;

  @IsOptional()
  @IsInt()
  sequenceNumber?: number;
}
