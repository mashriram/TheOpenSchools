import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CourseClass } from '../entities/course-class.entity';

@Injectable()
export class CourseClassesRepository extends Repository<CourseClass> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(CourseClass, dataSource.createEntityManager());
  }

  /**
   * CourseClass has no schoolId column of its own - it belongs to Course,
   * which belongs to School - so tenant scope is enforced here via an
   * explicit join rather than an implicit relation, per this codebase's
   * QueryBuilder tenant-scoping rule.
   */
  findByCourseAndSchool(
    courseId: string,
    schoolId: string,
  ): Promise<CourseClass[]> {
    return this.createQueryBuilder('courseClass')
      .innerJoin('courseClass.course', 'course')
      .where(
        'courseClass.courseId = :courseId AND course.schoolId = :schoolId',
        {
          courseId,
          schoolId,
        },
      )
      .orderBy('courseClass.name', 'ASC')
      .getMany();
  }

  findByIdAndSchool(id: string, schoolId: string): Promise<CourseClass | null> {
    return this.createQueryBuilder('courseClass')
      .innerJoin('courseClass.course', 'course')
      .where('courseClass.id = :id AND course.schoolId = :schoolId', {
        id,
        schoolId,
      })
      .getOne();
  }
}
