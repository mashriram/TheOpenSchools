import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { FinanceInvoice } from '../entities/finance-invoice.entity';

@Injectable()
export class FinanceInvoicesRepository extends Repository<FinanceInvoice> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(FinanceInvoice, dataSource.createEntityManager());
  }

  findByInvoicee(invoiceeId: string): Promise<FinanceInvoice[]> {
    return this.find({ where: { invoiceeId }, order: { createdAt: 'DESC' } });
  }

  /** FinanceInvoice has no schoolId column; scope via SchoolYear. */
  findByIdAndSchool(
    id: string,
    schoolId: string,
  ): Promise<FinanceInvoice | null> {
    return this.createQueryBuilder('invoice')
      .innerJoin('invoice.schoolYear', 'schoolYear')
      .where('invoice.id = :id AND schoolYear.schoolId = :schoolId', {
        id,
        schoolId,
      })
      .getOne();
  }
}
