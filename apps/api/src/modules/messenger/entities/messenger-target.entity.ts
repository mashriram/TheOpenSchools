import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { Messenger } from './messenger.entity';
import { Role } from '../../rbac/entities/role.entity';
import { FormGroup } from '../../school/entities/form-group.entity';
import { YearGroup } from '../../school/entities/year-group.entity';
import { House } from '../../school/entities/house.entity';
import { Person } from '../../people/entities/person.entity';
import { MessengerMailingList } from './messenger-mailing-list.entity';

export type MessengerTargetType =
  'Role' | 'FormGroup' | 'YearGroup' | 'House' | 'Person' | 'MailingList';

/**
 * Gibbon's gibbonMessengerTarget uses five nullable soft-reference columns
 * (no FK, since Gibbon has none anywhere) to say who an audience group is.
 * Reproduced with real FKs on each nullable column instead - the same
 * "several optional direct FKs, exactly one populated per row" pattern
 * already used by CalendarEvent's spaceId/organiserPersonId - giving real
 * referential integrity Gibbon's design never had. Exactly one of
 * roleId/formGroupId/yearGroupId/houseId/personId/mailingListId is set,
 * matching `targetType`; enforced in MessengerService, not a DB constraint.
 *
 * `messengerId` is CASCADE - the real fix for Gibbon's confirmed orphan-row
 * bug (deleting a message leaves its targets/receipts behind forever,
 * since Gibbon's schema has no FK to cascade the delete at all).
 */
@Entity('messenger_targets')
export class MessengerTarget extends BaseEntity {
  @ManyToOne(() => Messenger, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'messengerId' })
  messenger: Messenger;

  @Column({ type: 'varchar', length: 36 })
  messengerId: string;

  @Column({ type: 'varchar', length: 12 })
  targetType: MessengerTargetType;

  @ManyToOne(() => Role, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'roleId' })
  role: Role | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  roleId: string | null;

  @ManyToOne(() => FormGroup, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'formGroupId' })
  formGroup: FormGroup | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  formGroupId: string | null;

  @ManyToOne(() => YearGroup, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'yearGroupId' })
  yearGroup: YearGroup | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  yearGroupId: string | null;

  @ManyToOne(() => House, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'houseId' })
  house: House | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  houseId: string | null;

  @ManyToOne(() => Person, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'personId' })
  person: Person | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  personId: string | null;

  @ManyToOne(() => MessengerMailingList, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'mailingListId' })
  mailingList: MessengerMailingList | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  mailingListId: string | null;
}
