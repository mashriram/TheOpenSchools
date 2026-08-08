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
