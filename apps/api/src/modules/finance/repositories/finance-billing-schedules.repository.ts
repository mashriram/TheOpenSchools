import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { FinanceBillingSchedule } from '../entities/finance-billing-schedule.entity';

@Injectable()
export class FinanceBillingSchedulesRepository extends Repository<FinanceBillingSchedule> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(FinanceBillingSchedule, dataSource.createEntityManager());
  }

  findBySchoolYear(schoolYearId: string): Promise<FinanceBillingSchedule[]> {
    return this.find({ where: { schoolYearId }, order: { name: 'ASC' } });
  }

  findByIdAndSchool(
    id: string,
    schoolId: string,
  ): Promise<FinanceBillingSchedule | null> {
    return this.createQueryBuilder('schedule')
      .innerJoin('schedule.schoolYear', 'schoolYear')
      .where('schedule.id = :id AND schoolYear.schoolId = :schoolId', {
        id,
        schoolId,
      })
      .getOne();
  }
}
