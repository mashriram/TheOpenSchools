import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeopleModule } from '../people/people.module';
import { SchoolModule } from '../school/school.module';
import { RbacModule } from '../rbac/rbac.module';
import { TimetableModule } from '../timetable/timetable.module';
import { Calendar } from './entities/calendar.entity';
import { CalendarEditor } from './entities/calendar-editor.entity';
import { CalendarEventType } from './entities/calendar-event-type.entity';
import { CalendarEvent } from './entities/calendar-event.entity';
import { CalendarEventPerson } from './entities/calendar-event-person.entity';
import { CalendarsRepository } from './repositories/calendars.repository';
import { CalendarEditorsRepository } from './repositories/calendar-editors.repository';
import { CalendarEventTypesRepository } from './repositories/calendar-event-types.repository';
import { CalendarEventsRepository } from './repositories/calendar-events.repository';
import { CalendarEventPeopleRepository } from './repositories/calendar-event-people.repository';
import { CalendarsService } from './calendars.service';
import { CalendarEventTypesService } from './calendar-event-types.service';
import { CalendarEventsService } from './calendar-events.service';
import { MyScheduleService } from './my-schedule.service';
import { CalendarsController } from './calendars.controller';
import { CalendarEventTypesController } from './calendar-event-types.controller';
import { CalendarEventsController } from './calendar-events.controller';
import { MyScheduleController } from './my-schedule.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Calendar,
      CalendarEditor,
      CalendarEventType,
      CalendarEvent,
      CalendarEventPerson,
    ]),
    // For SchoolYear/Space/Person lookups (tenant ownership checks).
    PeopleModule,
    SchoolModule,
    // For PoliciesGuard, used by every controller below via @UseGuards().
    RbacModule,
    // For MyScheduleService's merged "my schedule" read-model (plan §M22).
    TimetableModule,
  ],
  controllers: [
    CalendarsController,
    CalendarEventTypesController,
    CalendarEventsController,
    MyScheduleController,
  ],
  providers: [
    CalendarsRepository,
    CalendarEditorsRepository,
    CalendarEventTypesRepository,
    CalendarEventsRepository,
    CalendarEventPeopleRepository,
    CalendarsService,
    CalendarEventTypesService,
    CalendarEventsService,
    MyScheduleService,
  ],
  exports: [
    CalendarsRepository,
    CalendarEventsRepository,
    CalendarEventPeopleRepository,
  ],
})
export class CalendarModule {}
