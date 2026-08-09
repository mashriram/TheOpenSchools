import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { decimalTransformer } from '../../../common/decimal-transformer';
import { BaseEntity } from '../../../common/base.entity';
import { FinanceInvoice } from './finance-invoice.entity';
import { Person } from '../../people/entities/person.entity';

export type PaymentStatus = 'Complete' | 'Partial' | 'Final' | 'Failure';
export type OnlineTransactionStatus = 'Success' | 'Failure';

/**
 * Gibbon's gibbonPayment, with its polymorphic `foreignTable`/
 * `foreignTableID` soft-reference simplified to a direct `invoiceId` FK -
 * this codebase's established replacement for Gibbon's polymorphic
 * reference pattern (matching FacilityBooking's precedent in M15).
 *
 * PCI scope (plan §Data Safety Design G, confirmed by direct grep of
 * Gibbon's own source): NO raw card or bank account data is ever stored
 * here, matching Gibbon's real design exactly - only a gateway name and
 * opaque token/transaction/receipt identifiers issued by the gateway
 * itself. Card entry happens entirely on the gateway's own hosted
 * Checkout page; this schema is not designed to hold anything that would
 * bring it into full PCI-DSS cardholder-data scope.
 *
 * A refund is a dedicated negative-`amount` row (admin-recorded), not
 * just an invoice status flip - full gateway-refund-API automation is an
 * explicit fast-follow, not required for Tier 2 MVP.
 *
 * No schoolId column: tenant scope is inherited through
 * `invoice.schoolYear.schoolId`.
 */
@Entity('payments')
export class Payment extends BaseEntity {
  @ManyToOne(() => FinanceInvoice, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'invoiceId' })
  invoice: FinanceInvoice;

  @Column({ type: 'varchar', length: 36 })
  invoiceId: string;

  @ManyToOne(() => Person, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'recorderPersonId' })
  recorder: Person | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  recorderPersonId: string | null;

  @Column({ type: 'varchar', length: 60, default: 'Online' })
  type: string;

  @Column({ type: 'varchar', length: 10, default: 'Complete' })
  status: PaymentStatus;

  /** Negative for a refund. */
  @Column({
    type: 'decimal',
    precision: 13,
    scale: 2,
    transformer: decimalTransformer,
  })
  amount: number;

  @Column({ type: 'varchar', length: 30, nullable: true })
  gateway: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  onlineTransactionStatus: OnlineTransactionStatus | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  paymentToken: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  paymentPayerId: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  paymentTransactionId: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  paymentReceiptId: string | null;

  @Column({ type: 'timestamp' })
  occurredAt: Date;
}
