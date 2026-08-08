import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { CourseClass } from './course-class.entity';
import { Person } from '../../people/entities/person.entity';

/**
 * `role` deliberately excludes Gibbon's 'Student - Left'/'Teacher - Left'
 * pseudo-values. Gibbon detects a "leaving" transition with a fragile
 * substring match (`stripos($role, 'Left') !== false`) on what's meant to be
 * an enum - we drop that anti-pattern entirely: "has this person left the
 * class" is represented purely by `dateUnenrolled` being non-null, and
 * `role` stays a clean 5-value union. This is a deliberate improvement over
 * Gibbon, not an oversight.
 *
 * One row per (courseClassId, personId), not one row per historical
 * enrolment stint: re-enrolling a previously-unenrolled person updates the
 * existing row rather than inserting a second one (see
 * CourseEnrolmentService.enrol()).
 *
 * No schoolId column: tenant scope is inherited through
 * `courseClass.course.schoolId`, matching this codebase's "scope through
 * parent, not a duplicated column" convention for child entities.
 */
export type CourseClassPersonRole =
  'Student' | 'Teacher' | 'Assistant' | 'Technician' | 'Parent';

@Entity('course_class_people')
@Index(['courseClassId', 'personId'], { unique: true })
export class CourseClassPerson extends BaseEntity {
  @ManyToOne(() => CourseClass, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'courseClassId' })
  courseClass: CourseClass;

  @Column({ type: 'varchar', length: 36 })
  courseClassId: string;

  @ManyToOne(() => Person, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'personId' })
  person: Person;

  @Column({ type: 'varchar', length: 36 })
  personId: string;

  @Column({ type: 'varchar', length: 20 })
  role: CourseClassPersonRole;

  @Column({ type: 'date', nullable: true })
  dateEnrolled: string | null;

  @Column({ type: 'date', nullable: true })
  dateUnenrolled: string | null;

  @Column({ type: 'boolean', default: true })
  reportable: boolean;
}
