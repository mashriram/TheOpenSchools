import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from './school.module';
import { SchoolsRepository } from './repositories/schools.repository';
import { HousesService } from './houses.service';

describe('HousesService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let service: HousesService;
  let createdSchoolIds: string[];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        SchoolModule,
      ],
    }).compile();

    schools = module.get(SchoolsRepository);
    service = module.get(HousesService);
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

  it('creates and lists a house scoped to its school', async () => {
    const school = await createSchool();

    await service.create(school.id, { name: 'Griffindor', shortName: 'GRF' });
    const otherSchool = await createSchool();
    await service.create(otherSchool.id, {
      name: 'Slytherin',
      shortName: 'SLY',
    });

    const found = await service.list(school.id);

    expect(found.map((h) => h.name)).toEqual(['Griffindor']);
  });

  it('updates a house', async () => {
    const school = await createSchool();
    const house = await service.create(school.id, {
      name: 'Griffindor',
      shortName: 'GRF',
    });

    const updated = await service.update(school.id, house.id, {
      name: 'Gryffindor',
    });

    expect(updated.name).toBe('Gryffindor');
  });

  it('throws NotFound updating a house belonging to a different school', async () => {
    const school = await createSchool();
    const otherSchool = await createSchool();
    const house = await service.create(school.id, {
      name: 'Griffindor',
      shortName: 'GRF',
    });

    await expect(
      service.update(otherSchool.id, house.id, { name: 'Hijacked' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('soft-removes a house', async () => {
    const school = await createSchool();
    const house = await service.create(school.id, {
      name: 'Griffindor',
      shortName: 'GRF',
    });

    await service.remove(school.id, house.id);

    expect(await service.list(school.id)).toHaveLength(0);
  });

  it('rejects a duplicate house name within the same school as a clean 409, not a raw DB error', async () => {
    const school = await createSchool();
    await service.create(school.id, { name: 'Griffindor', shortName: 'GRF' });

    await expect(
      service.create(school.id, { name: 'Griffindor', shortName: 'GR2' }),
    ).rejects.toThrow(ConflictException);
    expect(await service.list(school.id)).toHaveLength(1);
  });

  it('rejects renaming a house to a name already used by another house at the same school', async () => {
    const school = await createSchool();
    await service.create(school.id, { name: 'Griffindor', shortName: 'GRF' });
    const other = await service.create(school.id, {
      name: 'Slytherin',
      shortName: 'SLY',
    });

    await expect(
      service.update(school.id, other.id, { name: 'Griffindor' }),
    ).rejects.toThrow(ConflictException);
  });

  it('allows the same house name across two different schools', async () => {
    const school = await createSchool();
    const otherSchool = await createSchool();
    await service.create(school.id, { name: 'Griffindor', shortName: 'GRF' });

    await expect(
      service.create(otherSchool.id, { name: 'Griffindor', shortName: 'GRF' }),
    ).resolves.toBeDefined();
  });
});
