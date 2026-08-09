import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CalendarEditor } from '../entities/calendar-editor.entity';

@Injectable()
export class CalendarEditorsRepository extends Repository<CalendarEditor> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(CalendarEditor, dataSource.createEntityManager());
  }

  findByCalendar(calendarId: string): Promise<CalendarEditor[]> {
    return this.find({ where: { calendarId } });
  }

  findByCalendarAndPerson(
    calendarId: string,
    personId: string,
  ): Promise<CalendarEditor | null> {
    return this.findOne({ where: { calendarId, personId } });
  }
}
