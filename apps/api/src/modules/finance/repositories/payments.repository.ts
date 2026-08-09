import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Payment } from '../entities/payment.entity';

@Injectable()
export class PaymentsRepository extends Repository<Payment> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(Payment, dataSource.createEntityManager());
  }

  findByInvoice(invoiceId: string): Promise<Payment[]> {
    return this.find({ where: { invoiceId }, order: { occurredAt: 'ASC' } });
  }

  findByPaymentToken(paymentToken: string): Promise<Payment | null> {
    return this.findOne({ where: { paymentToken } });
  }

  /** Joins Payment -> FinanceInvoice -> SchoolYear to enforce tenant scope. */
  findByIdAndSchool(id: string, schoolId: string): Promise<Payment | null> {
    return this.createQueryBuilder('payment')
      .innerJoin('payment.invoice', 'invoice')
      .innerJoin('invoice.schoolYear', 'schoolYear')
      .where('payment.id = :id AND schoolYear.schoolId = :schoolId', {
        id,
        schoolId,
      })
      .getOne();
  }
}
