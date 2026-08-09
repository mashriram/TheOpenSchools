import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { encryptedColumnTransformer } from '../../../common/field-encryption';
import { Behaviour } from './behaviour.entity';
import { Person } from '../../people/entities/person.entity';

/**
 * Gibbon's gibbonBehaviourFollowUp - additional follow-up notes appended
 * to a Behaviour record over time, by potentially different staff members.
 * Tier C: `followUp` is encrypted at rest, same as the parent record's own
 * comment/followup fields, and subject to the same self/child visibility
 * gate.
 *
 * No schoolId column: tenant scope is inherited through
 * `behaviour.schoolYear.schoolId`.
 */
@Entity('behaviour_follow_ups')
export class BehaviourFollowUp extends BaseEntity {
  @ManyToOne(() => Behaviour, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'behaviourId' })
  behaviour: Behaviour;

  @Column({ type: 'varchar', length: 36 })
  behaviourId: string;

  @ManyToOne(() => Person, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'personId' })
  person: Person | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  personId: string | null;

  @Column({
    type: 'text',
    nullable: true,
    transformer: encryptedColumnTransformer,
  })
  followUp: string | null;
}
