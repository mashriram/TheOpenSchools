import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TimetableDayDate } from '../entities/timetable-day-date.entity';

@Injectable()
export class TimetableDayDatesRepository extends Repository<TimetableDayDate> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(TimetableDayDate, dataSource.createEntityManager());
  }

  findByDay(timetableDayId: string): Promise<TimetableDayDate[]> {
    return this.find({ where: { timetableDayId }, order: { date: 'ASC' } });
  }

  findByIdAndSchool(
    id: string,
    schoolId: string,
  ): Promise<TimetableDayDate | null> {
    return this.createQueryBuilder('dayDate')
      .innerJoin('dayDate.timetableDay', 'day')
      .innerJoin('day.timetable', 'timetable')
      .where('dayDate.id = :id', { id })
      .andWhere('timetable.schoolId = :schoolId', { schoolId })
      .getOne();
  }

  /**
   * "A date resolves to exactly one Day within a given Timetable" is
   * enforced here, not at the DB layer - TypeORM can't express a unique
   * constraint "per parent's parent" cleanly for TimetableDayDate ->
   * TimetableDay -> Timetable.
   */
  async findConflictingMapping(
    timetableId: string,
    date: string,
    excludeDayDateId?: string,
  ): Promise<TimetableDayDate | null> {
    const qb = this.createQueryBuilder('dayDate')
      .innerJoin('dayDate.timetableDay', 'day')
      .where('day.timetableId = :timetableId', { timetableId })
      .andWhere('dayDate.date = :date', { date });
    if (excludeDayDateId) {
      qb.andWhere('dayDate.id != :excludeDayDateId', { excludeDayDateId });
    }
    return qb.getOne();
  }

  findByTimetableAndDateRange(
    timetableId: string,
    dateStart: string,
    dateEnd: string,
  ): Promise<TimetableDayDate[]> {
    return this.createQueryBuilder('dayDate')
      .innerJoinAndSelect('dayDate.timetableDay', 'day')
      .where('day.timetableId = :timetableId', { timetableId })
      .andWhere('dayDate.date BETWEEN :dateStart AND :dateEnd', {
        dateStart,
        dateEnd,
      })
      .orderBy('dayDate.date', 'ASC')
      .getMany();
  }
}
