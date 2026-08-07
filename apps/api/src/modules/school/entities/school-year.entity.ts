import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import type { SchoolYearStatus } from '@purpleschools/shared-types';
import { SoftDeletableEntity } from '../../../common/soft-deletable.entity';
import { School } from './school.entity';
import { SchoolYearTerm } from './school-year-term.entity';

@Entity('school_years')
@Index(['schoolId', 'name'], { unique: true })
export class SchoolYear extends SoftDeletableEntity {
  @ManyToOne(() => School, (school) => school.schoolYears, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'schoolId' })
  school: School;

  @Column({ type: 'varchar', length: 36 })
  schoolId: string;

  @Column({ type: 'varchar', length: 9 })
  name: string;

  @Column({ type: 'varchar', length: 16, default: 'Upcoming' })
  status: SchoolYearStatus;

  @Column({ type: 'int' })
  sequenceNumber: number;

  @Column({ type: 'date', nullable: true })
  firstDay: string | null;

  @Column({ type: 'date', nullable: true })
  lastDay: string | null;

  @OneToMany(() => SchoolYearTerm, (term) => term.schoolYear)
  terms: SchoolYearTerm[];
}
