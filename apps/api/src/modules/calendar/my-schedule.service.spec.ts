import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ForbiddenException } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from '../school/school.module';
import { PeopleModule } from '../people/people.module';
import { RbacModule } from '../rbac/rbac.module';
import { TimetableModule } from '../timetable/timetable.module';
import { CalendarModule } from './calendar.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';
import { PeopleRepository } from '../people/repositories/people.repository';
import { RolesRepository } from '../rbac/repositories/roles.repository';
import { SpacesRepository } from '../school/repositories/spaces.repository';
import { FacilityBookingsRepository } from '../timetable/repositories/facility-bookings.repository';
import { CalendarsService } from './calendars.service';
import { CalendarEventsService } from './calendar-events.service';
import { MyScheduleService } from './my-schedule.service';

describe('MyScheduleService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let schoolYears: SchoolYearsRepository;
  let people: PeopleRepository;
  let roles: RolesRepository;
  let spaces: SpacesRepository;
  let facilityBookings: FacilityBookingsRepository;
  let calendars: CalendarsService;
  let events: CalendarEventsService;
  let service: MyScheduleService;
  let createdSchoolIds: string[];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        SchoolModule,
        PeopleModule,
        RbacModule,
        TimetableModule,
        CalendarModule,
      ],
    }).compile();

    schools = module.get(SchoolsRepository);
    schoolYears = module.get(SchoolYearsRepository);
    people = module.get(PeopleRepository);
    roles = module.get(RolesRepository);
    spaces = module.get(SpacesRepository);
    facilityBookings = module.get(FacilityBookingsRepository);
    calendars = module.get(CalendarsService);
    events = module.get(CalendarEventsService);
    service = module.get(MyScheduleService);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(() => {
    createdSchoolIds = [];
  });

  afterEach(async () => {
    if (createdSchoolIds.length > 0) {
      await schools.delete(createdSchoolIds);
    }
  });

  async function setUpSchool() {
    const school = await schools.save(
      schools.create({ name: 'Test School', subdomainSlug: randomUUID() }),
    );
    createdSchoolIds.push(school.id);
    const schoolYear = await schoolYears.save(
      schoolYears.create({
        schoolId: school.id,
        name: '2024-25',
        sequenceNumber: 1,
      }),
    );
    return { school, schoolYear };
  }

  it('merges calendar events and facility bookings for the caller viewing their own schedule', async () => {
    const { school, schoolYear } = await setUpSchool();
    const staffRole = await roles.save(
      roles.create({
        schoolId: school.id,
        category: 'Staff',
        name: randomUUID(),
        shortName: 'STF',
        description: 'test role',
        restriction: 'None',
      }),
    );
    const teacher = await people.save(
      people.create({
        schoolId: school.id,
        surname: 'Teacher',
        firstName: 'T',
      }),
    );
    const calendar = await calendars.create(school.id, schoolYear.id, {
      name: 'Whole School',
      public: true,
    });
    const event = await events.create(school.id, calendar.id, teacher.id, {
      name: 'Staff Briefing',
      dateStart: '2026-09-10',
      dateEnd: '2026-09-10',
    });
    const space = await spaces.save(
      spaces.create({ schoolId: school.id, name: 'Hall' }),
    );
    const booking = await facilityBookings.save(
      facilityBookings.create({
        spaceId: space.id,
        personId: teacher.id,
        date: '2026-09-10',
        timeStart: '10:00',
        timeEnd: '11:00',
        reason: 'Room hold',
      }),
    );

    const schedule = await service.getMergedSchedule(
      school.id,
      schoolYear.id,
      teacher.id,
      teacher.id,
      staffRole.id,
      '2026-09-01',
      '2026-09-30',
    );

    expect(schedule.periods).toEqual([]);
    expect(schedule.events).toEqual([
      expect.objectContaining({ id: event.id }),
    ]);
    expect(schedule.facilityBookings).toEqual([
      expect.objectContaining({ id: booking.id }),
    ]);
  });

  it('forbids viewing another unrelated person’s merged schedule', async () => {
    const { school, schoolYear } = await setUpSchool();
    const studentRole = await roles.save(
      roles.create({
        schoolId: school.id,
        category: 'Student',
        name: randomUUID(),
        shortName: 'STU',
        description: 'test role',
        restriction: 'None',
      }),
    );
    const caller = await people.save(
      people.create({ schoolId: school.id, surname: 'Caller', firstName: 'C' }),
    );
    const target = await people.save(
      people.create({ schoolId: school.id, surname: 'Target', firstName: 'T' }),
    );

    await expect(
      service.getMergedSchedule(
        school.id,
        schoolYear.id,
        target.id,
        caller.id,
        studentRole.id,
        '2026-09-01',
        '2026-09-30',
      ),
    ).rejects.toThrow(ForbiddenException);
  });
});
