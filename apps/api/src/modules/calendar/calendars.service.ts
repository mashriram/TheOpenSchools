import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isDuplicateEntryError } from '../../common/duplicate-entry-error';
import { CalendarsRepository } from './repositories/calendars.repository';
import { CalendarEditorsRepository } from './repositories/calendar-editors.repository';
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';
import { PeopleRepository } from '../people/repositories/people.repository';
import { Calendar } from './entities/calendar.entity';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { UpdateCalendarDto } from './dto/update-calendar.dto';

@Injectable()
export class CalendarsService {
  constructor(
    private readonly calendars: CalendarsRepository,
    private readonly editors: CalendarEditorsRepository,
    private readonly schoolYears: SchoolYearsRepository,
    private readonly people: PeopleRepository,
  ) {}

  async list(schoolId: string, schoolYearId: string): Promise<Calendar[]> {
    await this.assertSchoolYearBelongsToSchool(schoolId, schoolYearId);
    return this.calendars.findBySchoolYear(schoolYearId);
  }

  async create(
    schoolId: string,
    schoolYearId: string,
    dto: CreateCalendarDto,
  ): Promise<Calendar> {
    await this.assertSchoolYearBelongsToSchool(schoolId, schoolYearId);

    try {
      return await this.calendars.save(
        this.calendars.create({ schoolYearId, ...dto }),
      );
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          `A calendar named "${dto.name}" already exists for this school year`,
        );
      }
      throw error;
    }
  }

  async update(
    schoolId: string,
    id: string,
    dto: UpdateCalendarDto,
  ): Promise<Calendar> {
    const calendar = await this.getOwned(schoolId, id);
    Object.assign(calendar, dto);

    try {
      return await this.calendars.save(calendar);
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          `A calendar named "${calendar.name}" already exists for this school year`,
        );
      }
      throw error;
    }
  }

  async remove(schoolId: string, id: string): Promise<void> {
    const calendar = await this.getOwned(schoolId, id);
    await this.calendars.softRemove(calendar);
  }

  /** Also used by CalendarEventsService to authorize a Calendar id. */
  async getOwned(schoolId: string, id: string): Promise<Calendar> {
    const calendar = await this.calendars.findByIdAndSchool(id, schoolId);
    if (!calendar) {
      throw new NotFoundException('Calendar not found');
    }
    return calendar;
  }

  async addEditor(
    schoolId: string,
    calendarId: string,
    personId: string,
    editAllEvents: boolean,
  ): Promise<void> {
    await this.getOwned(schoolId, calendarId);
    const person = await this.people.findOne({
      where: { id: personId, schoolId },
    });
    if (!person) {
      throw new BadRequestException('personId does not belong to this school');
    }

    const existing = await this.editors.findByCalendarAndPerson(
      calendarId,
      personId,
    );
    const editor = existing ?? this.editors.create({ calendarId, personId });
    editor.editAllEvents = editAllEvents;
    await this.editors.save(editor);
  }

  async listEditors(schoolId: string, calendarId: string) {
    await this.getOwned(schoolId, calendarId);
    return this.editors.findByCalendar(calendarId);
  }

  private async assertSchoolYearBelongsToSchool(
    schoolId: string,
    schoolYearId: string,
  ): Promise<void> {
    const schoolYear = await this.schoolYears.findOne({
      where: { id: schoolYearId, schoolId },
    });
    if (!schoolYear) {
      throw new BadRequestException(
        'schoolYearId does not belong to this school',
      );
    }
  }
}
