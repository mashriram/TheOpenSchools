import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import type { FinanceInvoiceFeeType } from '../entities/finance-invoice-fee.entity';

export const FINANCE_INVOICE_FEE_TYPES: FinanceInvoiceFeeType[] = [
  'Standard',
  'AdHoc',
  'Discount',
];

export class CreateInvoiceFeeDto {
  @IsIn(FINANCE_INVOICE_FEE_TYPES)
  feeType: FinanceInvoiceFeeType;

  @IsOptional()
  @IsUUID('4')
  feeId?: string;

  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID('4')
  feeCategoryId?: string;

  // Not validated as strictly positive: a 'Discount' line is expected to
  // be negative (see FinanceInvoiceFee's doc comment) - the service layer
  // enforces the sign matches the feeType, not this DTO.
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsInt()
  sequenceNumber?: number;
}
