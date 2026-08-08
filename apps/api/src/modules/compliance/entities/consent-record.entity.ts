import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { Person } from '../../people/entities/person.entity';

/**
 * Versioned privacy-policy acceptance, unlike Gibbon's unversioned static
 * privacy-policy text blob - each acceptance is its own row, so a policy
 * update doesn't retroactively imply consent to the new version.
 */
@Entity('consent_records')
export class ConsentRecord extends BaseEntity {
  @ManyToOne(() => Person, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'personId' })
  person: Person;

  @Column({ type: 'varchar', length: 36 })
  personId: string;

  @Column({ type: 'varchar', length: 20 })
  policyVersion: string;

  @Column({ type: 'timestamp' })
  acceptedAt: Date;
}
