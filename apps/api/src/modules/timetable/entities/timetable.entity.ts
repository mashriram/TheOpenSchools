import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { SoftDeletableEntity } from '../../../common/soft-deletable.entity';
import { School } from '../../school/entities/school.entity';
import { SchoolYear } from '../../school/entities/school-year.entity';

/**
 * The actual timetable for a school year (e.g. "2024-25 Timetable").
 * Gibbon's nameShortDisplay display-preference enum is deliberately
 * omitted - not essential to core scheduling.
 */
@Entity('timetables')
@Index(['schoolId', 'schoolYearId', 'shortName'], { unique: true })
export class Timetable extends SoftDeletableEntity {
  @ManyToOne(() => School, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'schoolId' })
  school: School;

  @Column({ type: 'varchar', length: 36 })
  schoolId: string;

  @ManyToOne(() => SchoolYear, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'schoolYearId' })
  schoolYear: SchoolYear;

  @Column({ type: 'varchar', length: 36 })
  schoolYearId: string;

  @Column({ type: 'varchar', length: 30 })
  name: string;

  @Column({ type: 'varchar', length: 12 })
  shortName: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;
}
