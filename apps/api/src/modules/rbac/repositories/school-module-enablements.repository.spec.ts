import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { QueryFailedError } from 'typeorm';
import { DatabaseModule } from '../../../database/database.module';
import { SchoolModule } from '../../school/school.module';
import { SchoolsRepository } from '../../school/repositories/schools.repository';
import { RbacModule } from '../rbac.module';
import { PlatformModulesRepository } from './platform-modules.repository';
import { SchoolModuleEnablementsRepository } from './school-module-enablements.repository';

describe('SchoolModuleEnablementsRepository (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let modules: PlatformModulesRepository;
  let enablements: SchoolModuleEnablementsRepository;
  let createdSchoolIds: string[];
  let createdModuleIds: string[];

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
    modules = module.get(PlatformModulesRepository);
    enablements = module.get(SchoolModuleEnablementsRepository);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(() => {
    createdSchoolIds = [];
    createdModuleIds = [];
  });

  afterEach(async () => {
    if (createdSchoolIds.length > 0) {
      await schools.delete(createdSchoolIds);
    }
    if (createdModuleIds.length > 0) {
      await modules.delete(createdModuleIds);
    }
  });

  async function createSchool() {
    const school = await schools.save(
      schools.create({ name: 'Test School', subdomainSlug: randomUUID() }),
    );
    createdSchoolIds.push(school.id);
    return school;
  }

  async function createModule(overrides: Record<string, unknown> = {}) {
    const testModule = await modules.save(
      modules.create({
        name: randomUUID(),
        description: 'Test module',
        category: 'Admin',
        ...overrides,
      }),
    );
    createdModuleIds.push(testModule.id);
    return testModule;
  }

  it('persists an enablement record defaulting to enabled', async () => {
    const school = await createSchool();
    const testModule = await createModule();

    const enablement = await enablements.save(
      enablements.create({ schoolId: school.id, moduleId: testModule.id }),
    );

    expect(enablement.enabled).toBe(true);
    expect(enablement.enabledAt).toBeNull();
  });

  it('can be explicitly disabled', async () => {
    const school = await createSchool();
    const testModule = await createModule();

    const enablement = await enablements.save(
      enablements.create({
        schoolId: school.id,
        moduleId: testModule.id,
        enabled: false,
      }),
    );

    expect(enablement.enabled).toBe(false);
  });

  it('findEnabledModuleIds returns only enabled module ids for that school', async () => {
    const school = await createSchool();
    const enabledModule = await createModule();
    const disabledModule = await createModule();
    await enablements.save(
      enablements.create({
        schoolId: school.id,
        moduleId: enabledModule.id,
        enabled: true,
      }),
    );
    await enablements.save(
      enablements.create({
        schoolId: school.id,
        moduleId: disabledModule.id,
        enabled: false,
      }),
    );

    const found = await enablements.findEnabledModuleIds(school.id);

    expect(found).toEqual([enabledModule.id]);
  });

  it('findBySchool loads the module relation', async () => {
    const school = await createSchool();
    const testModule = await createModule({ name: randomUUID() });
    await enablements.save(
      enablements.create({ schoolId: school.id, moduleId: testModule.id }),
    );

    const found = await enablements.findBySchool(school.id);

    expect(found[0].module.id).toBe(testModule.id);
  });

  it('rejects a duplicate (school, module) enablement record', async () => {
    const school = await createSchool();
    const testModule = await createModule();
    await enablements.save(
      enablements.create({ schoolId: school.id, moduleId: testModule.id }),
    );

    await expect(
      enablements.save(
        enablements.create({ schoolId: school.id, moduleId: testModule.id }),
      ),
    ).rejects.toThrow(QueryFailedError);
  });

  it('allows the same module to be enabled independently for two different schools', async () => {
    const schoolA = await createSchool();
    const schoolB = await createSchool();
    const testModule = await createModule();

    await enablements.save(
      enablements.create({ schoolId: schoolA.id, moduleId: testModule.id }),
    );
    const enablementB = await enablements.save(
      enablements.create({
        schoolId: schoolB.id,
        moduleId: testModule.id,
        enabled: false,
      }),
    );

    expect(enablementB.enabled).toBe(false);
  });

  it('cascade-deletes enablement records when the school is hard-deleted', async () => {
    const school = await createSchool();
    const testModule = await createModule();
    const enablement = await enablements.save(
      enablements.create({ schoolId: school.id, moduleId: testModule.id }),
    );

    await schools.delete(school.id);
    createdSchoolIds = createdSchoolIds.filter((id) => id !== school.id);

    expect(
      await enablements.findOne({ where: { id: enablement.id } }),
    ).toBeNull();
  });

  it('cascade-deletes enablement records when the module is hard-deleted', async () => {
    const school = await createSchool();
    const testModule = await createModule();
    const enablement = await enablements.save(
      enablements.create({ schoolId: school.id, moduleId: testModule.id }),
    );

    await modules.delete(testModule.id);
    createdModuleIds = createdModuleIds.filter((id) => id !== testModule.id);

    expect(
      await enablements.findOne({ where: { id: enablement.id } }),
    ).toBeNull();
  });
});
