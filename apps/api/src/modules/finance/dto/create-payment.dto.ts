import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import type { PaymentStatus } from '../entities/payment.entity';

export const PAYMENT_STATUSES: PaymentStatus[] = [
  'Complete',
  'Partial',
  'Final',
  'Failure',
];

/**
 * For admin-recorded payments/refunds (e.g. cash, cheque, bank transfer,
 * or a manually-recorded gateway refund) - never accepts a card number or
 * bank account field, by design (see Payment's doc comment). A negative
 * `amount` records a refund.
 */
export class CreatePaymentDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  type?: string;

  @IsOptional()
  @IsIn(PAYMENT_STATUSES)
  status?: PaymentStatus;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  gateway?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  paymentToken?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentTransactionId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentReceiptId?: string;
}
