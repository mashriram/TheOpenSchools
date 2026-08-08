import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { encryptedColumnTransformer } from '../../../common/field-encryption';
import { IndividualNeedInvestigation } from './individual-need-investigation.entity';
import { Person } from '../../people/entities/person.entity';
import { CourseClassPerson } from '../../curriculum/entities/course-class-person.entity';

export type ContributionType = 'Teacher' | 'Head of Year';
export type ContributionStatus = 'Pending' | 'Complete';

/**
 * Gibbon's gibbonINInvestigationContribution - one row per contributing
 * staff member, across the six real Gibbon-defined observation domains
 * (cognition/memory/selfManagement/attention/socialInteraction/
 * communication). Tier C: every narrative field is encrypted at rest.
 *
 * No schoolId column: tenant scope is inherited through
 * `investigation.schoolYear.schoolId`.
 */
@Entity('individual_need_investigation_contributions')
export class IndividualNeedInvestigationContribution extends BaseEntity {
  @ManyToOne(() => IndividualNeedInvestigation, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'investigationId' })
  investigation: IndividualNeedInvestigation;

  @Column({ type: 'varchar', length: 36 })
  investigationId: string;

  @Column({ type: 'varchar', length: 16, default: 'Teacher' })
  type: ContributionType;

  @ManyToOne(() => Person, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'personId' })
  person: Person;

  @Column({ type: 'varchar', length: 36 })
  personId: string;

  @ManyToOne(() => CourseClassPerson, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'courseClassPersonId' })
  courseClassPerson: CourseClassPerson | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  courseClassPersonId: string | null;

  @Column({ type: 'varchar', length: 10, default: 'Pending' })
  status: ContributionStatus;

  @Column({
    type: 'text',
    nullable: true,
    transformer: encryptedColumnTransformer,
  })
  cognition: string | null;

  @Column({
    type: 'text',
    nullable: true,
    transformer: encryptedColumnTransformer,
  })
  memory: string | null;

  @Column({
    type: 'text',
    nullable: true,
    transformer: encryptedColumnTransformer,
  })
  selfManagement: string | null;

  @Column({
    type: 'text',
    nullable: true,
    transformer: encryptedColumnTransformer,
  })
  attention: string | null;

  @Column({
    type: 'text',
    nullable: true,
    transformer: encryptedColumnTransformer,
  })
  socialInteraction: string | null;

  @Column({
    type: 'text',
    nullable: true,
    transformer: encryptedColumnTransformer,
  })
  communication: string | null;

  @Column({
    type: 'text',
    nullable: true,
    transformer: encryptedColumnTransformer,
  })
  comment: string | null;
}
