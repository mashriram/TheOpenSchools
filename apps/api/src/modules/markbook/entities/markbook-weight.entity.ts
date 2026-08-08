import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { CourseClass } from '../../curriculum/entities/course-class.entity';

/**
 * Gibbon's gibbonMarkbookWeight - a named weighting category (e.g. "Exams",
 * "Homework") with a percentage weight, per class. Schema-modeled per the
 * plan; the report-generation feature that would actually compute a
 * weighted-average grade from MarkbookColumn/MarkbookEntry data against
 * these categories is a documented deferral (report generation is out of
 * Tier 2 MVP scope - see plan §M16), not a half-finished feature.
 *
 * No schoolId column: tenant scope is inherited through
 * `courseClass.course.schoolId`.
 */
@Entity('markbook_weights')
@Index(['courseClassId', 'name'], { unique: true })
export class MarkbookWeight extends BaseEntity {
  @ManyToOne(() => CourseClass, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'courseClassId' })
  courseClass: CourseClass;

  @Column({ type: 'varchar', length: 36 })
  courseClassId: string;

  @Column({ type: 'varchar', length: 40 })
  name: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  weighting: number;

  @Column({ type: 'int', default: 0 })
  sequenceNumber: number;
}
