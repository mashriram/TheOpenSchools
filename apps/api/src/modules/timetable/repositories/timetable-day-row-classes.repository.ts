import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { TimetableDayRowClass } from '../entities/timetable-day-row-class.entity';

@Injectable()
export class TimetableDayRowClassesRepository extends Repository<TimetableDayRowClass> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(TimetableDayRowClass, dataSource.createEntityManager());
  }

  findByCourseClass(courseClassId: string): Promise<TimetableDayRowClass[]> {
    return this.find({
      where: { courseClassId },
      relations: { timetableColumnRow: true, space: true },
    });
  }

  /** Used by TimetableReadModelService to resolve one or more Days' scheduled classes. */
  findByDayIds(timetableDayIds: string[]): Promise<TimetableDayRowClass[]> {
    if (timetableDayIds.length === 0) {
      return Promise.resolve([]);
    }
    return this.find({
      where: { timetableDayId: In(timetableDayIds) },
      relations: { timetableColumnRow: true, courseClass: true, space: true },
    });
  }

  findByIdAndSchool(
    id: string,
    schoolId: string,
  ): Promise<TimetableDayRowClass | null> {
    return this.createQueryBuilder('drc')
      .innerJoin('drc.timetableDay', 'day')
      .innerJoin('day.timetable', 'timetable')
      .where('drc.id = :id', { id })
      .andWhere('timetable.schoolId = :schoolId', { schoolId })
      .getOne();
  }
}
