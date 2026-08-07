import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { QueryFailedError } from 'typeorm';
import { DatabaseModule } from '../../../database/database.module';
import { SchoolModule } from '../../school/school.module';
import { SchoolsRepository } from '../../school/repositories/schools.repository';
import { School } from '../../school/entities/school.entity';
import { RbacModule } from '../rbac.module';
import { RolesRepository } from './roles.repository';

describe('RolesRepository (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let roles: RolesRepository;
  let createdSchoolIds: string[];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        SchoolModule,
        RbacModule,
      ],
    }).compile();

    schools = module.get(SchoolsRepository);
    roles = module.get(RolesRepository);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(() => {
    createdSchoolIds = [];
  });

  afterEach(async () => {
    // Cascades to rbac_roles (and, transitively, rbac_permissions).
    if (createdSchoolIds.length > 0) {
      await schools.delete(createdSchoolIds);
    }
  });

  async function createSchool(): Promise<School> {
    const school = await schools.save(
      schools.create({ name: 'Test School', subdomainSlug: randomUUID() }),
    );
    createdSchoolIds.push(school.id);
    return school;
  }

  function buildRole(
    schoolId: string,
    overrides: Record<string, unknown> = {},
  ) {
    return roles.create({
      schoolId,
      category: 'Staff',
      name: 'Administrator',
      shortName: 'Adm',
      description: 'Controls all aspects of the system',
      restriction: 'AdminOnly',
      ...overrides,
    });
  }

  it('persists a role with sensible defaults', async () => {
    const school = await createSchool();

    const role = await roles.save(buildRole(school.id));

    expect(role.type).toBe('Core');
    expect(role.canLogin).toBe(true);
    expect(role.futureYearsLogin).toBe(true);
    expect(role.pastYearsLogin).toBe(true);
  });

  it('findBySchool returns every role for that school', async () => {
    const school = await createSchool();
    await roles.save(buildRole(school.id, { name: 'Administrator' }));
    await roles.save(
      buildRole(school.id, {
        name: 'Teacher',
        shortName: 'Tcr',
        restriction: 'None',
      }),
    );

    const found = await roles.findBySchool(school.id);

    expect(found.map((r) => r.name).sort()).toEqual([
      'Administrator',
      'Teacher',
    ]);
  });

  it('findBySchoolAndName finds a specific role', async () => {
    const school = await createSchool();
    await roles.save(buildRole(school.id, { name: 'Administrator' }));

    const found = await roles.findBySchoolAndName(school.id, 'Administrator');

    expect(found?.shortName).toBe('Adm');
  });

  it('findBySchoolAndName returns null when the role does not exist', async () => {
    const school = await createSchool();

    expect(
      await roles.findBySchoolAndName(school.id, 'Nonexistent'),
    ).toBeNull();
  });

  it('rejects two roles with the same name under the same school', async () => {
    const school = await createSchool();
    await roles.save(buildRole(school.id, { name: 'Administrator' }));

    await expect(
      roles.save(
        buildRole(school.id, { name: 'Administrator', shortName: 'Adm2' }),
      ),
    ).rejects.toThrow(QueryFailedError);
  });

  it('allows the same role name across two different schools', async () => {
    const schoolA = await createSchool();
    const schoolB = await createSchool();
    await roles.save(buildRole(schoolA.id, { name: 'Administrator' }));

    const roleB = await roles.save(
      buildRole(schoolB.id, { name: 'Administrator' }),
    );

    expect(roleB.name).toBe('Administrator');
  });

  it('cascade-deletes roles when the parent school is hard-deleted', async () => {
    const school = await createSchool();
    const role = await roles.save(buildRole(school.id));

    await schools.delete(school.id);
    createdSchoolIds = createdSchoolIds.filter((id) => id !== school.id);

    expect(await roles.findOne({ where: { id: role.id } })).toBeNull();
  });
});
