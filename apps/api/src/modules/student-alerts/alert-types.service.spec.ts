import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from '../school/school.module';
import { PeopleModule } from '../people/people.module';
import { CurriculumModule } from '../curriculum/curriculum.module';
import { RbacModule } from '../rbac/rbac.module';
import { StudentAlertsModule } from './student-alerts.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { AlertTypesService } from './alert-types.service';

describe('AlertTypesService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let service: AlertTypesService;
  let createdSchoolIds: string[];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        SchoolModule,
        PeopleModule,
        CurriculumModule,
        RbacModule,
        StudentAlertsModule,
      ],
    }).compile();

    schools = module.get(SchoolsRepository);
    service = module.get(AlertTypesService);
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

  it('creates an alert type defaulting adminOnly to true', async () => {
    const school = await createSchool();

    const alertType = await service.create(school.id, { name: 'Medical' });

    expect(alertType.adminOnly).toBe(true);
    expect(await service.list(school.id)).toHaveLength(1);
  });

  it('rejects a duplicate name within the same school as a clean 409', async () => {
    const school = await createSchool();
    await service.create(school.id, { name: 'Medical' });

    await expect(
      service.create(school.id, { name: 'Medical' }),
    ).rejects.toThrow(ConflictException);
  });

  it('throws NotFound updating an alert type belonging to a different school', async () => {
    const school = await createSchool();
    const otherSchool = await createSchool();
    const alertType = await service.create(school.id, {
      name: 'Academic',
      adminOnly: false,
    });

    await expect(
      service.update(otherSchool.id, alertType.id, { name: 'Hijacked' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('soft-removes an alert type', async () => {
    const school = await createSchool();
    const alertType = await service.create(school.id, { name: 'Academic' });

    await service.remove(school.id, alertType.id);

    expect(await service.list(school.id)).toHaveLength(0);
  });
});
