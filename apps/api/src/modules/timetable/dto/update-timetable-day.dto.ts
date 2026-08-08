import { PartialType } from '@nestjs/mapped-types';
import { CreateTimetableDayDto } from './create-timetable-day.dto';

export class UpdateTimetableDayDto extends PartialType(CreateTimetableDayDto) {}
