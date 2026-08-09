import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from '../school/school.module';
import { PeopleModule } from '../people/people.module';
import { RbacModule } from '../rbac/rbac.module';
import { TimetableModule } from '../timetable/timetable.module';
import { CalendarModule } from './calendar.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';
import { PeopleRepository } from '../people/repositories/people.repository';
import { CalendarsService } from './calendars.service';

describe('CalendarsService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let schoolYears: SchoolYearsRepository;
  let people: PeopleRepository;
  let service: CalendarsService;
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
    service = module.get(CalendarsService);
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

  it('creates and lists a calendar scoped to a school year', async () => {
    const { school, schoolYear } = await setUpSchool();

    const calendar = await service.create(school.id, schoolYear.id, {
      name: 'Whole School',
    });

    const list = await service.list(school.id, schoolYear.id);
    expect(list).toEqual([expect.objectContaining({ id: calendar.id })]);
  });

  it('rejects creating a calendar under a school year from another school', async () => {
    const { schoolYear: foreignSchoolYear } = await setUpSchool();
    const { school } = await setUpSchool();

    await expect(
      service.create(school.id, foreignSchoolYear.id, { name: 'Whole School' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a duplicate calendar name within the same school year', async () => {
    const { school, schoolYear } = await setUpSchool();
    await service.create(school.id, schoolYear.id, { name: 'Whole School' });

    await expect(
      service.create(school.id, schoolYear.id, { name: 'Whole School' }),
    ).rejects.toThrow(ConflictException);
  });

  it('throws 404 when updating a calendar from another school', async () => {
    const { school, schoolYear } = await setUpSchool();
    const calendar = await service.create(school.id, schoolYear.id, {
      name: 'Whole School',
    });
    const { school: otherSchool } = await setUpSchool();

    await expect(
      service.update(otherSchool.id, calendar.id, { name: 'Renamed' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('adds and lists an editor scoped to the correct school', async () => {
    const { school, schoolYear } = await setUpSchool();
    const calendar = await service.create(school.id, schoolYear.id, {
      name: 'Whole School',
    });
    const teacher = await people.save(
      people.create({
        schoolId: school.id,
        surname: 'Teacher',
        firstName: 'T',
      }),
    );

    await service.addEditor(school.id, calendar.id, teacher.id, true);
    const editors = await service.listEditors(school.id, calendar.id);

    expect(editors).toEqual([
      expect.objectContaining({ personId: teacher.id, editAllEvents: true }),
    ]);
  });

  it('rejects adding an editor whose person belongs to another school', async () => {
    const { school, schoolYear } = await setUpSchool();
    const calendar = await service.create(school.id, schoolYear.id, {
      name: 'Whole School',
    });
    const { school: otherSchool } = await setUpSchool();
    const stranger = await people.save(
      people.create({
        schoolId: otherSchool.id,
        surname: 'Stranger',
        firstName: 'S',
      }),
    );

    await expect(
      service.addEditor(school.id, calendar.id, stranger.id, false),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws 404 when listing editors for a calendar from another school', async () => {
    const { school, schoolYear } = await setUpSchool();
    const calendar = await service.create(school.id, schoolYear.id, {
      name: 'Whole School',
    });
    const { school: otherSchool } = await setUpSchool();

    await expect(
      service.listEditors(otherSchool.id, calendar.id),
    ).rejects.toThrow(NotFoundException);
  });
});
