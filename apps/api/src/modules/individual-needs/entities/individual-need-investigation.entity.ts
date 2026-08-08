import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { encryptedColumnTransformer } from '../../../common/field-encryption';
import { SchoolYear } from '../../school/entities/school-year.entity';
import { Person } from '../../people/entities/person.entity';

export type IndividualNeedInvestigationStatus =
  'Referral' | 'Resolved' | 'Investigation' | 'Investigation Complete';

/**
 * Gibbon's gibbonINInvestigation - a real safeguarding-style referral/
 * investigation workflow. Tier C: `reason`/`strategiesTried`/
 * `parentsResponse`/`resolutionDetails` are encrypted at rest, same
 * treatment as IndividualNeed's narrative fields.
 *
 * No schoolId column: tenant scope is inherited through
 * `schoolYear.schoolId`.
 */
@Entity('individual_need_investigations')
export class IndividualNeedInvestigation extends BaseEntity {
  @ManyToOne(() => SchoolYear, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'schoolYearId' })
  schoolYear: SchoolYear;

  @Column({ type: 'varchar', length: 36 })
  schoolYearId: string;

  @ManyToOne(() => Person, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'creatorPersonId' })
  creator: Person | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  creatorPersonId: string | null;

  @ManyToOne(() => Person, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'studentPersonId' })
  student: Person;

  @Column({ type: 'varchar', length: 36 })
  studentPersonId: string;

  @Column({ type: 'varchar', length: 24, default: 'Referral' })
  status: IndividualNeedInvestigationStatus;

  @Column({ type: 'date' })
  date: string;

  @Column({
    type: 'text',
    transformer: encryptedColumnTransformer,
  })
  reason: string;

  @Column({
    type: 'text',
    nullable: true,
    transformer: encryptedColumnTransformer,
  })
  strategiesTried: string | null;

  @Column({ type: 'boolean', default: false })
  parentsInformed: boolean;

  @Column({
    type: 'text',
    nullable: true,
    transformer: encryptedColumnTransformer,
  })
  parentsResponse: string | null;

  @Column({
    type: 'text',
    nullable: true,
    transformer: encryptedColumnTransformer,
  })
  resolutionDetails: string | null;
}
