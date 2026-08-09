import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { encryptedColumnTransformer } from '../../../common/field-encryption';
import { BehaviourLetterSnapshot } from './behaviour-letter-snapshot.entity';
import { Person } from '../../people/entities/person.entity';

/**
 * One real row per recipient of a BehaviourLetterSnapshot - see that
 * entity's doc comment for why this is normalized rather than a single
 * encrypted blob. `name`/`email` are themselves snapshotted (encrypted) at
 * send time, independent of the recipient Person's current data - the
 * letter should keep saying who it was actually sent to and at what
 * address, even if that person's name/email later changes.
 *
 * No schoolId column: tenant scope is inherited through
 * `snapshot.schoolYear.schoolId`.
 */
@Entity('behaviour_letter_recipients')
export class BehaviourLetterRecipient extends BaseEntity {
  @ManyToOne(() => BehaviourLetterSnapshot, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'snapshotId' })
  snapshot: BehaviourLetterSnapshot;

  @Column({ type: 'varchar', length: 36 })
  snapshotId: string;

  @ManyToOne(() => Person, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'personId' })
  person: Person;

  @Column({ type: 'varchar', length: 36 })
  personId: string;

  // text, not varchar(255): the encrypted (base64 iv:authTag:ciphertext)
  // value is meaningfully longer than the plaintext it encodes and could
  // exceed 255 characters for a long name/email.
  @Column({
    type: 'text',
    nullable: true,
    transformer: encryptedColumnTransformer,
  })
  name: string | null;

  @Column({
    type: 'text',
    nullable: true,
    transformer: encryptedColumnTransformer,
  })
  email: string | null;
}
