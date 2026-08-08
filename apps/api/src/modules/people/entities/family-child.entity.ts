import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { Family } from './family.entity';
import { Person } from './person.entity';

@Entity('family_children')
@Index(['familyId', 'personId'], { unique: true })
export class FamilyChild extends BaseEntity {
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
}
