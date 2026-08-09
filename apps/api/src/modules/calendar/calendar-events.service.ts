import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CalendarEventsRepository } from './repositories/calendar-events.repository';
import { CalendarEventPeopleRepository } from './repositories/calendar-event-people.repository';
import { CalendarsRepository } from './repositories/calendars.repository';
import { CalendarsService } from './calendars.service';
import { CalendarEventTypesService } from './calendar-event-types.service';
import { RolesRepository } from '../rbac/repositories/roles.repository';
import { PeopleRepository } from '../people/repositories/people.repository';
import { SpacesRepository } from '../school/repositories/spaces.repository';
import { canViewCalendar } from './calendar-visibility';
import { CalendarEvent } from './entities/calendar-event.entity';
import { CalendarEventPerson } from './entities/calendar-event-person.entity';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';
import { AddEventParticipantDto } from './dto/add-event-participant.dto';

@Injectable()
export class CalendarEventsService {
  constructor(
    private readonly events: CalendarEventsRepository,
    private readonly eventPeople: CalendarEventPeopleRepository,
    private readonly calendars: CalendarsRepository,
    private readonly calendarsService: CalendarsService,
    private readonly eventTypes: CalendarEventTypesService,
    private readonly roles: RolesRepository,
    private readonly people: PeopleRepository,
    private readonly spaces: SpacesRepository,
  ) {}

  async list(schoolId: string, calendarId: string): Promise<CalendarEvent[]> {
    await this.calendarsService.getOwned(schoolId, calendarId);
    return this.events.findByCalendar(calendarId);
  }

  async create(
    schoolId: string,
    calendarId: string,
    creatorPersonId: string,
    dto: CreateCalendarEventDto,
  ): Promise<CalendarEvent> {
    await this.calendarsService.getOwned(schoolId, calendarId);
    if (dto.eventTypeId) {
      await this.eventTypes.getOwned(schoolId, dto.eventTypeId);
    }
    if (dto.spaceId) {
      const space = await this.spaces.findOne({
        where: { id: dto.spaceId, schoolId },
      });
      if (!space) {
        throw new BadRequestException('spaceId does not belong to this school');
      }
    }
    if (dto.organiserPersonId) {
      const organiser = await this.people.findOne({
        where: { id: dto.organiserPersonId, schoolId },
      });
      if (!organiser) {
        throw new BadRequestException(
          'organiserPersonId does not belong to this school',
        );
      }
    }

    return this.events.save(
      this.events.create({
        calendarId,
        eventTypeId: dto.eventTypeId ?? null,
        name: dto.name,
        description: dto.description ?? null,
        status: dto.status ?? 'Confirmed',
        allDay: dto.allDay ?? false,
        dateStart: dto.dateStart,
        dateEnd: dto.dateEnd,
        timeStart: dto.timeStart ?? null,
        timeEnd: dto.timeEnd ?? null,
        locationType: dto.locationType ?? 'External',
        locationDetail: dto.locationDetail ?? null,
        locationUrl: dto.locationUrl ?? null,
        spaceId: dto.spaceId ?? null,
        organiserPersonId: dto.organiserPersonId ?? null,
        createdByPersonId: creatorPersonId,
      }),
    );
  }

  async update(
    schoolId: string,
    id: string,
    dto: UpdateCalendarEventDto,
  ): Promise<CalendarEvent> {
    const event = await this.getOwned(schoolId, id);
    Object.assign(event, dto);
    return this.events.save(event);
  }

  async remove(schoolId: string, id: string): Promise<void> {
    const event = await this.getOwned(schoolId, id);
    await this.events.remove(event);
  }

  async getOwned(schoolId: string, id: string): Promise<CalendarEvent> {
    const event = await this.events.findByIdAndSchool(id, schoolId);
    if (!event) {
      throw new NotFoundException('Calendar event not found');
    }
    return event;
  }

  async listParticipants(
    schoolId: string,
    eventId: string,
  ): Promise<CalendarEventPerson[]> {
    await this.getOwned(schoolId, eventId);
    return this.eventPeople.findByEvent(eventId);
  }

  async addParticipant(
    schoolId: string,
    eventId: string,
    dto: AddEventParticipantDto,
  ): Promise<CalendarEventPerson> {
    await this.getOwned(schoolId, eventId);
    const person = await this.people.findOne({
      where: { id: dto.personId, schoolId },
    });
    if (!person) {
      throw new BadRequestException('personId does not belong to this school');
    }

    return this.eventPeople.save(
      this.eventPeople.create({
        eventId,
        personId: dto.personId,
        role: dto.role ?? 'Attendee',
      }),
    );
  }

  async removeParticipant(schoolId: string, id: string): Promise<void> {
    const participant = await this.eventPeople.findOne({ where: { id } });
    if (!participant) {
      throw new NotFoundException('Participant not found');
    }
    // Confirms tenant ownership via the event, then removes.
    await this.getOwned(schoolId, participant.eventId);
    await this.eventPeople.remove(participant);
  }

  /**
   * The visibility-aware listing this module exists for (plan §M22): every
   * Confirmed event across every calendar in the school year, filtered by
   * `canViewCalendar()` for the caller's role, plus events on an otherwise-
   * invisible calendar the caller personally participates in (see
   * Calendar.viewableParticipants).
   */
  async listVisibleEventsInRange(
    schoolId: string,
    schoolYearId: string,
    dateStart: string,
    dateEnd: string,
    callerPersonId: string,
    activeRoleId: string,
  ): Promise<CalendarEvent[]> {
    const role = await this.roles.findOne({ where: { id: activeRoleId } });
    const roleCategory = role?.category ?? 'Other';
    const calendarsInYear = await this.calendars.findBySchoolYear(schoolYearId);

    const broadlyVisibleIds: string[] = [];
    const participantOnlyIds: string[] = [];
    for (const calendar of calendarsInYear) {
      if (canViewCalendar(calendar, roleCategory, false)) {
        broadlyVisibleIds.push(calendar.id);
      } else if (calendar.viewableParticipants) {
        participantOnlyIds.push(calendar.id);
      }
    }

    const broadEvents = await this.events.findConfirmedByCalendarsAndDateRange(
      broadlyVisibleIds,
      dateStart,
      dateEnd,
    );
    const participantOnlyEvents =
      await this.events.findConfirmedByCalendarsAndDateRange(
        participantOnlyIds,
        dateStart,
        dateEnd,
      );
    const participantEventIds = await this.eventPeople.findParticipantEventIds(
      callerPersonId,
      participantOnlyEvents.map((event) => event.id),
    );
    const visibleParticipantEvents = participantOnlyEvents.filter((event) =>
      participantEventIds.includes(event.id),
    );

    return [...broadEvents, ...visibleParticipantEvents].sort((a, b) =>
      a.dateStart.localeCompare(b.dateStart),
    );
  }
}
