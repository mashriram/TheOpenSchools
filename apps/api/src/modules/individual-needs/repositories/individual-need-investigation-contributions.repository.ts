import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { IndividualNeedInvestigationContribution } from '../entities/individual-need-investigation-contribution.entity';

@Injectable()
export class IndividualNeedInvestigationContributionsRepository extends Repository<IndividualNeedInvestigationContribution> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(
      IndividualNeedInvestigationContribution,
      dataSource.createEntityManager(),
    );
  }

  findByInvestigation(
    investigationId: string,
  ): Promise<IndividualNeedInvestigationContribution[]> {
    return this.find({ where: { investigationId } });
  }

  /**
   * Joins IndividualNeedInvestigationContribution -> Investigation ->
   * SchoolYear to enforce tenant scope.
   */
  findByIdAndSchool(
    id: string,
    schoolId: string,
  ): Promise<IndividualNeedInvestigationContribution | null> {
    return this.createQueryBuilder('contribution')
      .innerJoin('contribution.investigation', 'investigation')
      .innerJoin('investigation.schoolYear', 'schoolYear')
      .where('contribution.id = :id AND schoolYear.schoolId = :schoolId', {
        id,
        schoolId,
      })
      .getOne();
  }
}
