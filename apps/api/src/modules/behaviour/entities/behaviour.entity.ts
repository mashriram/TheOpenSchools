import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { encryptedColumnTransformer } from '../../../common/field-encryption';
import { SchoolYear } from '../../school/entities/school-year.entity';
import { Person } from '../../people/entities/person.entity';

export type BehaviourType = 'Positive' | 'Negative' | 'Observation';

/**
 * Gibbon's gibbonBehaviour, minus `gibbonPlannerEntryID` (the Planner
 * module doesn't exist - documented deferral, same category as Course/
 * CourseClass/Unit deferring Admissions-only fields in Foundation).
 * `descriptor`/`level` stay plain school-configurable free text (Gibbon's
 * real design: populated from a Setting-driven picklist, not a fixed
 * lookup table) - unlike Alert/IndividualNeed's fixed severity enum, this
 * one genuinely varies per school.
 *
 * Tier C: `comment`/`followup` are encrypted at rest.
 *
 * Reproduces Gibbon's one genuinely good confidentiality mechanism in the
 * safeguarding cluster (plan §M20): `comment`/`followup`/`level` are never
 * selected/returned for a viewer scoped to themselves or their own child -
 * see BehaviourService.getVisibleBehaviour()/listForPerson(). Every other
 * Tier C module in this cluster (Individual Needs, Student Alerts) had a
 * real Gibbon gap to *fix*; this one has a real mechanism worth
 * *reproducing* faithfully instead.
 *
 * No schoolId column: tenant scope is inherited through
 * `schoolYear.schoolId`.
 */
@Entity('behaviours')
export class Behaviour extends BaseEntity {
  @ManyToOne(() => SchoolYear, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'schoolYearId' })
  schoolYear: SchoolYear;

  @Column({ type: 'varchar', length: 36 })
  schoolYearId: string;

  @Column({ type: 'date' })
  date: string;

  @ManyToOne(() => Person, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'personId' })
  person: Person;

  @Column({ type: 'varchar', length: 36 })
  personId: string;

  @Column({ type: 'varchar', length: 12 })
  type: BehaviourType;

  @Column({ type: 'varchar', length: 100, nullable: true })
  descriptor: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  level: string | null;

  @Column({
    type: 'text',
    nullable: true,
    transformer: encryptedColumnTransformer,
  })
  comment: string | null;

  @Column({
    type: 'text',
    nullable: true,
    transformer: encryptedColumnTransformer,
  })
  followup: string | null;

  @ManyToOne(() => Person, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'creatorPersonId' })
  creator: Person | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  creatorPersonId: string | null;

  /** Groups records created in one bulk submission (Gibbon's real field). */
  @Column({ type: 'varchar', length: 64, nullable: true })
  multiIncidentId: string | null;
}
