import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import type { SafeguardingSeverityLevel } from '@purpleschools/shared-types';
import { BaseEntity } from '../../../common/base.entity';
import { encryptedColumnTransformer } from '../../../common/field-encryption';
import { SchoolYear } from '../../school/entities/school-year.entity';
import { Person } from '../../people/entities/person.entity';
import { CourseClass } from '../../curriculum/entities/course-class.entity';
import { AlertType } from './alert-type.entity';

export type AlertContext = 'Automatic' | 'Manual';
export type AlertStatus = 'Pending' | 'Approved' | 'Declined' | 'Cancelled';

/**
 * Gibbon's gibbonAlert. Tier C: `comment`/`notesStatus` are encrypted at
 * rest. `context` is always 'Manual' in this MVP - see AlertType's doc
 * comment for why automatic generation isn't built.
 *
 * No schoolId column: tenant scope is inherited through
 * `schoolYear.schoolId`.
 */
@Entity('student_alerts')
export class Alert extends BaseEntity {
  @ManyToOne(() => SchoolYear, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'schoolYearId' })
  schoolYear: SchoolYear;

  @Column({ type: 'varchar', length: 36 })
  schoolYearId: string;

  @ManyToOne(() => Person, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'personId' })
  person: Person;

  @Column({ type: 'varchar', length: 36 })
  personId: string;

  @ManyToOne(() => CourseClass, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'courseClassId' })
  courseClass: CourseClass | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  courseClassId: string | null;

  @ManyToOne(() => AlertType, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'alertTypeId' })
  alertType: AlertType;

  @Column({ type: 'varchar', length: 36 })
  alertTypeId: string;

  @Column({ type: 'varchar', length: 10, default: 'Manual' })
  context: AlertContext;

  @Column({ type: 'varchar', length: 12, default: 'Pending' })
  status: AlertStatus;

  @Column({ type: 'varchar', length: 10, nullable: true })
  level: SafeguardingSeverityLevel | null;

  @Column({ type: 'date', nullable: true })
  dateStart: string | null;

  @Column({ type: 'date', nullable: true })
  dateEnd: string | null;

  @Column({
    type: 'text',
    nullable: true,
    transformer: encryptedColumnTransformer,
  })
  comment: string | null;

  @ManyToOne(() => Person, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'createdByPersonId' })
  createdBy: Person | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  createdByPersonId: string | null;

  @ManyToOne(() => Person, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'statusByPersonId' })
  statusBy: Person | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  statusByPersonId: string | null;

  @Column({
    type: 'text',
    nullable: true,
    transformer: encryptedColumnTransformer,
  })
  notesStatus: string | null;

  @Column({ type: 'timestamp', nullable: true })
  statusAt: Date | null;
}
