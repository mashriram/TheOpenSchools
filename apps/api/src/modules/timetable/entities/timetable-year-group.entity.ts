import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { Timetable } from './timetable.entity';
import { YearGroup } from '../../school/entities/year-group.entity';

/**
 * Normalizes Gibbon's gibbonTT.gibbonYearGroupIDList CSV column into a real
 * join table, matching the CSV-normalization convention already established
 * for Course/CourseYearGroup in M14.
 */
@Entity('timetable_year_groups')
@Index(['timetableId', 'yearGroupId'], { unique: true })
export class TimetableYearGroup extends BaseEntity {
  @ManyToOne(() => Timetable, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'timetableId' })
  timetable: Timetable;

  @Column({ type: 'varchar', length: 36 })
  timetableId: string;

  @ManyToOne(() => YearGroup, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'yearGroupId' })
  yearGroup: YearGroup;

  @Column({ type: 'varchar', length: 36 })
  yearGroupId: string;
}
