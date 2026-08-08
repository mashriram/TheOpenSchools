import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { SoftDeletableEntity } from '../../../common/soft-deletable.entity';
import { Person } from './person.entity';

/** 1:1 extension of Person - mirrors gibbonStaff. */
@Entity('staff')
export class Staff extends SoftDeletableEntity {
  @OneToOne(() => Person, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'personId' })
  person: Person;

  // No explicit @Index: @OneToOne already creates a unique index.
  @Column({ type: 'varchar', length: 36 })
  personId: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  type: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  initials: string | null;

  @Column({ type: 'varchar', length: 90, nullable: true })
  jobTitle: string | null;

  /** Tri-state, matching Gibbon's enum('','N','Y') - null means unspecified. */
  @Column({ type: 'boolean', nullable: true })
  firstAidQualified: boolean | null;

  @Column({ type: 'varchar', length: 90, nullable: true })
  firstAidQualification: string | null;

  @Column({ type: 'date', nullable: true })
  firstAidExpiry: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  countryOfOrigin: string | null;

  @Column({ type: 'text', nullable: true })
  qualifications: string | null;

  @Column({ type: 'text', nullable: true })
  biography: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  biographicalGrouping: string | null;

  @Column({ type: 'int', default: 0 })
  biographicalGroupingPriority: number;

  @Column({ type: 'boolean', default: false })
  coverageExclude: boolean;

  @Column({ type: 'int', default: 0 })
  coveragePriority: number;

  @Column({ type: 'json', nullable: true })
  customFields: Record<string, unknown> | null;
}
