import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { encryptedColumnTransformer } from '../../../common/field-encryption';
import { SchoolYear } from '../../school/entities/school-year.entity';
import { Person } from '../../people/entities/person.entity';

export type BehaviourLetterLevel = '1' | '2' | '3';
export type BehaviourLetterStatus = 'Warning' | 'Issued';
export type BehaviourLetterType = 'Negative' | 'Positive';

/**
 * The redesigned replacement for Gibbon's gibbonBehaviourLetter (plan
 * §Data Safety Design F). Gibbon writes a permanent, plaintext,
 * never-scrubbable copy of the letter body and recipient list - even
 * after the source Behaviour records' `comment` is later scrubbed via
 * Gibbon's own retention tool, the letter keeps an unencrypted copy
 * forever. Two fixes considered and rejected before this design (see the
 * plan): "don't store a copy, regenerate on demand from the source
 * records" silently couples two independent retention clocks and produces
 * undetectable corruption if the source is later scrubbed for unrelated
 * reasons; keeping Gibbon's plaintext design outright reproduces the bug
 * this whole module exists to fix.
 *
 * Actual design: an immutable, Tier-C-encrypted snapshot captured at send
 * time, with its own independent retention/erasure lifecycle from the
 * source Behaviour records (see GdprService.requestErasure - erasing the
 * source Behaviour rows never touches this table, and vice versa).
 * Nothing in this module ever updates `body` after creation - only
 * `create()` and GDPR erasure (nulling it) ever write to this column.
 *
 * `recipientList` is NOT a column here (unlike Gibbon's own
 * `recipientList text` blob) - normalized into BehaviourLetterRecipient,
 * one real row per recipient, precisely so a single recipient's erasure
 * can be a normal indexed `WHERE personId = :id` update rather than
 * decrypt-parse-redact-reencrypt surgery on an opaque blob (which an
 * encrypted TEXT column can't be queried by content at all).
 *
 * No schoolId column: tenant scope is inherited through
 * `schoolYear.schoolId`.
 */
@Entity('behaviour_letter_snapshots')
export class BehaviourLetterSnapshot extends BaseEntity {
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

  @Column({ type: 'varchar', length: 1 })
  letterLevel: BehaviourLetterLevel;

  @Column({ type: 'varchar', length: 10 })
  status: BehaviourLetterStatus;

  @Column({ type: 'varchar', length: 10, default: 'Negative' })
  type: BehaviourLetterType;

  @Column({ type: 'int' })
  recordCountAtCreation: number;

  @Column({
    type: 'text',
    nullable: true,
    transformer: encryptedColumnTransformer,
  })
  body: string | null;

  @Column({ type: 'timestamp' })
  sentAt: Date;
}
