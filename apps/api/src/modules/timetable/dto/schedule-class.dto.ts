import { IsOptional, IsUUID } from 'class-validator';

export class ScheduleClassDto {
  @IsUUID('4')
  timetableColumnRowId: string;

  @IsUUID('4')
  timetableDayId: string;

  @IsUUID('4')
  courseClassId: string;

  @IsOptional()
  @IsUUID('4')
  spaceId?: string;
}
