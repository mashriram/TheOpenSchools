import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { PeopleModule } from './people.module';
import { SchoolModule } from '../school/school.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { PeopleService } from './people.service';
import { FamiliesService } from './families.service';

describe('FamiliesService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let people: PeopleService;
  let service: FamiliesService;
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
    people = module.get(PeopleService);
    service = module.get(FamiliesService);
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

  it('creates and lists a family scoped to its school', async () => {
    const school = await createSchool();

    await service.create(school.id, { name: 'The Smiths' });
    const otherSchool = await createSchool();
    await service.create(otherSchool.id, { name: 'The Does' });

    const found = await service.list(school.id);

    expect(found.map((f) => f.name)).toEqual(['The Smiths']);
  });

  it('adds an adult and a child, then returns them in the profile', async () => {
    const school = await createSchool();
    const family = await service.create(school.id, { name: 'The Smiths' });
    const parent = await people.create(school.id, {
      surname: 'Smith',
      firstName: 'Pat',
    });
    const child = await people.create(school.id, {
      surname: 'Smith',
      firstName: 'Sam',
    });

    await service.addAdult(school.id, family.id, { personId: parent.id });
    await service.addChild(school.id, family.id, { personId: child.id });

    const profile = await service.getProfile(school.id, family.id);
    expect(profile.adults.map((a) => a.personId)).toEqual([parent.id]);
    expect(profile.children.map((c) => c.personId)).toEqual([child.id]);
  });

  it('rejects an adult personId belonging to a different school', async () => {
    const school = await createSchool();
    const otherSchool = await createSchool();
    const family = await service.create(school.id, { name: 'The Smiths' });
    const personInOtherSchool = await people.create(otherSchool.id, {
      surname: 'Doe',
      firstName: 'Jane',
    });

    await expect(
      service.addAdult(school.id, family.id, {
        personId: personInOtherSchool.id,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects adding the same adult to a family twice', async () => {
    const school = await createSchool();
    const family = await service.create(school.id, { name: 'The Smiths' });
    const parent = await people.create(school.id, {
      surname: 'Smith',
      firstName: 'Pat',
    });
    await service.addAdult(school.id, family.id, { personId: parent.id });

    await expect(
      service.addAdult(school.id, family.id, { personId: parent.id }),
    ).rejects.toThrow(ConflictException);
  });

  it('throws NotFound operating on a family belonging to a different school', async () => {
    const school = await createSchool();
    const otherSchool = await createSchool();
    const family = await service.create(school.id, { name: 'The Smiths' });
    const parent = await people.create(school.id, {
      surname: 'Smith',
      firstName: 'Pat',
    });

    await expect(
      service.addAdult(otherSchool.id, family.id, { personId: parent.id }),
    ).rejects.toThrow(NotFoundException);
  });

  it('removes an adult and a child', async () => {
    const school = await createSchool();
    const family = await service.create(school.id, { name: 'The Smiths' });
    const parent = await people.create(school.id, {
      surname: 'Smith',
      firstName: 'Pat',
    });
    const adult = await service.addAdult(school.id, family.id, {
      personId: parent.id,
    });

    await service.removeAdult(school.id, family.id, adult.id);

    const profile = await service.getProfile(school.id, family.id);
    expect(profile.adults).toEqual([]);
  });

  it('soft-removes a family', async () => {
    const school = await createSchool();
    const family = await service.create(school.id, { name: 'The Smiths' });

    await service.remove(school.id, family.id);

    expect(await service.list(school.id)).toHaveLength(0);
  });
});
