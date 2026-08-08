import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { MarkbookColumn } from '../entities/markbook-column.entity';

@Injectable()
export class MarkbookColumnsRepository extends Repository<MarkbookColumn> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(MarkbookColumn, dataSource.createEntityManager());
  }

  findByCourseClass(courseClassId: string): Promise<MarkbookColumn[]> {
    return this.find({
      where: { courseClassId },
      order: { sequenceNumber: 'ASC' },
    });
  }

  /**
   * MarkbookColumn has no schoolId column of its own - tenant scope is
   * enforced via an explicit join through CourseClass -> Course -> School,
   * per this codebase's QueryBuilder tenant-scoping rule.
   */
  findByIdAndSchool(
    id: string,
    schoolId: string,
  ): Promise<MarkbookColumn | null> {
    return this.createQueryBuilder('column')
      .innerJoin('column.courseClass', 'courseClass')
      .innerJoin('courseClass.course', 'course')
      .where('column.id = :id AND course.schoolId = :schoolId', {
        id,
        schoolId,
      })
      .getOne();
  }
}
