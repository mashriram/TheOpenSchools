import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { Messenger } from './messenger.entity';
import { Person } from '../../people/entities/person.entity';

/**
 * The real per-recipient row Gibbon actually has (gibbonMessengerReceipt) -
 * unlike the CSV-list confusion this plan flagged for some other Tier 2
 * modules, Gibbon's own Messenger already does this part right. What
 * Gibbon gets wrong is the FK: `messengerId` here is CASCADE, closing the
 * real, confirmed orphan-row bug (deleting a message leaves receipts/
 * targets behind forever in reference Gibbon).
 *
 * `recipientName` is a send-time snapshot, Tier B, following the exact
 * precedent set by BehaviourLetterRecipient (M20): it lets the recipient
 * list survive independently of the live Person record, and gives GDPR
 * erasure something concrete to scrub for a specific recipient (see
 * buildMessengerReceiptErasureFields()) without deleting the structural
 * personId reference the read-receipt/delivery-count features rely on.
 */
@Entity('messenger_receipts')
@Index(['messengerId', 'personId'], { unique: true })
export class MessengerReceipt extends BaseEntity {
  @ManyToOne(() => Messenger, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'messengerId' })
  messenger: Messenger;

  @Column({ type: 'varchar', length: 36 })
  messengerId: string;

  @ManyToOne(() => Person, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'personId' })
  person: Person;

  @Column({ type: 'varchar', length: 36 })
  personId: string;

  @Column({ type: 'text', nullable: true })
  recipientName: string | null;

  @Column({ type: 'boolean', default: false })
  confirmed: boolean;

  @Column({ type: 'timestamp', nullable: true })
  confirmedTimestamp: Date | null;
}
