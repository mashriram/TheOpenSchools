import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurriculumModule } from '../curriculum/curriculum.module';
import { SchoolModule } from '../school/school.module';
import { PeopleModule } from '../people/people.module';
import { RbacModule } from '../rbac/rbac.module';
import { TimetableColumn } from './entities/timetable-column.entity';
import { TimetableColumnRow } from './entities/timetable-column-row.entity';
import { Timetable } from './entities/timetable.entity';
import { TimetableYearGroup } from './entities/timetable-year-group.entity';
import { TimetableDay } from './entities/timetable-day.entity';
import { TimetableDayDate } from './entities/timetable-day-date.entity';
import { TimetableDayRowClass } from './entities/timetable-day-row-class.entity';
import { FacilityBooking } from './entities/facility-booking.entity';
import { TimetableColumnsRepository } from './repositories/timetable-columns.repository';
import { TimetableColumnRowsRepository } from './repositories/timetable-column-rows.repository';
import { TimetablesRepository } from './repositories/timetables.repository';
import { TimetableYearGroupsRepository } from './repositories/timetable-year-groups.repository';
import { TimetableDaysRepository } from './repositories/timetable-days.repository';
import { TimetableDayDatesRepository } from './repositories/timetable-day-dates.repository';
import { TimetableDayRowClassesRepository } from './repositories/timetable-day-row-classes.repository';
import { FacilityBookingsRepository } from './repositories/facility-bookings.repository';
import { TimetableColumnsService } from './timetable-columns.service';
import { TimetablesService } from './timetables.service';
import { TimetableDaysService } from './timetable-days.service';
import { TimetableSchedulingService } from './timetable-scheduling.service';
import { TimetableReadModelService } from './timetable-read-model.service';
import { FacilityBookingsService } from './facility-bookings.service';
import { TimetableColumnsController } from './timetable-columns.controller';
import { TimetablesController } from './timetables.controller';
import { TimetableDaysController } from './timetable-days.controller';
import { TimetableSchedulingController } from './timetable-scheduling.controller';
import { FacilityBookingsController } from './facility-bookings.controller';
import { ScheduleController } from './schedule.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TimetableColumn,
      TimetableColumnRow,
      Timetable,
      TimetableYearGroup,
      TimetableDay,
      TimetableDayDate,
      TimetableDayRowClass,
      FacilityBooking,
    ]),
    CurriculumModule,
    SchoolModule,
    PeopleModule,
    RbacModule,
  ],
  controllers: [
    TimetableColumnsController,
    TimetablesController,
    TimetableDaysController,
    TimetableSchedulingController,
    FacilityBookingsController,
    ScheduleController,
  ],
  providers: [
    TimetableColumnsRepository,
    TimetableColumnRowsRepository,
    TimetablesRepository,
    TimetableYearGroupsRepository,
    TimetableDaysRepository,
    TimetableDayDatesRepository,
    TimetableDayRowClassesRepository,
    FacilityBookingsRepository,
    TimetableColumnsService,
    TimetablesService,
    TimetableDaysService,
    TimetableSchedulingService,
    TimetableReadModelService,
    FacilityBookingsService,
  ],
  exports: [
    TimetableColumnsRepository,
    TimetablesRepository,
    TimetableDaysRepository,
    TimetableDayDatesRepository,
    TimetableDayRowClassesRepository,
    FacilityBookingsRepository,
  ],
})
export class TimetableModule {}
