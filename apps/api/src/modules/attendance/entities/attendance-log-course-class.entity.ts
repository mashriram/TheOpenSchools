import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { CourseClass } from '../../curriculum/entities/course-class.entity';
import { Person } from '../../people/entities/person.entity';

/**
 * Gibbon's gibbonAttendanceLogCourseClass - the class-level "register taken"
 * marker, mirroring AttendanceLogFormGroup for period-based registration.
 *
 * No schoolId column: tenant scope is inherited through
 * `courseClass.course.schoolId`.
 */
@Entity('attendance_log_course_classes')
@Index(['courseClassId', 'date'], { unique: true })
export class AttendanceLogCourseClass extends BaseEntity {
  @ManyToOne(() => CourseClass, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'courseClassId' })
  courseClass: CourseClass;

  @Column({ type: 'varchar', length: 36 })
  courseClassId: string;

  @ManyToOne(() => Person, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'takenByPersonId' })
  takenBy: Person | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  takenByPersonId: string | null;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'timestamp' })
  takenAt: Date;
}
