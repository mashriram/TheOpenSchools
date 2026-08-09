import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FinanceInvoicesRepository } from './repositories/finance-invoices.repository';
import { FinanceInvoiceFeesRepository } from './repositories/finance-invoice-fees.repository';
import { PaymentsRepository } from './repositories/payments.repository';
import { FinanceInvoiceesService } from './finance-invoicees.service';
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';
import { FinanceInvoice } from './entities/finance-invoice.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Injectable()
export class FinanceInvoicesService {
  constructor(
    private readonly invoices: FinanceInvoicesRepository,
    private readonly invoiceFees: FinanceInvoiceFeesRepository,
    private readonly payments: PaymentsRepository,
    private readonly invoicees: FinanceInvoiceesService,
    private readonly schoolYears: SchoolYearsRepository,
  ) {}

  async listForInvoicee(
    schoolId: string,
    invoiceeId: string,
  ): Promise<FinanceInvoice[]> {
    await this.invoicees.getOwned(schoolId, invoiceeId);
    return this.invoices.findByInvoicee(invoiceeId);
  }

  async create(
    schoolId: string,
    dto: CreateInvoiceDto,
  ): Promise<FinanceInvoice> {
    const schoolYear = await this.schoolYears.findOne({
      where: { id: dto.schoolYearId, schoolId },
    });
    if (!schoolYear) {
      throw new BadRequestException(
        'schoolYearId does not belong to this school',
      );
    }
    await this.invoicees.getOwned(schoolId, dto.invoiceeId);

    return this.invoices.save(
      this.invoices.create({
        schoolYearId: dto.schoolYearId,
        invoiceeId: dto.invoiceeId,
        billingScheduleId: dto.billingScheduleId ?? null,
        invoiceIssueDate: dto.invoiceIssueDate ?? null,
        invoiceDueDate: dto.invoiceDueDate ?? null,
        notes: dto.notes ?? null,
        retentionPeriodMonths: dto.retentionPeriodMonths ?? null,
      }),
    );
  }

  async update(
    schoolId: string,
    id: string,
    dto: UpdateInvoiceDto,
  ): Promise<FinanceInvoice> {
    const invoice = await this.getOwned(schoolId, id);
    Object.assign(invoice, dto);
    return this.invoices.save(invoice);
  }

  async getOwned(schoolId: string, id: string): Promise<FinanceInvoice> {
    const invoice = await this.invoices.findByIdAndSchool(id, schoolId);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    return invoice;
  }

  /**
   * The only place `paidAmount`/`status` are ever written - called after
   * every InvoiceFee or Payment mutation. `total` sums the invoice's line
   * items (a 'Discount' line's negative amount already reduces it
   * naturally); `paid` sums every non-Failure Payment (a refund's negative
   * amount already reduces it naturally). Status: a net refund (`paid <
   * 0`, or `paid == 0` with at least one actual refund among the
   * non-Failure payments - a full refund exactly cancelling out prior
   * payments must still read as 'Refunded', not silently stay 'Paid') ->
   * 'Refunded'; `paid == 0` with no refund activity at all (e.g. only a
   * Failure-status payment on file) leaves Pending/Issued/Cancelled
   * untouched; `paid >= total` (and total > 0) -> 'Paid'; otherwise, once
   * something has been paid, 'Paid - Partial'.
   */
  async recalculatePaidAmount(
    schoolId: string,
    id: string,
  ): Promise<FinanceInvoice> {
    const invoice = await this.getOwned(schoolId, id);
    const [lines, paymentRows] = await Promise.all([
      this.invoiceFees.findByInvoice(id),
      this.payments.findByInvoice(id),
    ]);

    const total = lines.reduce((sum, line) => sum + Number(line.amount), 0);
    const successfulPayments = paymentRows.filter(
      (payment) => payment.status !== 'Failure',
    );
    const paid = successfulPayments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );
    const hasRefund = successfulPayments.some(
      (payment) => Number(payment.amount) < 0,
    );

    invoice.paidAmount = paid;
    if (paid < 0 || (hasRefund && paid === 0)) {
      invoice.status = 'Refunded';
    } else if (paid === 0) {
      // Leave the current Pending/Issued/Cancelled status untouched.
    } else if (paid >= total && total > 0) {
      invoice.status = 'Paid';
    } else {
      invoice.status = 'Paid - Partial';
    }

    return this.invoices.save(invoice);
  }
}
