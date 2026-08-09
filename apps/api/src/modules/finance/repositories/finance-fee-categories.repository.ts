import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { FinanceFeeCategory } from '../entities/finance-fee-category.entity';

@Injectable()
export class FinanceFeeCategoriesRepository extends Repository<FinanceFeeCategory> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(FinanceFeeCategory, dataSource.createEntityManager());
  }

  findBySchool(schoolId: string): Promise<FinanceFeeCategory[]> {
    return this.find({ where: { schoolId }, order: { name: 'ASC' } });
  }

  findByIdAndSchool(
    id: string,
    schoolId: string,
  ): Promise<FinanceFeeCategory | null> {
    return this.findOne({ where: { id, schoolId } });
  }
}
