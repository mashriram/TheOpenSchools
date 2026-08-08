import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { Scale } from './scale.entity';

/**
 * Gibbon's gibbonScaleGrade. `value` is a numeric ranking used to compare
 * grades against a personal target or the scale's threshold grade (see
 * ../markbook-concern.ts) - higher `value` means a better result.
 * `lowestAcceptable` marks the one grade in the scale below which an entry
 * with no personal target is flagged as a concern (Gibbon's real
 * `lowestAcceptable` enum('Y','N') column, same semantics).
 *
 * No schoolId column: tenant scope is inherited through `scale.schoolId`.
 */
@Entity('markbook_scale_grades')
@Index(['scaleId', 'shortName'], { unique: true })
export class ScaleGrade extends BaseEntity {
  @ManyToOne(() => Scale, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'scaleId' })
  scale: Scale;

  @Column({ type: 'varchar', length: 36 })
  scaleId: string;

  @Column({ type: 'varchar', length: 40 })
  name: string;

  @Column({ type: 'varchar', length: 8 })
  shortName: string;

  @Column({ type: 'int' })
  value: number;

  @Column({ type: 'int', default: 0 })
  sequenceNumber: number;

  @Column({ type: 'boolean', default: false })
  lowestAcceptable: boolean;
}
