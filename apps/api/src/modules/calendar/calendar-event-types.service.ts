import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isDuplicateEntryError } from '../../common/duplicate-entry-error';
import { CalendarEventTypesRepository } from './repositories/calendar-event-types.repository';
import { CalendarEventType } from './entities/calendar-event-type.entity';
import { CreateCalendarEventTypeDto } from './dto/create-calendar-event-type.dto';
import { UpdateCalendarEventTypeDto } from './dto/update-calendar-event-type.dto';

@Injectable()
export class CalendarEventTypesService {
  constructor(private readonly eventTypes: CalendarEventTypesRepository) {}

  list(schoolId: string): Promise<CalendarEventType[]> {
    return this.eventTypes.findBySchool(schoolId);
  }

  async create(
    schoolId: string,
    dto: CreateCalendarEventTypeDto,
  ): Promise<CalendarEventType> {
    try {
      return await this.eventTypes.save(
        this.eventTypes.create({ schoolId, ...dto }),
      );
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          `An event type named "${dto.name}" already exists for this school`,
        );
      }
      throw error;
    }
  }

  async update(
    schoolId: string,
    id: string,
    dto: UpdateCalendarEventTypeDto,
  ): Promise<CalendarEventType> {
    const eventType = await this.getOwned(schoolId, id);
    Object.assign(eventType, dto);

    try {
      return await this.eventTypes.save(eventType);
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          `An event type named "${eventType.name}" already exists for this school`,
        );
      }
      throw error;
    }
  }

  async remove(schoolId: string, id: string): Promise<void> {
    const eventType = await this.getOwned(schoolId, id);
    await this.eventTypes.softRemove(eventType);
  }

  /** Also used by CalendarEventsService to authorize an event type id. */
  async getOwned(schoolId: string, id: string): Promise<CalendarEventType> {
    const eventType = await this.eventTypes.findByIdAndSchool(id, schoolId);
    if (!eventType) {
      throw new NotFoundException('Calendar event type not found');
    }
    return eventType;
  }
}
