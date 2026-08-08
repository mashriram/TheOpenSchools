import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { Person } from '../../people/entities/person.entity';
import { AttendanceCode } from './attendance-code.entity';
import type { AttendanceDirection } from './attendance-code.entity';
import { FormGroup } from '../../school/entities/form-group.entity';
import { CourseClass } from '../../curriculum/entities/course-class.entity';

export type AttendanceLogContext =
  'Form Group' | 'Class' | 'Person' | 'Future' | 'Self Registration';

/**
 * Gibbon's gibbonAttendanceLogPerson, minus the redundant `type` varchar
 * column Gibbon's own schema carries alongside `context` for unclear,
 * overlapping purposes - `context` alone is kept as the real discriminator.
 * Also drops the direct `gibbonTTDayRowClassID` link to a specific
 * scheduled period: cross-referencing a specific Timetable period is a
 * documented scope deferral for Tier 2 MVP (register-taking only needs
 * course-class + date granularity, not period-level precision).
 *
 * Tier B (plan §Data Safety Design A): `reason`/`comment` can reveal
 * health/religious information (e.g. a school's "Medical" reason). No
 * column-level encryption (these need fast bulk querying for attendance
 * reports/exports), but they DO get first-class GDPR erasure coverage from
 * day one (see GdprService.requestErasure -> buildAttendanceLogPersonErasureFields)
 * - Gibbon itself has zero retention coverage for this table, a real gap
 * this design does not reproduce.
 *
 * No schoolId column: tenant scope is inherited through `person.schoolId`.
 */
@Entity('attendance_log_people')
export class AttendanceLogPerson extends BaseEntity {
  @ManyToOne(() => Person, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'personId' })
  person: Person;

  @Column({ type: 'varchar', length: 36 })
  personId: string;

  @ManyToOne(() => AttendanceCode, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'attendanceCodeId' })
  attendanceCode: AttendanceCode | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  attendanceCodeId: string | null;

  @Column({ type: 'varchar', length: 3 })
  direction: AttendanceDirection;

  @Column({ type: 'varchar', length: 20, nullable: true })
  context: AttendanceLogContext | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  reason: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  comment: string | null;

  @Column({ type: 'date' })
  date: string;

  @ManyToOne(() => Person, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'takenByPersonId' })
  takenBy: Person | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  takenByPersonId: string | null;

  @ManyToOne(() => FormGroup, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'formGroupId' })
  formGroup: FormGroup | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  formGroupId: string | null;

  @ManyToOne(() => CourseClass, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'courseClassId' })
  courseClass: CourseClass | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  courseClassId: string | null;

  @Column({ type: 'timestamp', nullable: true })
  takenAt: Date | null;
}
