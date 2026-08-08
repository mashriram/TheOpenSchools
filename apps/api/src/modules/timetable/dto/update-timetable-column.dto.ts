import { PartialType } from '@nestjs/mapped-types';
import { CreateTimetableColumnDto } from './create-timetable-column.dto';

export class UpdateTimetableColumnDto extends PartialType(
  CreateTimetableColumnDto,
) {}
