import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { SoftDeletableEntity } from '../../../common/soft-deletable.entity';
import { School } from './school.entity';
import { Person } from '../../people/entities/person.entity';

/**
 * Belongs to School, not SchoolYear - a persistent reference like "Year 7",
 * exactly like Gibbon's gibbonYearGroup. headOfYearPersonId couldn't be a
 * real FK until Person existed (M4); it's wired for real now that M3 lands
 * after M4 in the build order.
 */
@Entity('year_groups')
@Index(['schoolId', 'name'], { unique: true })
export class YearGroup extends SoftDeletableEntity {
  @ManyToOne(() => School, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'schoolId' })
  school: School;

  @Column({ type: 'varchar', length: 36 })
  schoolId: string;

  @Column({ type: 'varchar', length: 60 })
  name: string;

  @Column({ type: 'varchar', length: 8 })
  shortName: string;

  @Column({ type: 'int' })
  sequenceNumber: number;

  @ManyToOne(() => Person, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'headOfYearPersonId' })
  headOfYearPerson: Person | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  headOfYearPersonId: string | null;
}
