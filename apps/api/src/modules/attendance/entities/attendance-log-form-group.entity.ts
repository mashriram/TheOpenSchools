import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { FormGroup } from '../../school/entities/form-group.entity';
import { Person } from '../../people/entities/person.entity';

/**
 * Gibbon's gibbonAttendanceLogFormGroup - a "register taken" marker,
 * separate from the actual per-person entries (AttendanceLogPerson), so a
 * UI can show "today's register: taken at 9:03am by Ms Smith" without
 * scanning every student's log row.
 *
 * No schoolId column: tenant scope is inherited through
 * `formGroup.schoolYear.schoolId`.
 */
@Entity('attendance_log_form_groups')
@Index(['formGroupId', 'date'], { unique: true })
export class AttendanceLogFormGroup extends BaseEntity {
  @ManyToOne(() => FormGroup, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'formGroupId' })
  formGroup: FormGroup;

  @Column({ type: 'varchar', length: 36 })
  formGroupId: string;

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
