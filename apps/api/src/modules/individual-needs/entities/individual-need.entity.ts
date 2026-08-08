import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { encryptedColumnTransformer } from '../../../common/field-encryption';
import { Person } from '../../people/entities/person.entity';

/**
 * Gibbon's gibbonIN - one row per person. Tier C (plan §Data Safety Design
 * A): `strategies`/`targets`/`notes` are column-level encrypted at rest via
 * `encryptedColumnTransformer` (the first real production use of the M13
 * encryption infrastructure). Nullable, unlike Gibbon's `NOT NULL DEFAULT
 * ''` - encrypting an empty string is meaningless overhead, and "no
 * strategies recorded yet" is a real, distinct state from "empty string".
 *
 * gibbonINArchive (a full historical snapshot table Gibbon writes to
 * on-approval) is a documented Tier 2 MVP deferral: this codebase's audit
 * log (with per-entity Tier C encrypt-classification, see
 * SENSITIVE_FIELDS_BY_ENTITY) already captures before/after history on
 * every change, making a bespoke parallel archive table redundant.
 *
 * No schoolId column: tenant scope is inherited through `person.schoolId`.
 */
@Entity('individual_needs')
@Index(['personId'], { unique: true })
export class IndividualNeed extends BaseEntity {
  @ManyToOne(() => Person, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'personId' })
  person: Person;

  @Column({ type: 'varchar', length: 36 })
  personId: string;

  @Column({
    type: 'text',
    nullable: true,
    transformer: encryptedColumnTransformer,
  })
  strategies: string | null;

  @Column({
    type: 'text',
    nullable: true,
    transformer: encryptedColumnTransformer,
  })
  targets: string | null;

  @Column({
    type: 'text',
    nullable: true,
    transformer: encryptedColumnTransformer,
  })
  notes: string | null;

  @Column({ type: 'json', nullable: true })
  customFields: Record<string, unknown> | null;
}
