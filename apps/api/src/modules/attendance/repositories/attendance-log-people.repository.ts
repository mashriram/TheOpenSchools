import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Between, DataSource, Repository } from 'typeorm';
import { AttendanceLogPerson } from '../entities/attendance-log-person.entity';

@Injectable()
export class AttendanceLogPeopleRepository extends Repository<AttendanceLogPerson> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(AttendanceLogPerson, dataSource.createEntityManager());
  }

  findByPersonAndDateRange(
    personId: string,
    dateStart: string,
    dateEnd: string,
  ): Promise<AttendanceLogPerson[]> {
    return this.find({
      where: { personId, date: Between(dateStart, dateEnd) },
      relations: { attendanceCode: true },
      order: { date: 'ASC' },
    });
  }

  findByFormGroupAndDate(
    formGroupId: string,
    date: string,
  ): Promise<AttendanceLogPerson[]> {
    return this.find({ where: { formGroupId, date } });
  }

  findByCourseClassAndDate(
    courseClassId: string,
    date: string,
  ): Promise<AttendanceLogPerson[]> {
    return this.find({ where: { courseClassId, date } });
  }

  findByPersonFormGroupAndDate(
    personId: string,
    formGroupId: string,
    date: string,
  ): Promise<AttendanceLogPerson | null> {
    return this.findOne({ where: { personId, formGroupId, date } });
  }

  findByPersonCourseClassAndDate(
    personId: string,
    courseClassId: string,
    date: string,
  ): Promise<AttendanceLogPerson | null> {
    return this.findOne({ where: { personId, courseClassId, date } });
  }

  /** Joins AttendanceLogPerson -> Person to enforce tenant scope. */
  findByIdAndSchool(
    id: string,
    schoolId: string,
  ): Promise<AttendanceLogPerson | null> {
    return this.createQueryBuilder('log')
      .innerJoin('log.person', 'person')
      .where('log.id = :id AND person.schoolId = :schoolId', { id, schoolId })
      .getOne();
  }
}
