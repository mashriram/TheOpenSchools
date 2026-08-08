import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { SoftDeletableEntity } from '../../../common/soft-deletable.entity';
import { Course } from './course.entity';

/**
 * Minimal slice of gibbonUnit: only the fields Markbook needs as an FK target
 * (gibbonMarkbookColumn.gibbonUnitID) in a later milestone. Gibbon's
 * lesson-planning fields (tags, attachment, details, license, sharedPublic,
 * creator, lastEdit) are deliberately out of scope here.
 *
 * No schoolId column: tenant scope is inherited through `course.schoolId`.
 */
@Entity('units')
export class Unit extends SoftDeletableEntity {
  @ManyToOne(() => Course, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @Column({ type: 'varchar', length: 36 })
  courseId: string;

  @Column({ type: 'varchar', length: 40 })
  name: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'int', default: 0 })
  sequenceNumber: number;

  @Column({ type: 'json', nullable: true })
  customFields: Record<string, unknown> | null;
}
