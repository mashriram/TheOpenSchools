import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { SoftDeletableEntity } from '../../../common/soft-deletable.entity';
import { Course } from './course.entity';

/**
 * Gibbon's gibbonCourseClass, minus gibbonScaleIDTarget - that column
 * references a grading Scale entity that doesn't exist until Markbook (a
 * later Tier 2 milestone); it will be added as a nullable FK via a proper
 * migration once Scale exists, rather than faked or stubbed here.
 *
 * No schoolId column: tenant scope is inherited through `course.schoolId`,
 * matching this codebase's "scope through parent, not a duplicated column"
 * convention for child entities (see FormGroupStaff).
 */
@Entity('course_classes')
@Index(['courseId', 'shortName'], { unique: true })
export class CourseClass extends SoftDeletableEntity {
  @ManyToOne(() => Course, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @Column({ type: 'varchar', length: 36 })
  courseId: string;

  @Column({ type: 'varchar', length: 30 })
  name: string;

  @Column({ type: 'varchar', length: 16 })
  shortName: string;

  @Column({ type: 'boolean', default: true })
  reportable: boolean;

  /** Renamed from Gibbon's bare `attendance` flag for clarity. */
  @Column({ type: 'boolean', default: true })
  takesAttendance: boolean;

  @Column({ type: 'int', nullable: true })
  enrolmentMin: number | null;

  @Column({ type: 'int', nullable: true })
  enrolmentMax: number | null;

  @Column({ type: 'json', nullable: true })
  customFields: Record<string, unknown> | null;
}
