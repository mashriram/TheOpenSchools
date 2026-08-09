import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from '../school/school.module';
import { PeopleModule } from '../people/people.module';
import { RbacModule } from '../rbac/rbac.module';
import { TimetableModule } from '../timetable/timetable.module';
import { CalendarModule } from './calendar.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { CalendarEventTypesService } from './calendar-event-types.service';

describe('CalendarEventTypesService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let service: CalendarEventTypesService;
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
    service = module.get(CalendarEventTypesService);
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
    return { school };
  }

  it('creates and lists event types for a school', async () => {
    const { school } = await setUpSchool();

    const type = await service.create(school.id, { name: 'Trip' });
    const list = await service.list(school.id);

    expect(list).toEqual([
      expect.objectContaining({ id: type.id, name: 'Trip' }),
    ]);
  });

  it('rejects a duplicate event type name within the same school', async () => {
    const { school } = await setUpSchool();
    await service.create(school.id, { name: 'Trip' });

    await expect(service.create(school.id, { name: 'Trip' })).rejects.toThrow(
      ConflictException,
    );
  });

  it('allows the same event type name in a different school', async () => {
    const { school: schoolA } = await setUpSchool();
    const { school: schoolB } = await setUpSchool();
    await service.create(schoolA.id, { name: 'Trip' });

    await expect(service.create(schoolB.id, { name: 'Trip' })).resolves.toEqual(
      expect.objectContaining({ name: 'Trip' }),
    );
  });

  it('throws 404 when removing an event type from another school', async () => {
    const { school } = await setUpSchool();
    const type = await service.create(school.id, { name: 'Trip' });
    const { school: otherSchool } = await setUpSchool();

    await expect(service.remove(otherSchool.id, type.id)).rejects.toThrow(
      NotFoundException,
    );
  });
});
