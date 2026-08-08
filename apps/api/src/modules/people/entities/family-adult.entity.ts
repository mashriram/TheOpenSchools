import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { Family } from './family.entity';
import { Person } from './person.entity';

@Entity('family_adults')
@Index(['familyId', 'personId'], { unique: true })
export class FamilyAdult extends BaseEntity {
  @ManyToOne(() => Family, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'familyId' })
  family: Family;

  @Column({ type: 'varchar', length: 36 })
  familyId: string;

  @ManyToOne(() => Person, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'personId' })
  person: Person;

  @Column({ type: 'varchar', length: 36 })
  personId: string;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @Column({ type: 'boolean', default: true })
  childDataAccess: boolean;

  @Column({ type: 'int', default: 0 })
  contactPriority: number;

  @Column({ type: 'boolean', default: true })
  contactCall: boolean;

  @Column({ type: 'boolean', default: true })
  contactSms: boolean;

  @Column({ type: 'boolean', default: true })
  contactEmail: boolean;

  @Column({ type: 'boolean', default: true })
  contactMail: boolean;
}
