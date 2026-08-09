import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { FinanceInvoicee } from '../entities/finance-invoicee.entity';

@Injectable()
export class FinanceInvoiceesRepository extends Repository<FinanceInvoicee> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(FinanceInvoicee, dataSource.createEntityManager());
  }

  findByStudent(studentPersonId: string): Promise<FinanceInvoicee[]> {
    return this.find({ where: { studentPersonId } });
  }

  /** FinanceInvoicee has no schoolId column; scope via the student Person. */
  findByIdAndSchool(
    id: string,
    schoolId: string,
  ): Promise<FinanceInvoicee | null> {
    return this.createQueryBuilder('invoicee')
      .innerJoin('invoicee.student', 'student')
      .where('invoicee.id = :id AND student.schoolId = :schoolId', {
        id,
        schoolId,
      })
      .getOne();
  }
}
