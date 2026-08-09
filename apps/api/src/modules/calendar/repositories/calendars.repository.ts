import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Calendar } from '../entities/calendar.entity';

@Injectable()
export class CalendarsRepository extends Repository<Calendar> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(Calendar, dataSource.createEntityManager());
  }

  findBySchoolYear(schoolYearId: string): Promise<Calendar[]> {
    return this.find({
      where: { schoolYearId },
      order: { sequenceNumber: 'ASC' },
    });
  }

  /** Calendar has no schoolId column; scope via SchoolYear. */
  findByIdAndSchool(id: string, schoolId: string): Promise<Calendar | null> {
    return this.createQueryBuilder('calendar')
      .innerJoin('calendar.schoolYear', 'schoolYear')
      .where('calendar.id = :id AND schoolYear.schoolId = :schoolId', {
        id,
        schoolId,
      })
      .getOne();
  }
}
