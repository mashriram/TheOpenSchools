import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from '../school/school.module';
import { MarkbookModule } from './markbook.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { ScalesService } from './scales.service';

describe('ScalesService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let service: ScalesService;
  let createdSchoolIds: string[];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        SchoolModule,
        MarkbookModule,
      ],
    }).compile();

    schools = module.get(SchoolsRepository);
    service = module.get(ScalesService);
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

  it('creates and lists a scale for a school', async () => {
    const school = await createSchool();

    const scale = await service.create(school.id, {
      name: 'Attainment Scale',
      shortName: 'ATT',
    });

    expect(scale.active).toBe(true);
    expect(await service.list(school.id)).toHaveLength(1);
  });

  it('rejects a duplicate short name within the same school as a clean 409', async () => {
    const school = await createSchool();
    await service.create(school.id, { name: 'Scale', shortName: 'S1' });

    await expect(
      service.create(school.id, { name: 'Scale Again', shortName: 'S1' }),
    ).rejects.toThrow(ConflictException);
  });

  it('throws NotFound updating a scale belonging to a different school', async () => {
    const school = await createSchool();
    const otherSchool = await createSchool();
    const scale = await service.create(school.id, {
      name: 'Scale',
      shortName: 'S1',
    });

    await expect(
      service.update(otherSchool.id, scale.id, { name: 'Hijacked' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('soft-removes a scale', async () => {
    const school = await createSchool();
    const scale = await service.create(school.id, {
      name: 'Scale',
      shortName: 'S1',
    });

    await service.remove(school.id, scale.id);

    expect(await service.list(school.id)).toHaveLength(0);
  });
});
