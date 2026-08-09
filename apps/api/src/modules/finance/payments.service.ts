import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentsRepository } from './repositories/payments.repository';
import { FinanceInvoicesService } from './finance-invoices.service';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';

/**
 * Admin-recorded payments and refunds (cash, cheque, bank transfer, or a
 * manually-recorded gateway refund) - see Payment's doc comment for why a
 * refund is a dedicated negative-amount row, and StripeCheckoutService for
 * the online-payment path, which creates its own Payment rows directly
 * from a verified webhook event rather than through this service.
 */
@Injectable()
export class PaymentsService {
  constructor(
    private readonly payments: PaymentsRepository,
    private readonly invoices: FinanceInvoicesService,
  ) {}

  async list(schoolId: string, invoiceId: string): Promise<Payment[]> {
    await this.invoices.getOwned(schoolId, invoiceId);
    return this.payments.findByInvoice(invoiceId);
  }

  async record(
    schoolId: string,
    invoiceId: string,
    recorderPersonId: string,
    dto: CreatePaymentDto,
  ): Promise<Payment> {
    await this.invoices.getOwned(schoolId, invoiceId);

    const payment = await this.payments.save(
      this.payments.create({
        invoiceId,
        recorderPersonId,
        type: dto.type ?? 'Manual',
        status: dto.status ?? 'Complete',
        amount: dto.amount,
        gateway: dto.gateway ?? null,
        paymentToken: dto.paymentToken ?? null,
        paymentTransactionId: dto.paymentTransactionId ?? null,
        paymentReceiptId: dto.paymentReceiptId ?? null,
        occurredAt: new Date(),
      }),
    );
    await this.invoices.recalculatePaidAmount(schoolId, invoiceId);
    return payment;
  }

  async getOwned(schoolId: string, id: string): Promise<Payment> {
    const payment = await this.payments.findByIdAndSchool(id, schoolId);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }
}
