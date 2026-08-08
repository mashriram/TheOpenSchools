import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AttendanceLogCourseClass } from '../entities/attendance-log-course-class.entity';

@Injectable()
export class AttendanceLogCourseClassesRepository extends Repository<AttendanceLogCourseClass> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(AttendanceLogCourseClass, dataSource.createEntityManager());
  }

  findByCourseClassAndDate(
    courseClassId: string,
    date: string,
  ): Promise<AttendanceLogCourseClass | null> {
    return this.findOne({ where: { courseClassId, date } });
  }
}
