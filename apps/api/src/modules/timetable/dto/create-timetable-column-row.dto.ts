import { IsIn, IsString, Matches, MaxLength } from 'class-validator';
import type { TimetableColumnRowType } from '../entities/timetable-column-row.entity';

export const TIMETABLE_COLUMN_ROW_TYPES: TimetableColumnRowType[] = [
  'Lesson',
  'Pastoral',
  'Sport',
  'Break',
  'Service',
  'Other',
];

const TIME_PATTERN = /^\d{2}:\d{2}(:\d{2})?$/;

export class CreateTimetableColumnRowDto {
  @IsString()
  @MaxLength(12)
  name: string;

  @IsString()
  @MaxLength(4)
  shortName: string;

  @Matches(TIME_PATTERN, {
    message: 'timeStart must be in HH:MM or HH:MM:SS format',
  })
  timeStart: string;

  @Matches(TIME_PATTERN, {
    message: 'timeEnd must be in HH:MM or HH:MM:SS format',
  })
  timeEnd: string;

  @IsIn(TIMETABLE_COLUMN_ROW_TYPES)
  type: TimetableColumnRowType;
}
