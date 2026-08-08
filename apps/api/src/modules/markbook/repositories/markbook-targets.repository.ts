import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { MarkbookTarget } from '../entities/markbook-target.entity';

@Injectable()
export class MarkbookTargetsRepository extends Repository<MarkbookTarget> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(MarkbookTarget, dataSource.createEntityManager());
  }

  findByCourseClass(courseClassId: string): Promise<MarkbookTarget[]> {
    return this.find({ where: { courseClassId } });
  }

  findByCourseClassAndPerson(
    courseClassId: string,
    personId: string,
  ): Promise<MarkbookTarget | null> {
    return this.findOne({
      where: { courseClassId, personId },
      relations: { targetScaleGrade: true },
    });
  }

  /** Joins MarkbookTarget -> CourseClass -> Course to enforce tenant scope. */
  findByIdAndSchool(
    id: string,
    schoolId: string,
  ): Promise<MarkbookTarget | null> {
    return this.createQueryBuilder('target')
      .innerJoin('target.courseClass', 'courseClass')
      .innerJoin('courseClass.course', 'course')
      .where('target.id = :id AND course.schoolId = :schoolId', {
        id,
        schoolId,
      })
      .getOne();
  }
}
