import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import type { FinanceInvoiceTo } from '../entities/finance-invoicee.entity';

export const FINANCE_INVOICE_TO_VALUES: FinanceInvoiceTo[] = [
  'Family',
  'Company',
];

export class CreateInvoiceeDto {
  @IsUUID('4')
  studentPersonId: string;

  @IsIn(FINANCE_INVOICE_TO_VALUES)
  invoiceTo: FinanceInvoiceTo;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  companyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  companyContact?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  companyAddress?: string;

  @IsOptional()
  @IsEmail()
  companyEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  companyPhone?: string;

  @IsOptional()
  @IsBoolean()
  companyCCFamily?: boolean;

  @IsOptional()
  @IsBoolean()
  companyAll?: boolean;
}
