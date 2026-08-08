import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TimetableDay } from '../entities/timetable-day.entity';

@Injectable()
export class TimetableDaysRepository extends Repository<TimetableDay> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(TimetableDay, dataSource.createEntityManager());
  }

  findByTimetable(timetableId: string): Promise<TimetableDay[]> {
    return this.find({ where: { timetableId } });
  }

  findByIdAndSchool(
    id: string,
    schoolId: string,
  ): Promise<TimetableDay | null> {
    return this.createQueryBuilder('day')
      .innerJoin('day.timetable', 'timetable')
      .where('day.id = :id', { id })
      .andWhere('timetable.schoolId = :schoolId', { schoolId })
      .getOne();
  }
}
