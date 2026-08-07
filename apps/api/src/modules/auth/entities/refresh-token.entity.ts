import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { PersonCredential } from '../../people/entities/person-credential.entity';

/**
 * Supports rotation (each refresh issues a new token and revokes the old
 * one) and revocation (logout, or revoke-all-on-password-change). The raw
 * token is a high-entropy random value the client holds; only its hash is
 * ever stored, so a DB leak alone doesn't yield a usable token.
 */
@Entity('refresh_tokens')
export class RefreshToken extends BaseEntity {
  @ManyToOne(() => PersonCredential, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'personCredentialId' })
  personCredential: PersonCredential;

  @Column({ type: 'varchar', length: 36 })
  personCredentialId: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  tokenHash: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt: Date | null;
}
