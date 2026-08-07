import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { Person } from './person.entity';

/** Normalizes Gibbon's emergency1/emergency2 numbered-column group. */
@Entity('person_emergency_contacts')
export class PersonEmergencyContact extends BaseEntity {
  @ManyToOne(() => Person, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'personId' })
  person: Person;

  @Column({ type: 'varchar', length: 36 })
  personId: string;

  @Column({ type: 'varchar', length: 90 })
  name: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone1: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone2: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  relationship: string | null;

  @Column({ type: 'int', default: 0 })
  priority: number;
}
