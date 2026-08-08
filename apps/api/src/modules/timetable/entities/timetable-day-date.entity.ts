import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { TimetableDay } from './timetable-day.entity';

/**
 * Maps a real calendar date to a TimetableDay. No DB-level uniqueness
 * constraint across the join to Timetable (TypeORM can't express "unique
 * per parent's parent" cleanly) - "this date is only mapped once within a
 * given Timetable" is enforced in TimetableDaysService via
 * TimetableDayDatesRepository.findConflictingMapping().
 */
@Entity('timetable_day_dates')
export class TimetableDayDate extends BaseEntity {
  @ManyToOne(() => TimetableDay, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'timetableDayId' })
  timetableDay: TimetableDay;

  @Column({ type: 'varchar', length: 36 })
  timetableDayId: string;

  @Column({ type: 'date' })
  date: string;
}
