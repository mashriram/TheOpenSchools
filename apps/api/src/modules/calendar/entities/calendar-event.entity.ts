import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { Calendar } from './calendar.entity';
import { CalendarEventType } from './calendar-event-type.entity';
import { Space } from '../../school/entities/space.entity';
import { Person } from '../../people/entities/person.entity';

export type CalendarEventStatus = 'Confirmed' | 'Tentative' | 'Cancelled';
export type CalendarEventLocationType = 'Internal' | 'External';

/**
 * Gibbon's gibbonCalendarEvent, minus its polymorphic `foreignTable`/
 * `foreignTableID` soft-reference (used by not-yet-built Tier 3 modules
 * like Trips/Activities to link their own records to a calendar event) -
 * a documented deferral, unlike FacilityBooking's direct-FK simplification
 * in M15: there is no single real module to point a direct FK at yet.
 *
 * Only 'Confirmed' events are returned by default list queries, matching
 * Gibbon's real behaviour (see CalendarEventsService.listVisibleEventsInRange()).
 *
 * No schoolId column: tenant scope is inherited through
 * `calendar.schoolYear.schoolId`.
 */
@Entity('calendar_events')
export class CalendarEvent extends BaseEntity {
  @ManyToOne(() => Calendar, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'calendarId' })
  calendar: Calendar;

  @Column({ type: 'varchar', length: 36 })
  calendarId: string;

  @ManyToOne(() => CalendarEventType, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'eventTypeId' })
  eventType: CalendarEventType | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  eventTypeId: string | null;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 10, default: 'Confirmed' })
  status: CalendarEventStatus;

  @Column({ type: 'boolean', default: false })
  allDay: boolean;

  @Column({ type: 'date' })
  dateStart: string;

  @Column({ type: 'date' })
  dateEnd: string;

  @Column({ type: 'time', nullable: true })
  timeStart: string | null;

  @Column({ type: 'time', nullable: true })
  timeEnd: string | null;

  @Column({ type: 'varchar', length: 10, default: 'External' })
  locationType: CalendarEventLocationType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  locationDetail: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  locationUrl: string | null;

  @ManyToOne(() => Space, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'spaceId' })
  space: Space | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  spaceId: string | null;

  @ManyToOne(() => Person, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'createdByPersonId' })
  createdBy: Person | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  createdByPersonId: string | null;

  @ManyToOne(() => Person, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'organiserPersonId' })
  organiser: Person | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  organiserPersonId: string | null;
}
