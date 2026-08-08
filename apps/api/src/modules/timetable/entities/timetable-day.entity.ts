import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { Timetable } from './timetable.entity';
import { TimetableColumn } from './timetable-column.entity';

/**
 * A named day-in-rotation within a Timetable (e.g. "Monday - Week A"),
 * following a given TimetableColumn's period pattern. A configuration row,
 * not a standalone-lifecycle entity - hard-deleted with its Timetable.
 *
 * onDelete: 'RESTRICT' on timetableColumn - deleting a period pattern still
 * referenced by a Day would silently break that Day's period structure, so
 * the FK blocks it instead of cascading or nulling.
 */
@Entity('timetable_days')
export class TimetableDay extends BaseEntity {
  @ManyToOne(() => Timetable, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'timetableId' })
  timetable: Timetable;

  @Column({ type: 'varchar', length: 36 })
  timetableId: string;

  @ManyToOne(() => TimetableColumn, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'timetableColumnId' })
  timetableColumn: TimetableColumn;

  @Column({ type: 'varchar', length: 36 })
  timetableColumnId: string;

  @Column({ type: 'varchar', length: 12 })
  name: string;

  @Column({ type: 'varchar', length: 4 })
  shortName: string;

  @Column({ type: 'varchar', length: 7 })
  color: string;

  @Column({ type: 'varchar', length: 7 })
  fontColor: string;
}
