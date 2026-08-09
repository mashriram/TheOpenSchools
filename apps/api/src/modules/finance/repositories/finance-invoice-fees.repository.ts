import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { FinanceInvoiceFee } from '../entities/finance-invoice-fee.entity';

@Injectable()
export class FinanceInvoiceFeesRepository extends Repository<FinanceInvoiceFee> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(FinanceInvoiceFee, dataSource.createEntityManager());
  }

  findByInvoice(invoiceId: string): Promise<FinanceInvoiceFee[]> {
    return this.find({
      where: { invoiceId },
      order: { sequenceNumber: 'ASC' },
    });
  }

  /** Joins FinanceInvoiceFee -> FinanceInvoice -> SchoolYear to enforce tenant scope. */
  findByIdAndSchool(
    id: string,
    schoolId: string,
  ): Promise<FinanceInvoiceFee | null> {
    return this.createQueryBuilder('line')
      .innerJoin('line.invoice', 'invoice')
      .innerJoin('invoice.schoolYear', 'schoolYear')
      .where('line.id = :id AND schoolYear.schoolId = :schoolId', {
        id,
        schoolId,
      })
      .getOne();
  }
}
