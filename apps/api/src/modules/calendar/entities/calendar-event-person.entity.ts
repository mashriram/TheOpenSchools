import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { CalendarEvent } from './calendar-event.entity';
import { Person } from '../../people/entities/person.entity';

export type CalendarEventPersonRole =
  'Attendee' | 'Organiser' | 'Coach' | 'Assistant' | 'Other';

/**
 * Gibbon's gibbonCalendarEventPerson - a specific person's participation
 * in an event, distinct from calendar-level visibility. This is what
 * grants a participant visibility via `Calendar.viewableParticipants`
 * even when the calendar's broader viewable* flags would otherwise deny
 * them.
 */
@Entity('calendar_event_people')
@Index(['eventId', 'personId'], { unique: true })
export class CalendarEventPerson extends BaseEntity {
  @ManyToOne(() => CalendarEvent, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'eventId' })
  event: CalendarEvent;

  @Column({ type: 'varchar', length: 36 })
  eventId: string;

  @ManyToOne(() => Person, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'personId' })
  person: Person;

  @Column({ type: 'varchar', length: 36 })
  personId: string;

  @Column({ type: 'varchar', length: 12, default: 'Attendee' })
  role: CalendarEventPersonRole;
}
