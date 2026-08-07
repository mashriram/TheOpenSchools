import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { PersonOAuthProvider } from '@purpleschools/shared-types';
import { BaseEntity } from '../../../common/base.entity';
import { Person } from './person.entity';

/**
 * Data model only - OAuth login itself is deferred (not built until a
 * later phase actually wires Google/Microsoft/generic OIDC sign-in). Exists
 * now purely to preserve Gibbon's column coverage without inventing a login
 * flow before it's actually needed.
 *
 * SECURITY TODO: `refreshToken` must be encrypted at rest (e.g. via
 * `typeorm-encrypted` or an equivalent column transformer, per the plan's
 * Compliance design) before this table is ever populated with a real token.
 * Stored as plain text for now since no code path writes to it yet and
 * standing up key management for an unused column would be premature.
 */
@Entity('person_oauth_connections')
@Index(['personId', 'provider'], { unique: true })
export class PersonOAuthConnection extends BaseEntity {
  @ManyToOne(() => Person, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'personId' })
  person: Person;

  @Column({ type: 'varchar', length: 36 })
  personId: string;

  @Column({ type: 'varchar', length: 16 })
  provider: PersonOAuthProvider;

  @Column({ type: 'text' })
  refreshToken: string;
}
