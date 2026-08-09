import { IsIn, IsOptional, IsUUID } from 'class-validator';
import type { CalendarEventPersonRole } from '../entities/calendar-event-person.entity';

export const CALENDAR_EVENT_PERSON_ROLES: CalendarEventPersonRole[] = [
  'Attendee',
  'Organiser',
  'Coach',
  'Assistant',
  'Other',
];

export class AddEventParticipantDto {
  @IsUUID('4')
  personId: string;

  @IsOptional()
  @IsIn(CALENDAR_EVENT_PERSON_ROLES)
  role?: CalendarEventPersonRole;
}
