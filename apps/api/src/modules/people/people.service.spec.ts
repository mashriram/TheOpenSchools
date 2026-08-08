import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { PeopleModule } from './people.module';
import { SchoolModule } from '../school/school.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { HousesRepository } from '../school/repositories/houses.repository';
import { PeopleService } from './people.service';

describe('PeopleService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let houses: HousesRepository;
  let service: PeopleService;
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
    houses = module.get(HousesRepository);
    service = module.get(PeopleService);
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

  it('creates a person scoped to a school', async () => {
    const school = await createSchool();

    const person = await service.create(school.id, {
      surname: 'Smith',
      firstName: 'Jo',
    });

    expect(person.schoolId).toBe(school.id);
  });

  it('rejects a houseId belonging to a different school', async () => {
    const school = await createSchool();
    const otherSchool = await createSchool();
    const houseInOtherSchool = await houses.save(
      houses.create({
        schoolId: otherSchool.id,
        name: 'Griffindor',
        shortName: 'GRF',
      }),
    );

    await expect(
      service.create(school.id, {
        surname: 'Smith',
        firstName: 'Jo',
        houseId: houseInOtherSchool.id,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('links a houseId from the same school', async () => {
    const school = await createSchool();
    const house = await houses.save(
      houses.create({
        schoolId: school.id,
        name: 'Griffindor',
        shortName: 'GRF',
      }),
    );

    const person = await service.create(school.id, {
      surname: 'Smith',
      firstName: 'Jo',
      houseId: house.id,
    });

    expect(person.houseId).toBe(house.id);
  });

  it('lists people scoped to their school only', async () => {
    const school = await createSchool();
    const otherSchool = await createSchool();
    await service.create(school.id, { surname: 'Smith', firstName: 'Jo' });
    await service.create(otherSchool.id, { surname: 'Doe', firstName: 'Jane' });

    const found = await service.list(school.id, {});

    expect(found.map((p) => p.surname)).toEqual(['Smith']);
  });

  it('returns a full profile including empty related collections', async () => {
    const school = await createSchool();
    const person = await service.create(school.id, {
      surname: 'Smith',
      firstName: 'Jo',
    });

    const profile = await service.getProfile(school.id, person.id);

    expect(profile.roles).toEqual([]);
    expect(profile.phones).toEqual([]);
    expect(profile.staff).toBeNull();
    expect(profile.enrolments).toEqual([]);
  });

  it('throws NotFound for a person belonging to a different school', async () => {
    const school = await createSchool();
    const otherSchool = await createSchool();
    const person = await service.create(school.id, {
      surname: 'Smith',
      firstName: 'Jo',
    });

    await expect(service.getProfile(otherSchool.id, person.id)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('soft-removes a person', async () => {
    const school = await createSchool();
    const person = await service.create(school.id, {
      surname: 'Smith',
      firstName: 'Jo',
    });

    await service.remove(school.id, person.id);

    expect(await service.list(school.id, {})).toHaveLength(0);
  });
});
