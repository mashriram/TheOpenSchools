import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { SoftDeletableEntity } from '../../../common/soft-deletable.entity';
import { SchoolYear } from '../../school/entities/school-year.entity';

/** Gibbon's gibbonFinanceBillingSchedule - a recurring invoice template. */
@Entity('finance_billing_schedules')
@Index(['schoolYearId', 'name'], { unique: true })
export class FinanceBillingSchedule extends SoftDeletableEntity {
  @ManyToOne(() => SchoolYear, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'schoolYearId' })
  schoolYear: SchoolYear;

  @Column({ type: 'varchar', length: 36 })
  schoolYearId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'date', nullable: true })
  invoiceIssueDate: string | null;

  @Column({ type: 'date', nullable: true })
  invoiceDueDate: string | null;
}
