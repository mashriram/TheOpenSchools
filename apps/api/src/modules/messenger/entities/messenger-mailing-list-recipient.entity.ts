import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { MessengerMailingList } from './messenger-mailing-list.entity';
import { Person } from '../../people/entities/person.entity';

/**
 * A structural membership row (like PersonRole) - not itself Tier B
 * content, so it's deliberately left out of GDPR erasure treatment, same
 * reasoning as GdprService's doc comment for StudentEnrolment/PersonRole.
 */
@Entity('messenger_mailing_list_recipients')
@Index(['mailingListId', 'personId'], { unique: true })
export class MessengerMailingListRecipient extends BaseEntity {
  @ManyToOne(() => MessengerMailingList, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'mailingListId' })
  mailingList: MessengerMailingList;

  @Column({ type: 'varchar', length: 36 })
  mailingListId: string;

  @ManyToOne(() => Person, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'personId' })
  person: Person;

  @Column({ type: 'varchar', length: 36 })
  personId: string;
}
