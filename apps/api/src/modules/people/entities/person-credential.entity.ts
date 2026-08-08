import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { Person } from './person.entity';

/**
 * Split out from Person for a clean field-level-encryption boundary (per the
 * plan's Compliance design). Replaces gibbonPerson's passwordStrong +
 * passwordStrongSalt pair with one column: argon2id (M5) embeds its own
 * salt, so a separate salt column is unnecessary.
 *
 * `schoolId` is deliberately denormalized off Person here (not just reached
 * via personId -> Person.schoolId) so `username` can be uniquely
 * constrained per-school in a single-table index - MySQL can't express a
 * unique constraint across a join.
 */
@Entity('person_credentials')
@Index(['schoolId', 'username'], { unique: true })
export class PersonCredential extends BaseEntity {
  @OneToOne(() => Person, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'personId' })
  person: Person;

  // No explicit @Index here: @OneToOne above already creates a unique
  // index on this column.
  @Column({ type: 'varchar', length: 36 })
  personId: string;

  @Column({ type: 'varchar', length: 36 })
  schoolId: string;

  // 255, not Gibbon-style 60: this MVP mirrors the person's email into
  // username (no separate username concept yet), and Person.email already
  // allows up to 255 chars (RFC 5321's ~254-char practical email limit) -
  // this column must match or long-email signups fail with a DB truncation
  // error instead of a clean validation message.
  @Column({ type: 'varchar', length: 255 })
  username: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'boolean', default: false })
  passwordForceReset: boolean;

  @Column({ type: 'boolean', default: true })
  canLogin: boolean;

  @Column({ type: 'varchar', length: 32, nullable: true })
  mfaSecret: string | null;

  @Column({ type: 'boolean', default: false })
  mfaEnabled: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  lastLoginIp: string | null;

  @Column({ type: 'timestamp', nullable: true })
  lastFailedLoginAt: Date | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  lastFailedLoginIp: string | null;

  @Column({ type: 'int', default: 0 })
  failedLoginCount: number;

  @Column({ type: 'timestamp', nullable: true })
  emailVerifiedAt: Date | null;
}
