import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from './school.module';
import { SchoolsRepository } from './repositories/schools.repository';
import { SpacesService } from './spaces.service';

describe('SpacesService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let service: SpacesService;
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
    service = module.get(SpacesService);
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

  it('creates a space with defaults applied for omitted boolean fields', async () => {
    const school = await createSchool();

    const space = await service.create(school.id, { name: 'Main Hall' });

    expect(space.active).toBe(true);
    expect(space.bookable).toBe(true);
    expect(space.hasProjector).toBe(false);
  });

  it('lists spaces scoped to their school only', async () => {
    const school = await createSchool();
    const otherSchool = await createSchool();
    await service.create(school.id, { name: 'Main Hall' });
    await service.create(otherSchool.id, { name: 'Gym' });

    const found = await service.list(school.id);

    expect(found.map((s) => s.name)).toEqual(['Main Hall']);
  });

  it('updates equipment flags', async () => {
    const school = await createSchool();
    const space = await service.create(school.id, { name: 'Lab 1' });

    const updated = await service.update(school.id, space.id, {
      hasComputer: true,
      computerStudentCount: 24,
    });

    expect(updated.hasComputer).toBe(true);
    expect(updated.computerStudentCount).toBe(24);
  });

  it('throws NotFound for a space belonging to a different school', async () => {
    const school = await createSchool();
    const otherSchool = await createSchool();
    const space = await service.create(school.id, { name: 'Lab 1' });

    await expect(
      service.update(otherSchool.id, space.id, { name: 'Hijacked' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('soft-removes a space', async () => {
    const school = await createSchool();
    const space = await service.create(school.id, { name: 'Lab 1' });

    await service.remove(school.id, space.id);

    expect(await service.list(school.id)).toHaveLength(0);
  });

  it('rejects a duplicate space name within the same school as a clean 409', async () => {
    const school = await createSchool();
    await service.create(school.id, { name: 'Lab 1' });

    await expect(service.create(school.id, { name: 'Lab 1' })).rejects.toThrow(
      ConflictException,
    );
  });
});
