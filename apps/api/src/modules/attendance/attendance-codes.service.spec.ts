import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from '../school/school.module';
import { PeopleModule } from '../people/people.module';
import { CurriculumModule } from '../curriculum/curriculum.module';
import { RbacModule } from '../rbac/rbac.module';
import { AttendanceModule } from './attendance.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { RolesRepository } from '../rbac/repositories/roles.repository';
import { AttendanceCodesService } from './attendance-codes.service';

describe('AttendanceCodesService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let roles: RolesRepository;
  let service: AttendanceCodesService;
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
        AttendanceModule,
      ],
    }).compile();

    schools = module.get(SchoolsRepository);
    roles = module.get(RolesRepository);
    service = module.get(AttendanceCodesService);
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

  it('creates and lists an attendance code', async () => {
    const school = await createSchool();

    const code = await service.create(school.id, {
      name: 'Present',
      shortName: 'P',
      direction: 'In',
      scope: 'Onsite',
    });

    expect(code.active).toBe(true);
    expect(await service.list(school.id)).toHaveLength(1);
  });

  it('rejects a duplicate short name within the same school as a clean 409', async () => {
    const school = await createSchool();
    await service.create(school.id, {
      name: 'Present',
      shortName: 'P',
      direction: 'In',
      scope: 'Onsite',
    });

    await expect(
      service.create(school.id, {
        name: 'Present Again',
        shortName: 'P',
        direction: 'In',
        scope: 'Onsite',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('throws NotFound updating a code belonging to a different school', async () => {
    const school = await createSchool();
    const otherSchool = await createSchool();
    const code = await service.create(school.id, {
      name: 'Present',
      shortName: 'P',
      direction: 'In',
      scope: 'Onsite',
    });

    await expect(
      service.update(otherSchool.id, code.id, { name: 'Hijacked' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('manages restricted roles for a code', async () => {
    const school = await createSchool();
    const code = await service.create(school.id, {
      name: 'Medical',
      shortName: 'MED',
      direction: 'Out',
      scope: 'Offsite',
    });
    const staffRole = await roles.save(
      roles.create({
        schoolId: school.id,
        category: 'Staff',
        name: randomUUID(),
        shortName: 'Stf',
        description: 'test role',
        restriction: 'None',
      }),
    );

    expect(await service.listRestrictedRoleIds(code.id)).toEqual([]);

    await service.setRestrictedRoles(school.id, code.id, [staffRole.id]);

    expect(await service.listRestrictedRoleIds(code.id)).toEqual([
      staffRole.id,
    ]);
  });

  it('soft-removes a code', async () => {
    const school = await createSchool();
    const code = await service.create(school.id, {
      name: 'Present',
      shortName: 'P',
      direction: 'In',
      scope: 'Onsite',
    });

    await service.remove(school.id, code.id);

    expect(await service.list(school.id)).toHaveLength(0);
  });
});
