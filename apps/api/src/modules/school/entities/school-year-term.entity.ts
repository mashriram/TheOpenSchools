import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { SoftDeletableEntity } from '../../../common/soft-deletable.entity';
import { SchoolYear } from './school-year.entity';

@Entity('school_year_terms')
@Index(['schoolYearId', 'sequenceNumber'], { unique: true })
export class SchoolYearTerm extends SoftDeletableEntity {
  @ManyToOne(() => SchoolYear, (schoolYear) => schoolYear.terms, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'schoolYearId' })
  schoolYear: SchoolYear;

  @Column({ type: 'varchar', length: 36 })
  schoolYearId: string;

  @Column({ type: 'int' })
  sequenceNumber: number;

  @Column({ type: 'varchar', length: 20 })
  name: string;

  @Column({ type: 'varchar', length: 4 })
  shortName: string;

  @Column({ type: 'date' })
  firstDay: string;

  @Column({ type: 'date' })
  lastDay: string;
}
