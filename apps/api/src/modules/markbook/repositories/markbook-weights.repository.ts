import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { MarkbookWeight } from '../entities/markbook-weight.entity';

@Injectable()
export class MarkbookWeightsRepository extends Repository<MarkbookWeight> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(MarkbookWeight, dataSource.createEntityManager());
  }

  findByCourseClass(courseClassId: string): Promise<MarkbookWeight[]> {
    return this.find({
      where: { courseClassId },
      order: { sequenceNumber: 'ASC' },
    });
  }

  /** Joins MarkbookWeight -> CourseClass -> Course to enforce tenant scope. */
  findByIdAndSchool(
    id: string,
    schoolId: string,
  ): Promise<MarkbookWeight | null> {
    return this.createQueryBuilder('weight')
      .innerJoin('weight.courseClass', 'courseClass')
      .innerJoin('courseClass.course', 'course')
      .where('weight.id = :id AND course.schoolId = :schoolId', {
        id,
        schoolId,
      })
      .getOne();
  }
}
