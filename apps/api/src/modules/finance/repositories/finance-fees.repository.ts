import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { FinanceFee } from '../entities/finance-fee.entity';

@Injectable()
export class FinanceFeesRepository extends Repository<FinanceFee> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(FinanceFee, dataSource.createEntityManager());
  }

  findBySchoolYear(schoolYearId: string): Promise<FinanceFee[]> {
    return this.find({ where: { schoolYearId }, order: { name: 'ASC' } });
  }

  /** FinanceFee has no schoolId column; scope via SchoolYear. */
  findByIdAndSchool(id: string, schoolId: string): Promise<FinanceFee | null> {
    return this.createQueryBuilder('fee')
      .innerJoin('fee.schoolYear', 'schoolYear')
      .where('fee.id = :id AND schoolYear.schoolId = :schoolId', {
        id,
        schoolId,
      })
      .getOne();
  }
}
