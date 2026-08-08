import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CourseClassPerson } from '../entities/course-class-person.entity';

@Injectable()
export class CourseClassPeopleRepository extends Repository<CourseClassPerson> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(CourseClassPerson, dataSource.createEntityManager());
  }

  findByClass(courseClassId: string): Promise<CourseClassPerson[]> {
    return this.find({ where: { courseClassId } });
  }

  findByClassAndPerson(
    courseClassId: string,
    personId: string,
  ): Promise<CourseClassPerson | null> {
    return this.findOne({ where: { courseClassId, personId } });
  }

  /**
   * Joins CourseClassPerson -> CourseClass -> Course to enforce tenant scope,
   * since neither CourseClassPerson nor CourseClass carries its own schoolId.
   */
  findByIdAndSchool(
    id: string,
    schoolId: string,
  ): Promise<CourseClassPerson | null> {
    return this.createQueryBuilder('enrolment')
      .innerJoin('enrolment.courseClass', 'courseClass')
      .innerJoin('courseClass.course', 'course')
      .where('enrolment.id = :id AND course.schoolId = :schoolId', {
        id,
        schoolId,
      })
      .getOne();
  }
}
