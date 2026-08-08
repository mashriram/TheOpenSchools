import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { IndividualNeedInvestigation } from '../entities/individual-need-investigation.entity';

@Injectable()
export class IndividualNeedInvestigationsRepository extends Repository<IndividualNeedInvestigation> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(IndividualNeedInvestigation, dataSource.createEntityManager());
  }

  findByStudent(
    studentPersonId: string,
  ): Promise<IndividualNeedInvestigation[]> {
    return this.find({
      where: { studentPersonId },
      order: { date: 'DESC' },
    });
  }

  /** Joins IndividualNeedInvestigation -> SchoolYear to enforce tenant scope. */
  findByIdAndSchool(
    id: string,
    schoolId: string,
  ): Promise<IndividualNeedInvestigation | null> {
    return this.createQueryBuilder('investigation')
      .innerJoin('investigation.schoolYear', 'schoolYear')
      .where('investigation.id = :id AND schoolYear.schoolId = :schoolId', {
        id,
        schoolId,
      })
      .getOne();
  }
}
