import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Matches,
} from 'class-validator';
import type {
  CalendarEventLocationType,
  CalendarEventStatus,
} from '../entities/calendar-event.entity';

export const CALENDAR_EVENT_STATUSES: CalendarEventStatus[] = [
  'Confirmed',
  'Tentative',
  'Cancelled',
];
export const CALENDAR_EVENT_LOCATION_TYPES: CalendarEventLocationType[] = [
  'Internal',
  'External',
];
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

export class CreateCalendarEventDto {
  @IsOptional()
  @IsUUID('4')
  eventTypeId?: string;

  @IsString()
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(CALENDAR_EVENT_STATUSES)
  status?: CalendarEventStatus;

  @IsOptional()
  @IsBoolean()
  allDay?: boolean;

  @IsDateString()
  dateStart: string;

  @IsDateString()
  dateEnd: string;

  @IsOptional()
  @Matches(TIME_PATTERN)
  timeStart?: string;

  @IsOptional()
  @Matches(TIME_PATTERN)
  timeEnd?: string;

  @IsOptional()
  @IsIn(CALENDAR_EVENT_LOCATION_TYPES)
  locationType?: CalendarEventLocationType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  locationDetail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  locationUrl?: string;

  @IsOptional()
  @IsUUID('4')
  spaceId?: string;

  @IsOptional()
  @IsUUID('4')
  organiserPersonId?: string;
}
