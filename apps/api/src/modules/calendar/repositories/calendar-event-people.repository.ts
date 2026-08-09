import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { CalendarEventPerson } from '../entities/calendar-event-person.entity';

@Injectable()
export class CalendarEventPeopleRepository extends Repository<CalendarEventPerson> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(CalendarEventPerson, dataSource.createEntityManager());
  }

  findByEvent(eventId: string): Promise<CalendarEventPerson[]> {
    return this.find({ where: { eventId } });
  }

  /** Which of the given events this person actually participates in. */
  findParticipantEventIds(
    personId: string,
    eventIds: string[],
  ): Promise<string[]> {
    if (eventIds.length === 0) {
      return Promise.resolve([]);
    }
    return this.find({ where: { personId, eventId: In(eventIds) } }).then(
      (rows) => rows.map((row) => row.eventId),
    );
  }
}
