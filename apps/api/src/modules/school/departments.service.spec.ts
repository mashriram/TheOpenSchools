import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from './school.module';
import { SchoolsRepository } from './repositories/schools.repository';
import { DepartmentsService } from './departments.service';

describe('DepartmentsService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let service: DepartmentsService;
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
    service = module.get(DepartmentsService);
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

  it('creates a department, defaulting sequenceNumber to 0', async () => {
    const school = await createSchool();

    const department = await service.create(school.id, {
      type: 'LearningArea',
      name: 'Mathematics',
      shortName: 'MATH',
    });

    expect(department.sequenceNumber).toBe(0);
    expect(department.type).toBe('LearningArea');
  });

  it('lists departments ordered by sequenceNumber', async () => {
    const school = await createSchool();
    await service.create(school.id, {
      type: 'LearningArea',
      name: 'Science',
      shortName: 'SCI',
      sequenceNumber: 2,
    });
    await service.create(school.id, {
      type: 'LearningArea',
      name: 'Mathematics',
      shortName: 'MATH',
      sequenceNumber: 1,
    });

    const found = await service.list(school.id);

    expect(found.map((d) => d.name)).toEqual(['Mathematics', 'Science']);
  });

  it('throws NotFound updating a department belonging to a different school', async () => {
    const school = await createSchool();
    const otherSchool = await createSchool();
    const department = await service.create(school.id, {
      type: 'Administration',
      name: 'Front Office',
      shortName: 'FO',
    });

    await expect(
      service.update(otherSchool.id, department.id, { name: 'Hijacked' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('soft-removes a department', async () => {
    const school = await createSchool();
    const department = await service.create(school.id, {
      type: 'Administration',
      name: 'Front Office',
      shortName: 'FO',
    });

    await service.remove(school.id, department.id);

    expect(await service.list(school.id)).toHaveLength(0);
  });
});
