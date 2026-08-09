import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import type { FinanceInvoiceStatus } from '../entities/finance-invoice.entity';

export const FINANCE_INVOICE_MANUAL_STATUSES: FinanceInvoiceStatus[] = [
  'Pending',
  'Issued',
  'Cancelled',
];

// Deliberately excludes 'Paid'/'Paid - Partial'/'Refunded': those are only
// ever set by FinanceInvoicesService.recalculatePaidAmount() from real
// Payment rows, never by direct client edit.
export class UpdateInvoiceDto {
  @IsOptional()
  @IsIn(FINANCE_INVOICE_MANUAL_STATUSES)
  status?: FinanceInvoiceStatus;

  @IsOptional()
  @IsDateString()
  invoiceIssueDate?: string;

  @IsOptional()
  @IsDateString()
  invoiceDueDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  retentionPeriodMonths?: number;
}
