import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { decimalTransformer } from '../../../common/decimal-transformer';
import { BaseEntity } from '../../../common/base.entity';
import { SchoolYear } from '../../school/entities/school-year.entity';
import { FinanceInvoicee } from './finance-invoicee.entity';
import { FinanceBillingSchedule } from './finance-billing-schedule.entity';

export type FinanceInvoiceStatus =
  'Pending' | 'Issued' | 'Paid' | 'Paid - Partial' | 'Cancelled' | 'Refunded';

/**
 * Gibbon's gibbonFinanceInvoice, minus `separated`/`billingScheduleType`
 * (schedule-separation bookkeeping detail not needed for Tier 2 MVP) and
 * the CSV `gibbonFinanceFeeCategoryIDList` (redundant - a category can
 * always be derived by joining through this invoice's FinanceInvoiceFee
 * rows).
 *
 * `retentionPeriodMonths` is new - Gibbon never codifies an actual
 * retention *period* for invoices anywhere; "invoices will be retained"
 * indefinitely is itself a storage-limitation problem, not a safe default
 * (plan §Data Safety Design F). Null means "not yet specified - flagged
 * for the school's finance/legal owner to configure", not "exempt
 * forever."
 *
 * `paidAmount`/`status` are maintained by
 * FinanceInvoicesService.recalculatePaidAmount(), never set directly by a
 * client - see that method's doc comment.
 *
 * No schoolId column: tenant scope is inherited through
 * `schoolYear.schoolId`.
 */
@Entity('finance_invoices')
export class FinanceInvoice extends BaseEntity {
  @ManyToOne(() => SchoolYear, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'schoolYearId' })
  schoolYear: SchoolYear;

  @Column({ type: 'varchar', length: 36 })
  schoolYearId: string;

  @ManyToOne(() => FinanceInvoicee, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'invoiceeId' })
  invoicee: FinanceInvoicee;

  @Column({ type: 'varchar', length: 36 })
  invoiceeId: string;

  @ManyToOne(() => FinanceBillingSchedule, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'billingScheduleId' })
  billingSchedule: FinanceBillingSchedule | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  billingScheduleId: string | null;

  @Column({ type: 'varchar', length: 16, default: 'Pending' })
  status: FinanceInvoiceStatus;

  @Column({ type: 'date', nullable: true })
  invoiceIssueDate: string | null;

  @Column({ type: 'date', nullable: true })
  invoiceDueDate: string | null;

  @Column({ type: 'date', nullable: true })
  paidDate: string | null;

  @Column({
    type: 'decimal',
    precision: 13,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  paidAmount: number;

  @Column({ type: 'int', default: 0 })
  reminderCount: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'int', nullable: true })
  retentionPeriodMonths: number | null;
}
