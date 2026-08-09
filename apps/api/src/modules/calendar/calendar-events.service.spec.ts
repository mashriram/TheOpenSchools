import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
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
import { CalendarsService } from './calendars.service';
import { CalendarEventsService } from './calendar-events.service';

describe('CalendarEventsService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let schoolYears: SchoolYearsRepository;
  let people: PeopleRepository;
  let roles: RolesRepository;
  let calendars: CalendarsService;
  let service: CalendarEventsService;
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
    calendars = module.get(CalendarsService);
    service = module.get(CalendarEventsService);
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

  it('creates, updates, and removes an event on an owned calendar', async () => {
    const { school, schoolYear } = await setUpSchool();
    const calendar = await calendars.create(school.id, schoolYear.id, {
      name: 'Whole School',
    });
    const creator = await people.save(
      people.create({
        schoolId: school.id,
        surname: 'Creator',
        firstName: 'C',
      }),
    );

    const event = await service.create(school.id, calendar.id, creator.id, {
      name: 'Sports Day',
      dateStart: '2026-09-10',
      dateEnd: '2026-09-10',
    });
    expect(event.createdByPersonId).toBe(creator.id);

    const updated = await service.update(school.id, event.id, {
      name: 'Sports Day (renamed)',
    });
    expect(updated.name).toBe('Sports Day (renamed)');

    await service.remove(school.id, event.id);
    await expect(service.getOwned(school.id, event.id)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects creating an event on a calendar from another school', async () => {
    const { school: foreignSchool, schoolYear: foreignYear } =
      await setUpSchool();
    const { school } = await setUpSchool();
    const foreignCalendar = await calendars.create(
      foreignSchool.id,
      foreignYear.id,
      {
        name: 'Foreign',
      },
    );
    const creator = await people.save(
      people.create({
        schoolId: school.id,
        surname: 'Creator',
        firstName: 'C',
      }),
    );

    await expect(
      service.create(school.id, foreignCalendar.id, creator.id, {
        name: 'Sports Day',
        dateStart: '2026-09-10',
        dateEnd: '2026-09-10',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects an organiserPersonId belonging to another school', async () => {
    const { school, schoolYear } = await setUpSchool();
    const calendar = await calendars.create(school.id, schoolYear.id, {
      name: 'Whole School',
    });
    const creator = await people.save(
      people.create({
        schoolId: school.id,
        surname: 'Creator',
        firstName: 'C',
      }),
    );
    const { school: otherSchool } = await setUpSchool();
    const stranger = await people.save(
      people.create({
        schoolId: otherSchool.id,
        surname: 'Stranger',
        firstName: 'S',
      }),
    );

    await expect(
      service.create(school.id, calendar.id, creator.id, {
        name: 'Sports Day',
        dateStart: '2026-09-10',
        dateEnd: '2026-09-10',
        organiserPersonId: stranger.id,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('manages event participants', async () => {
    const { school, schoolYear } = await setUpSchool();
    const calendar = await calendars.create(school.id, schoolYear.id, {
      name: 'Whole School',
    });
    const creator = await people.save(
      people.create({
        schoolId: school.id,
        surname: 'Creator',
        firstName: 'C',
      }),
    );
    const event = await service.create(school.id, calendar.id, creator.id, {
      name: 'Sports Day',
      dateStart: '2026-09-10',
      dateEnd: '2026-09-10',
    });
    const attendee = await people.save(
      people.create({
        schoolId: school.id,
        surname: 'Attendee',
        firstName: 'A',
      }),
    );

    const participant = await service.addParticipant(school.id, event.id, {
      personId: attendee.id,
    });
    expect(await service.listParticipants(school.id, event.id)).toEqual([
      expect.objectContaining({ personId: attendee.id }),
    ]);

    await service.removeParticipant(school.id, participant.id);
    expect(await service.listParticipants(school.id, event.id)).toEqual([]);
  });

  describe('listVisibleEventsInRange', () => {
    async function setUpRole(schoolId: string, category: 'Staff' | 'Student') {
      return roles.save(
        roles.create({
          schoolId,
          category,
          name: randomUUID(),
          shortName: category.slice(0, 3),
          description: 'test role',
          restriction: 'None',
        }),
      );
    }

    it('includes broadly visible events and excludes non-visible ones for the viewer role', async () => {
      const { school, schoolYear } = await setUpSchool();
      const creator = await people.save(
        people.create({
          schoolId: school.id,
          surname: 'Creator',
          firstName: 'C',
        }),
      );
      const staffCalendar = await calendars.create(school.id, schoolYear.id, {
        name: 'Staff Only',
        viewableStaff: true,
      });
      const studentCalendar = await calendars.create(school.id, schoolYear.id, {
        name: 'Students Only',
        viewableStudents: true,
      });
      const staffEvent = await service.create(
        school.id,
        staffCalendar.id,
        creator.id,
        {
          name: 'Staff Meeting',
          dateStart: '2026-09-10',
          dateEnd: '2026-09-10',
        },
      );
      await service.create(school.id, studentCalendar.id, creator.id, {
        name: 'Student Assembly',
        dateStart: '2026-09-10',
        dateEnd: '2026-09-10',
      });
      const staffRole = await setUpRole(school.id, 'Staff');
      const staff = await people.save(
        people.create({
          schoolId: school.id,
          surname: 'Staff',
          firstName: 'S',
        }),
      );

      const visible = await service.listVisibleEventsInRange(
        school.id,
        schoolYear.id,
        '2026-09-01',
        '2026-09-30',
        staff.id,
        staffRole.id,
      );

      expect(visible).toEqual([expect.objectContaining({ id: staffEvent.id })]);
    });

    it('excludes Cancelled/Tentative events from the default visible list', async () => {
      const { school, schoolYear } = await setUpSchool();
      const creator = await people.save(
        people.create({
          schoolId: school.id,
          surname: 'Creator',
          firstName: 'C',
        }),
      );
      const calendar = await calendars.create(school.id, schoolYear.id, {
        name: 'Public',
        public: true,
      });
      await service.create(school.id, calendar.id, creator.id, {
        name: 'Cancelled Trip',
        status: 'Cancelled',
        dateStart: '2026-09-10',
        dateEnd: '2026-09-10',
      });
      const staffRole = await setUpRole(school.id, 'Staff');
      const staff = await people.save(
        people.create({
          schoolId: school.id,
          surname: 'Staff',
          firstName: 'S',
        }),
      );

      const visible = await service.listVisibleEventsInRange(
        school.id,
        schoolYear.id,
        '2026-09-01',
        '2026-09-30',
        staff.id,
        staffRole.id,
      );

      expect(visible).toEqual([]);
    });

    it('shows a participant-only calendar event only to its actual participants', async () => {
      const { school, schoolYear } = await setUpSchool();
      const creator = await people.save(
        people.create({
          schoolId: school.id,
          surname: 'Creator',
          firstName: 'C',
        }),
      );
      const participantOnlyCalendar = await calendars.create(
        school.id,
        schoolYear.id,
        {
          name: 'Sports Team',
          viewableParticipants: true,
        },
      );
      const event = await service.create(
        school.id,
        participantOnlyCalendar.id,
        creator.id,
        {
          name: 'Team Practice',
          dateStart: '2026-09-10',
          dateEnd: '2026-09-10',
        },
      );
      const studentRole = await setUpRole(school.id, 'Student');
      const participant = await people.save(
        people.create({
          schoolId: school.id,
          surname: 'Participant',
          firstName: 'P',
        }),
      );
      const bystander = await people.save(
        people.create({
          schoolId: school.id,
          surname: 'Bystander',
          firstName: 'B',
        }),
      );
      await service.addParticipant(school.id, event.id, {
        personId: participant.id,
      });

      const visibleToParticipant = await service.listVisibleEventsInRange(
        school.id,
        schoolYear.id,
        '2026-09-01',
        '2026-09-30',
        participant.id,
        studentRole.id,
      );
      const visibleToBystander = await service.listVisibleEventsInRange(
        school.id,
        schoolYear.id,
        '2026-09-01',
        '2026-09-30',
        bystander.id,
        studentRole.id,
      );

      expect(visibleToParticipant).toEqual([
        expect.objectContaining({ id: event.id }),
      ]);
      expect(visibleToBystander).toEqual([]);
    });
  });
});
