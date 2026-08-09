import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { Calendar } from './calendar.entity';
import { Person } from '../../people/entities/person.entity';

/** Gibbon's gibbonCalendarEditor - a person granted edit rights on a specific Calendar. */
@Entity('calendar_editors')
@Index(['calendarId', 'personId'], { unique: true })
export class CalendarEditor extends BaseEntity {
  @ManyToOne(() => Calendar, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'calendarId' })
  calendar: Calendar;

  @Column({ type: 'varchar', length: 36 })
  calendarId: string;

  @ManyToOne(() => Person, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'personId' })
  person: Person;

  @Column({ type: 'varchar', length: 36 })
  personId: string;

  @Column({ type: 'boolean', default: false })
  editAllEvents: boolean;
}
