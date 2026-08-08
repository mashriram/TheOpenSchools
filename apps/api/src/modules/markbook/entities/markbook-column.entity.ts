import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { SoftDeletableEntity } from '../../../common/soft-deletable.entity';
import { CourseClass } from '../../curriculum/entities/course-class.entity';
import { Scale } from './scale.entity';

/**
 * Gibbon's gibbonMarkbookColumn. `rubricIdAttainment`/`rubricIdEffort` stay
 * plain nullable strings with no FK, matching Course/CourseClass/Unit's
 * precedent for a Tier-3-not-built-yet reference (Rubrics doesn't exist;
 * these will become real FKs once it does).
 *
 * Visibility gate reproduced exactly from Gibbon: an entry in this column is
 * visible to a Student only if `viewableStudents && complete &&
 * (completeDate == null || completeDate <= today)`; to a Parent, the same
 * gate keyed on `viewableParents`. Teachers/Admins always see everything -
 * see MarkbookEntriesService.getVisibleEntryForCaller().
 *
 * No schoolId column: tenant scope is inherited through
 * `courseClass.course.schoolId`.
 */
@Entity('markbook_columns')
export class MarkbookColumn extends SoftDeletableEntity {
  @ManyToOne(() => CourseClass, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'courseClassId' })
  courseClass: CourseClass;

  @Column({ type: 'varchar', length: 36 })
  courseClassId: string;

  @Column({ type: 'varchar', length: 60 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'int', default: 0 })
  sequenceNumber: number;

  @Column({ type: 'boolean', default: true })
  attainmentEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  effortEnabled: boolean;

  @ManyToOne(() => Scale, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'scaleIdAttainment' })
  scaleAttainment: Scale | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  scaleIdAttainment: string | null;

  @ManyToOne(() => Scale, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'scaleIdEffort' })
  scaleEffort: Scale | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  scaleIdEffort: string | null;

  /** Deferred: Tier 3 Rubrics module doesn't exist yet. */
  @Column({ type: 'varchar', length: 36, nullable: true })
  rubricIdAttainment: string | null;

  /** Deferred: Tier 3 Rubrics module doesn't exist yet. */
  @Column({ type: 'varchar', length: 36, nullable: true })
  rubricIdEffort: string | null;

  @Column({ type: 'boolean', default: false })
  viewableStudents: boolean;

  @Column({ type: 'boolean', default: false })
  viewableParents: boolean;

  @Column({ type: 'boolean', default: false })
  complete: boolean;

  @Column({ type: 'date', nullable: true })
  completeDate: string | null;
}
