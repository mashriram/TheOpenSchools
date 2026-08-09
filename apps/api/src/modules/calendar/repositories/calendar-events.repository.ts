import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import {
  DataSource,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { CalendarEvent } from '../entities/calendar-event.entity';

@Injectable()
export class CalendarEventsRepository extends Repository<CalendarEvent> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(CalendarEvent, dataSource.createEntityManager());
  }

  findByCalendar(calendarId: string): Promise<CalendarEvent[]> {
    return this.find({ where: { calendarId }, order: { dateStart: 'ASC' } });
  }

  /** Only 'Confirmed' events, matching Gibbon's real default list behaviour. */
  findConfirmedByCalendarsAndDateRange(
    calendarIds: string[],
    dateStart: string,
    dateEnd: string,
  ): Promise<CalendarEvent[]> {
    if (calendarIds.length === 0) {
      return Promise.resolve([]);
    }
    return this.find({
      where: {
        calendarId: In(calendarIds),
        status: 'Confirmed',
        dateStart: LessThanOrEqual(dateEnd),
        dateEnd: MoreThanOrEqual(dateStart),
      },
      order: { dateStart: 'ASC' },
    });
  }

  /** Joins CalendarEvent -> Calendar -> SchoolYear to enforce tenant scope. */
  findByIdAndSchool(
    id: string,
    schoolId: string,
  ): Promise<CalendarEvent | null> {
    return this.createQueryBuilder('event')
      .innerJoin('event.calendar', 'calendar')
      .innerJoin('calendar.schoolYear', 'schoolYear')
      .where('event.id = :id AND schoolYear.schoolId = :schoolId', {
        id,
        schoolId,
      })
      .getOne();
  }
}
