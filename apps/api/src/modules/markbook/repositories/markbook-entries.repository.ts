import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { MarkbookEntry } from '../entities/markbook-entry.entity';

@Injectable()
export class MarkbookEntriesRepository extends Repository<MarkbookEntry> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(MarkbookEntry, dataSource.createEntityManager());
  }

  findByColumn(markbookColumnId: string): Promise<MarkbookEntry[]> {
    return this.find({
      where: { markbookColumnId },
      relations: { attainmentScaleGrade: true, effortScaleGrade: true },
    });
  }

  findByColumnAndPerson(
    markbookColumnId: string,
    personId: string,
  ): Promise<MarkbookEntry | null> {
    return this.findOne({
      where: { markbookColumnId, personId },
      relations: { attainmentScaleGrade: true, effortScaleGrade: true },
    });
  }

  /**
   * Joins MarkbookEntry -> MarkbookColumn -> CourseClass -> Course to
   * enforce tenant scope, since none of the three carry their own schoolId.
   */
  findByIdAndSchool(
    id: string,
    schoolId: string,
  ): Promise<MarkbookEntry | null> {
    return this.createQueryBuilder('entry')
      .innerJoin('entry.markbookColumn', 'column')
      .innerJoin('column.courseClass', 'courseClass')
      .innerJoin('courseClass.course', 'course')
      .where('entry.id = :id AND course.schoolId = :schoolId', {
        id,
        schoolId,
      })
      .getOne();
  }
}
