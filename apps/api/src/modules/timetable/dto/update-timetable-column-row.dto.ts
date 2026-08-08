import { PartialType } from '@nestjs/mapped-types';
import { CreateTimetableColumnRowDto } from './create-timetable-column-row.dto';

export class UpdateTimetableColumnRowDto extends PartialType(
  CreateTimetableColumnRowDto,
) {}
