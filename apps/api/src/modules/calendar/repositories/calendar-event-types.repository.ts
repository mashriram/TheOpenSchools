import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CalendarEventType } from '../entities/calendar-event-type.entity';

@Injectable()
export class CalendarEventTypesRepository extends Repository<CalendarEventType> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(CalendarEventType, dataSource.createEntityManager());
  }

  findBySchool(schoolId: string): Promise<CalendarEventType[]> {
    return this.find({ where: { schoolId }, order: { sequenceNumber: 'ASC' } });
  }

  findByIdAndSchool(
    id: string,
    schoolId: string,
  ): Promise<CalendarEventType | null> {
    return this.findOne({ where: { id, schoolId } });
  }
}
