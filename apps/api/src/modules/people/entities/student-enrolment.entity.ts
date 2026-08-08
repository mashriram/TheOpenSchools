import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { SoftDeletableEntity } from '../../../common/soft-deletable.entity';
import { Person } from './person.entity';
import { SchoolYear } from '../../school/entities/school-year.entity';
import { YearGroup } from '../../school/entities/year-group.entity';
import { FormGroup } from '../../school/entities/form-group.entity';

@Entity('student_enrolments')
@Index(['personId', 'schoolYearId'], { unique: true })
export class StudentEnrolment extends SoftDeletableEntity {
  @ManyToOne(() => Person, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'personId' })
  person: Person;

  @Column({ type: 'varchar', length: 36 })
  personId: string;

  @ManyToOne(() => SchoolYear, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'schoolYearId' })
  schoolYear: SchoolYear;

  @Column({ type: 'varchar', length: 36 })
  schoolYearId: string;

  // CASCADE, deliberately, even though YearGroup/FormGroup are reference
  // lookups rather than StudentEnrolment's "true" owner (Person/SchoolYear
  // are): an audit initially flagged this as risky ("a future purge tool
  // hard-deleting one FormGroup would silently destroy enrolment history")
  // and RESTRICT was tried, but nothing in this app ever hard-deletes a
  // FormGroup/YearGroup directly - the only place hard deletes cascade
  // through this chain at all is a whole-School teardown (used throughout
  // the test suite's cleanup, and a plausible future "permanently delete
  // this school" admin action), which legitimately needs to reach all the
  // way down. RESTRICT blocked that real case to guard against a
  // hypothetical one, so it was reverted.
  @ManyToOne(() => YearGroup, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'yearGroupId' })
  yearGroup: YearGroup;

  @Column({ type: 'varchar', length: 36 })
  yearGroupId: string;

  @ManyToOne(() => FormGroup, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'formGroupId' })
  formGroup: FormGroup;

  @Column({ type: 'varchar', length: 36 })
  formGroupId: string;

  @Column({ type: 'int', nullable: true })
  rollOrder: number | null;

  @Column({ type: 'json', nullable: true })
  customFields: Record<string, unknown> | null;
}
