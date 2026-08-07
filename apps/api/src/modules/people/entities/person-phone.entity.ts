import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import type { PersonPhoneType } from '@purpleschools/shared-types';
import { BaseEntity } from '../../../common/base.entity';
import { Person } from './person.entity';

/**
 * Normalizes Gibbon's phone1..4 numbered-column group (same denormalization
 * anti-pattern as the plan flags for CSV columns) into a real child table.
 */
@Entity('person_phones')
export class PersonPhone extends BaseEntity {
  @ManyToOne(() => Person, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'personId' })
  person: Person;

  @Column({ type: 'varchar', length: 36 })
  personId: string;

  @Column({ type: 'varchar', length: 16 })
  type: PersonPhoneType;

  @Column({ type: 'varchar', length: 8, nullable: true })
  countryCode: string | null;

  @Column({ type: 'varchar', length: 30 })
  number: string;

  @Column({ type: 'int', default: 0 })
  priority: number;
}
