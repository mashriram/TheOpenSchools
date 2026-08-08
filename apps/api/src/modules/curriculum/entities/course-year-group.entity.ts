import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { Course } from './course.entity';
import { YearGroup } from '../../school/entities/year-group.entity';

/**
 * Replaces gibbonCourse.gibbonYearGroupIDList (a CSV of YearGroup ids) with a
 * real join table, matching this codebase's established convention of
 * normalizing Gibbon's CSV/numbered columns (e.g. FormGroupStaff replacing
 * gibbonFormGroup's tutor/EA columns).
 */
@Entity('course_year_groups')
@Index(['courseId', 'yearGroupId'], { unique: true })
export class CourseYearGroup extends BaseEntity {
  @ManyToOne(() => Course, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @Column({ type: 'varchar', length: 36 })
  courseId: string;

  @ManyToOne(() => YearGroup, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'yearGroupId' })
  yearGroup: YearGroup;

  @Column({ type: 'varchar', length: 36 })
  yearGroupId: string;
}
