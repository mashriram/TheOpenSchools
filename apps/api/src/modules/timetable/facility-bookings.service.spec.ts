import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from '../school/school.module';
import { PeopleModule } from '../people/people.module';
import { CurriculumModule } from '../curriculum/curriculum.module';
import { TimetableModule } from './timetable.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { SpacesService } from '../school/spaces.service';
import { PeopleRepository } from '../people/repositories/people.repository';
import { FacilityBookingsService } from './facility-bookings.service';

describe('FacilityBookingsService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let spacesService: SpacesService;
  let people: PeopleRepository;
  let service: FacilityBookingsService;
  let createdSchoolIds: string[];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        SchoolModule,
        PeopleModule,
        CurriculumModule,
        TimetableModule,
      ],
    }).compile();

    schools = module.get(SchoolsRepository);
    spacesService = module.get(SpacesService);
    people = module.get(PeopleRepository);
    service = module.get(FacilityBookingsService);
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

  async function setUp() {
    const school = await schools.save(
      schools.create({ name: 'Test School', subdomainSlug: randomUUID() }),
    );
    createdSchoolIds.push(school.id);
    const space = await spacesService.create(school.id, { name: 'Lab 1' });
    const person = await people.save(
      people.create({
        schoolId: school.id,
        surname: 'Booker',
        firstName: 'Bo',
      }),
    );
    return { school, space, person };
  }

  it('creates a booking', async () => {
    const { school, space, person } = await setUp();

    const booking = await service.create(school.id, {
      spaceId: space.id,
      personId: person.id,
      date: '2025-03-03',
      timeStart: '10:00',
      timeEnd: '11:00',
      reason: 'Science club',
    });

    expect(booking.reason).toBe('Science club');
  });

  it('rejects an overlapping booking for the same space/date as a clean 409', async () => {
    const { school, space, person } = await setUp();
    await service.create(school.id, {
      spaceId: space.id,
      personId: person.id,
      date: '2025-03-03',
      timeStart: '10:00',
      timeEnd: '11:00',
      reason: 'Science club',
    });

    await expect(
      service.create(school.id, {
        spaceId: space.id,
        personId: person.id,
        date: '2025-03-03',
        timeStart: '10:30',
        timeEnd: '11:30',
        reason: 'Overlapping booking',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('allows a non-overlapping booking for the same space/date', async () => {
    const { school, space, person } = await setUp();
    await service.create(school.id, {
      spaceId: space.id,
      personId: person.id,
      date: '2025-03-03',
      timeStart: '10:00',
      timeEnd: '11:00',
      reason: 'Science club',
    });

    await expect(
      service.create(school.id, {
        spaceId: space.id,
        personId: person.id,
        date: '2025-03-03',
        timeStart: '11:00',
        timeEnd: '12:00',
        reason: 'Back-to-back booking',
      }),
    ).resolves.toBeDefined();
  });

  it('rejects a spaceId from a different school', async () => {
    const { school, person } = await setUp();
    const other = await setUp();

    await expect(
      service.create(school.id, {
        spaceId: other.space.id,
        personId: person.id,
        date: '2025-03-03',
        timeStart: '10:00',
        timeEnd: '11:00',
        reason: 'Cross-tenant attempt',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('soft-removes a booking', async () => {
    const { school, space, person } = await setUp();
    const booking = await service.create(school.id, {
      spaceId: space.id,
      personId: person.id,
      date: '2025-03-03',
      timeStart: '10:00',
      timeEnd: '11:00',
      reason: 'Science club',
    });

    await service.remove(school.id, booking.id);

    expect(
      await service.list(school.id, '2025-01-01', '2025-12-31'),
    ).toHaveLength(0);
  });
});
