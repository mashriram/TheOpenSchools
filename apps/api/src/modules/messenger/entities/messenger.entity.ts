import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { SoftDeletableEntity } from '../../../common/soft-deletable.entity';
import { School } from '../../school/entities/school.entity';
import { Person } from '../../people/entities/person.entity';

export type MessengerMethod = 'Email' | 'SMS' | 'MessageWall';

/**
 * Tier B: `subject`/`body` are sensitive free text (can reference medical/
 * safeguarding/behavioural matters) but need fast bulk querying for the
 * manage list and retention scrub below, so - same tradeoff already made
 * for Attendance's `reason`/`comment` - no column-level encryption.
 *
 * `confidential` mirrors Gibbon's real flag: hides this message from other
 * staff in the manage list (a generic staff-visibility control, not a
 * purpose-built safeguarding channel - see plan §Gibbon facts, Messenger).
 * One-way broadcast only, matching Gibbon: no threading/reply model.
 */
@Entity('messenger_messages')
export class Messenger extends SoftDeletableEntity {
  @ManyToOne(() => School, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'schoolId' })
  school: School;

  @Column({ type: 'varchar', length: 36 })
  schoolId: string;

  @ManyToOne(() => Person, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'senderPersonId' })
  sender: Person | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  senderPersonId: string | null;

  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'varchar', length: 12, default: 'MessageWall' })
  method: MessengerMethod;

  @Column({ type: 'boolean', default: false })
  confidential: boolean;
}
