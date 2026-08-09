import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { decimalTransformer } from '../../../common/decimal-transformer';
import { BaseEntity } from '../../../common/base.entity';
import { FinanceInvoice } from './finance-invoice.entity';
import { FinanceFee } from './finance-fee.entity';
import { FinanceFeeCategory } from './finance-fee-category.entity';

export type FinanceInvoiceFeeType = 'Standard' | 'AdHoc' | 'Discount';

/**
 * Gibbon's gibbonFinanceInvoiceFee, renaming the confusingly-named `fee`
 * amount column to `amount`, and adding the 'Discount' feeType Gibbon
 * lacks entirely (zero hits for "discount"/"scholarship" anywhere in
 * Gibbon's Finance module - plan §Data Safety Design G). A Discount line
 * carries a negative `amount`, reducing the invoice total, and is audited
 * like any other line item rather than being an undocumented manual
 * workaround (e.g. editing a Standard fee's amount directly).
 *
 * No schoolId column: tenant scope is inherited through
 * `invoice.schoolYear.schoolId`.
 */
@Entity('finance_invoice_fees')
export class FinanceInvoiceFee extends BaseEntity {
  @ManyToOne(() => FinanceInvoice, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'invoiceId' })
  invoice: FinanceInvoice;

  @Column({ type: 'varchar', length: 36 })
  invoiceId: string;

  @Column({ type: 'varchar', length: 10, default: 'AdHoc' })
  feeType: FinanceInvoiceFeeType;

  @ManyToOne(() => FinanceFee, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'feeId' })
  fee: FinanceFee | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  feeId: string | null;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ManyToOne(() => FinanceFeeCategory, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'feeCategoryId' })
  feeCategory: FinanceFeeCategory | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  feeCategoryId: string | null;

  /** Negative for a 'Discount' line, reducing the invoice total. */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  amount: number;

  @Column({ type: 'int', default: 0 })
  sequenceNumber: number;
}
