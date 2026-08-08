import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TimetableDaysRepository } from './repositories/timetable-days.repository';
import { TimetableDayDatesRepository } from './repositories/timetable-day-dates.repository';
import { TimetablesService } from './timetables.service';
import { TimetableColumnsService } from './timetable-columns.service';
import { TimetableDay } from './entities/timetable-day.entity';
import { TimetableDayDate } from './entities/timetable-day-date.entity';
import { CreateTimetableDayDto } from './dto/create-timetable-day.dto';
import { UpdateTimetableDayDto } from './dto/update-timetable-day.dto';

@Injectable()
export class TimetableDaysService {
  constructor(
    private readonly days: TimetableDaysRepository,
    private readonly dayDates: TimetableDayDatesRepository,
    private readonly timetables: TimetablesService,
    private readonly columns: TimetableColumnsService,
  ) {}

  list(timetableId: string): Promise<TimetableDay[]> {
    return this.days.findByTimetable(timetableId);
  }

  async create(
    schoolId: string,
    timetableId: string,
    dto: CreateTimetableDayDto,
  ): Promise<TimetableDay> {
    await this.timetables.getOwned(schoolId, timetableId);
    await this.columns.getOwned(schoolId, dto.timetableColumnId);
    return this.days.save(this.days.create({ timetableId, ...dto }));
  }

  async update(
    schoolId: string,
    id: string,
    dto: UpdateTimetableDayDto,
  ): Promise<TimetableDay> {
    const day = await this.getOwned(schoolId, id);
    if (dto.timetableColumnId) {
      await this.columns.getOwned(schoolId, dto.timetableColumnId);
    }
    Object.assign(day, dto);
    return this.days.save(day);
  }

  async remove(schoolId: string, id: string): Promise<void> {
    const day = await this.getOwned(schoolId, id);
    await this.days.remove(day);
  }

  async getOwned(schoolId: string, id: string): Promise<TimetableDay> {
    const day = await this.days.findByIdAndSchool(id, schoolId);
    if (!day) {
      throw new NotFoundException('Timetable day not found');
    }
    return day;
  }

  listDates(dayId: string): Promise<TimetableDayDate[]> {
    return this.dayDates.findByDay(dayId);
  }

  async mapDate(
    schoolId: string,
    timetableDayId: string,
    date: string,
  ): Promise<TimetableDayDate> {
    const day = await this.getOwned(schoolId, timetableDayId);
    const conflict = await this.dayDates.findConflictingMapping(
      day.timetableId,
      date,
    );
    if (conflict) {
      throw new ConflictException(
        `${date} is already mapped to another day within this timetable`,
      );
    }
    return this.dayDates.save(this.dayDates.create({ timetableDayId, date }));
  }

  async unmapDate(schoolId: string, dayDateId: string): Promise<void> {
    const dayDate = await this.dayDates.findByIdAndSchool(dayDateId, schoolId);
    if (!dayDate) {
      throw new NotFoundException('Timetable day date mapping not found');
    }
    await this.dayDates.remove(dayDate);
  }
}
