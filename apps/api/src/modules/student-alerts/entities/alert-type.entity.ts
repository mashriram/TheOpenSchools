import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { SoftDeletableEntity } from '../../../common/soft-deletable.entity';
import { School } from '../../school/entities/school.entity';

export type AlertTypeCategory = 'Core' | 'Additional';

/**
 * Gibbon's gibbonAlertType - unlike Individual Needs' descriptor/level
 * enums, this genuinely is admin-extensible in real Gibbon (the `type`
 * column distinguishes the 5 seeded 'Core' rows from school-created
 * 'Additional' ones), so it stays a real per-school table rather than a
 * fixed TS union.
 *
 * `adminOnly` is the field at the center of two real Gibbon bugs this
 * module fixes directly (plan §M19): (1) in reference Gibbon, `adminOnly`
 * only ever filters which types appear in the *creation* dropdown - it is
 * never checked when *viewing* an alert, so any staff member who can view
 * a student's alerts at all sees every type including Medical/Privacy and
 * their free-text comment; (2) an automatic "Privacy" badge renders
 * `Person.privacy` verbatim regardless of `adminOnly`. Automatic alert
 * generation itself (the `automatic` flag/threshold fields below) is a
 * documented Tier 2 MVP deferral - a rules engine that reads Markbook/
 * Behaviour/Individual Needs data to auto-create alerts is a separate,
 * substantial feature; this module supports manual alert creation only,
 * and the "Privacy" auto-badge (arguably a feature built entirely around
 * a bug, per the plan's own Risk callout) is deliberately not ported.
 *
 * The 5 real Gibbon Core seed rows (Individual Needs/Academic/Behaviour/
 * Medical/Privacy) are not auto-seeded at signup - same deliberate
 * deferral as AttendanceCode (M17): schools create their own alert types
 * via admin CRUD, matching this codebase's existing precedent for
 * per-school reference data.
 */
@Entity('alert_types')
@Index(['schoolId', 'name'], { unique: true })
export class AlertType extends SoftDeletableEntity {
  @ManyToOne(() => School, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'schoolId' })
  school: School;

  @Column({ type: 'varchar', length: 36 })
  schoolId: string;

  @Column({ type: 'varchar', length: 60 })
  name: string;

  @Column({ type: 'varchar', length: 5, nullable: true })
  tag: string | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'boolean', default: false })
  automatic: boolean;

  @Column({ type: 'boolean', default: true })
  adminOnly: boolean;

  @Column({ type: 'boolean', default: true })
  useLevels: boolean;

  @Column({ type: 'varchar', length: 10, default: 'Additional' })
  type: AlertTypeCategory;

  @Column({ type: 'varchar', length: 10, nullable: true })
  color: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  colorBG: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'int', nullable: true })
  thresholdLow: number | null;

  @Column({ type: 'int', nullable: true })
  thresholdMed: number | null;

  @Column({ type: 'int', nullable: true })
  thresholdHigh: number | null;

  @Column({ type: 'int', default: 0 })
  sequenceNumber: number;
}
