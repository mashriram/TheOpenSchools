import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { TimetableColumnRow } from './timetable-column-row.entity';
import { TimetableDay } from './timetable-day.entity';
import { CourseClass } from '../../curriculum/entities/course-class.entity';
import { Space } from '../../school/entities/space.entity';

/**
 * The actual scheduled lesson: a CourseClass placed into a specific period
 * (TimetableColumnRow) on a specific day-in-rotation (TimetableDay), in an
 * optional room. Unique per (row, day, class) - the same class can't be
 * double-scheduled into the exact same day+period slot.
 */
@Entity('timetable_day_row_classes')
@Index(['timetableColumnRowId', 'timetableDayId', 'courseClassId'], {
  unique: true,
})
export class TimetableDayRowClass extends BaseEntity {
  @ManyToOne(() => TimetableColumnRow, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'timetableColumnRowId' })
  timetableColumnRow: TimetableColumnRow;

  @Column({ type: 'varchar', length: 36 })
  timetableColumnRowId: string;

  @ManyToOne(() => TimetableDay, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'timetableDayId' })
  timetableDay: TimetableDay;

  @Column({ type: 'varchar', length: 36 })
  timetableDayId: string;

  @ManyToOne(() => CourseClass, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'courseClassId' })
  courseClass: CourseClass;

  @Column({ type: 'varchar', length: 36 })
  courseClassId: string;

  @ManyToOne(() => Space, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'spaceId' })
  space: Space | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  spaceId: string | null;
}
