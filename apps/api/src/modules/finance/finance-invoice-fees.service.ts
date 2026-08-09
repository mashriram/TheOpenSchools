import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FinanceInvoiceFeesRepository } from './repositories/finance-invoice-fees.repository';
import { FinanceInvoicesService } from './finance-invoices.service';
import { FinanceFeesService } from './finance-fees.service';
import { FinanceFeeCategoriesService } from './finance-fee-categories.service';
import { FinanceInvoiceFee } from './entities/finance-invoice-fee.entity';
import { CreateInvoiceFeeDto } from './dto/create-invoice-fee.dto';

@Injectable()
export class FinanceInvoiceFeesService {
  constructor(
    private readonly invoiceFees: FinanceInvoiceFeesRepository,
    private readonly invoices: FinanceInvoicesService,
    private readonly fees: FinanceFeesService,
    private readonly feeCategories: FinanceFeeCategoriesService,
  ) {}

  async list(
    schoolId: string,
    invoiceId: string,
  ): Promise<FinanceInvoiceFee[]> {
    await this.invoices.getOwned(schoolId, invoiceId);
    return this.invoiceFees.findByInvoice(invoiceId);
  }

  async create(
    schoolId: string,
    invoiceId: string,
    dto: CreateInvoiceFeeDto,
  ): Promise<FinanceInvoiceFee> {
    await this.invoices.getOwned(schoolId, invoiceId);
    if (dto.feeId) {
      await this.fees.getOwned(schoolId, dto.feeId);
    }
    if (dto.feeCategoryId) {
      await this.feeCategories.getOwned(schoolId, dto.feeCategoryId);
    }
    // A Discount line must reduce the total, never inflate it - the sign
    // is the whole mechanism (see FinanceInvoiceFee's doc comment), so a
    // positive "discount" is rejected outright rather than silently
    // treated as a real discount.
    if (dto.feeType === 'Discount' && dto.amount > 0) {
      throw new BadRequestException(
        'A Discount line must have a negative amount',
      );
    }
    if (dto.feeType !== 'Discount' && dto.amount < 0) {
      throw new BadRequestException(
        `A ${dto.feeType} line must have a non-negative amount`,
      );
    }

    const line = await this.invoiceFees.save(
      this.invoiceFees.create({
        invoiceId,
        feeType: dto.feeType,
        feeId: dto.feeId ?? null,
        name: dto.name,
        description: dto.description ?? null,
        feeCategoryId: dto.feeCategoryId ?? null,
        amount: dto.amount,
        sequenceNumber: dto.sequenceNumber ?? 0,
      }),
    );
    await this.invoices.recalculatePaidAmount(schoolId, invoiceId);
    return line;
  }

  async remove(schoolId: string, id: string): Promise<void> {
    const line = await this.invoiceFees.findByIdAndSchool(id, schoolId);
    if (!line) {
      throw new NotFoundException('Invoice line item not found');
    }
    const { invoiceId } = line;
    await this.invoiceFees.remove(line);
    await this.invoices.recalculatePaidAmount(schoolId, invoiceId);
  }
}
