import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from './school.module';
import { PeopleModule } from '../people/people.module';
import { SchoolsRepository } from './repositories/schools.repository';
import { PeopleRepository } from '../people/repositories/people.repository';
import { YearGroupsService } from './year-groups.service';

describe('YearGroupsService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let people: PeopleRepository;
  let service: YearGroupsService;
  let createdSchoolIds: string[];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        SchoolModule,
        PeopleModule,
      ],
    }).compile();

    schools = module.get(SchoolsRepository);
    people = module.get(PeopleRepository);
    service = module.get(YearGroupsService);
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

  async function createSchool() {
    const school = await schools.save(
      schools.create({ name: 'Test School', subdomainSlug: randomUUID() }),
    );
    createdSchoolIds.push(school.id);
    return school;
  }

  async function createPerson(schoolId: string) {
    return people.save(
      people.create({
        schoolId,
        surname: 'Smith',
        firstName: 'Jo',
        email: `${randomUUID()}@example.com`,
      }),
    );
  }

  it('creates a year group without a head of year', async () => {
    const school = await createSchool();

    const yearGroup = await service.create(school.id, {
      name: 'Year 7',
      shortName: 'Y7',
      sequenceNumber: 7,
    });

    expect(yearGroup.headOfYearPersonId).toBeNull();
  });

  it('creates a year group with a head of year belonging to the same school', async () => {
    const school = await createSchool();
    const person = await createPerson(school.id);

    const yearGroup = await service.create(school.id, {
      name: 'Year 7',
      shortName: 'Y7',
      sequenceNumber: 7,
      headOfYearPersonId: person.id,
    });

    expect(yearGroup.headOfYearPersonId).toBe(person.id);
  });

  it('rejects a headOfYearPersonId belonging to a different school', async () => {
    const school = await createSchool();
    const otherSchool = await createSchool();
    const personInOtherSchool = await createPerson(otherSchool.id);

    await expect(
      service.create(school.id, {
        name: 'Year 7',
        shortName: 'Y7',
        sequenceNumber: 7,
        headOfYearPersonId: personInOtherSchool.id,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('lists year groups ordered by sequenceNumber', async () => {
    const school = await createSchool();
    await service.create(school.id, {
      name: 'Year 8',
      shortName: 'Y8',
      sequenceNumber: 8,
    });
    await service.create(school.id, {
      name: 'Year 7',
      shortName: 'Y7',
      sequenceNumber: 7,
    });

    const found = await service.list(school.id);

    expect(found.map((yg) => yg.name)).toEqual(['Year 7', 'Year 8']);
  });

  it('throws NotFound updating a year group belonging to a different school', async () => {
    const school = await createSchool();
    const otherSchool = await createSchool();
    const yearGroup = await service.create(school.id, {
      name: 'Year 7',
      shortName: 'Y7',
      sequenceNumber: 7,
    });

    await expect(
      service.update(otherSchool.id, yearGroup.id, { name: 'Hijacked' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('soft-removes a year group', async () => {
    const school = await createSchool();
    const yearGroup = await service.create(school.id, {
      name: 'Year 7',
      shortName: 'Y7',
      sequenceNumber: 7,
    });

    await service.remove(school.id, yearGroup.id);

    expect(await service.list(school.id)).toHaveLength(0);
  });
});
