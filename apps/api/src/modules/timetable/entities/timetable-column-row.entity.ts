import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { TimetableColumn } from './timetable-column.entity';

export type TimetableColumnRowType =
  'Lesson' | 'Pastoral' | 'Sport' | 'Break' | 'Service' | 'Other';

/** A single period within a TimetableColumn's pattern (e.g. "Period 1", 09:00-09:50). */
@Entity('timetable_column_rows')
export class TimetableColumnRow extends BaseEntity {
  @ManyToOne(() => TimetableColumn, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'timetableColumnId' })
  timetableColumn: TimetableColumn;

  @Column({ type: 'varchar', length: 36 })
  timetableColumnId: string;

  @Column({ type: 'varchar', length: 12 })
  name: string;

  @Column({ type: 'varchar', length: 4 })
  shortName: string;

  @Column({ type: 'time' })
  timeStart: string;

  @Column({ type: 'time' })
  timeEnd: string;

  @Column({ type: 'varchar', length: 20 })
  type: TimetableColumnRowType;
}
