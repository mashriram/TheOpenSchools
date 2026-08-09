import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { Person } from '../../people/entities/person.entity';

export type FinanceInvoiceTo = 'Family' | 'Company';

/**
 * Gibbon's gibbonFinanceInvoicee - "who is billed for this student":
 * either the student's family (resolved dynamically via the existing
 * FamilyAdult/FamilyChild relations at invoice time, not a fixed
 * reference) or a named company. `gibbonFinanceFeeCategoryIDList` (a CSV
 * of category ids a company selectively pays) is a documented MVP
 * deferral - `companyAll` alone covers the common case (company pays
 * everything or nothing); per-category company billing is a fast-follow.
 *
 * No schoolId column: tenant scope is inherited through
 * `student.schoolId`.
 */
@Entity('finance_invoicees')
export class FinanceInvoicee extends BaseEntity {
  @ManyToOne(() => Person, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'studentPersonId' })
  student: Person;

  @Column({ type: 'varchar', length: 36 })
  studentPersonId: string;

  @Column({ type: 'varchar', length: 10 })
  invoiceTo: FinanceInvoiceTo;

  @Column({ type: 'varchar', length: 100, nullable: true })
  companyName: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  companyContact: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  companyAddress: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  companyEmail: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  companyPhone: string | null;

  @Column({ type: 'boolean', nullable: true })
  companyCCFamily: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  companyAll: boolean | null;
}
