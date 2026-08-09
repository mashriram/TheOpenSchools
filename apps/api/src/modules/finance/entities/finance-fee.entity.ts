import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { decimalTransformer } from '../../../common/decimal-transformer';
import { SoftDeletableEntity } from '../../../common/soft-deletable.entity';
import { SchoolYear } from '../../school/entities/school-year.entity';
import { FinanceFeeCategory } from './finance-fee-category.entity';

/**
 * Gibbon's gibbonFinanceFee - a standard, reusable fee definition (e.g.
 * "Term 1 Tuition") that an admin later attaches to invoices as a
 * Standard-type FinanceInvoiceFee line item.
 *
 * No schoolId column: tenant scope is inherited through
 * `schoolYear.schoolId`.
 */
@Entity('finance_fees')
@Index(['schoolYearId', 'shortName'], { unique: true })
export class FinanceFee extends SoftDeletableEntity {
  @ManyToOne(() => SchoolYear, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'schoolYearId' })
  schoolYear: SchoolYear;

  @Column({ type: 'varchar', length: 36 })
  schoolYearId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 6 })
  shortName: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  // CASCADE, not RESTRICT: a RESTRICT here would block the whole-tenant
  // teardown cascade (School -> FinanceFeeCategory -> ...) the moment any
  // Fee references a category - the same class of bug already found and
  // fixed for StudentEnrolment/YearGroup (Foundation) and
  // MarkbookTarget/ScaleGrade (M16).
  @ManyToOne(() => FinanceFeeCategory, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'feeCategoryId' })
  feeCategory: FinanceFeeCategory;

  @Column({ type: 'varchar', length: 36 })
  feeCategoryId: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  amount: number;
}
