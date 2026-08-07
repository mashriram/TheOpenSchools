import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { QueryFailedError } from 'typeorm';
import { DatabaseModule } from '../../../database/database.module';
import { SchoolModule } from '../../school/school.module';
import { RbacModule } from '../rbac.module';
import { PlatformModulesRepository } from './platform-modules.repository';
import { ActionsRepository } from './actions.repository';
import { PlatformModule } from '../entities/platform-module.entity';

describe('ActionsRepository (integration)', () => {
  let module: TestingModule;
  let modules: PlatformModulesRepository;
  let actions: ActionsRepository;
  let createdModuleIds: string[];

  beforeAll(async () => {
    // See platform-modules.repository.spec.ts for why SchoolModule must be
    // imported alongside RbacModule.
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        SchoolModule,
        RbacModule,
      ],
    }).compile();

    modules = module.get(PlatformModulesRepository);
    actions = module.get(ActionsRepository);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(() => {
    createdModuleIds = [];
  });

  afterEach(async () => {
    // Cascades to rbac_actions via ON DELETE CASCADE.
    if (createdModuleIds.length > 0) {
      await modules.delete(createdModuleIds);
    }
  });

  async function createModule(): Promise<PlatformModule> {
    const created = await modules.save(
      modules.create({
        name: randomUUID(),
        description: 'Test module',
        category: 'Admin',
      }),
    );
    createdModuleIds.push(created.id);
    return created;
  }

  function buildAction(
    moduleId: string,
    overrides: Record<string, unknown> = {},
  ) {
    return actions.create({
      moduleId,
      name: randomUUID(),
      category: 'Test',
      description: 'Test action',
      verb: 'manage',
      subject: 'Thing',
      ...overrides,
    });
  }

  it('persists an action with sensible defaults', async () => {
    const testModule = await createModule();

    const action = await actions.save(buildAction(testModule.id));

    expect(action.precedence).toBe(0);
    expect(action.entrySidebar).toBe(true);
    expect(action.menuShow).toBe(true);
    expect(action.defaultPermissionAdmin).toBe(false);
    expect(action.categoryPermissionStaff).toBe(true);
  });

  it('finds an action by its unique name', async () => {
    const testModule = await createModule();
    const name = randomUUID();
    await actions.save(buildAction(testModule.id, { name }));

    const found = await actions.findByName(name);

    expect(found?.subject).toBe('Thing');
  });

  it('rejects a duplicate action name', async () => {
    const testModule = await createModule();
    const name = randomUUID();
    await actions.save(buildAction(testModule.id, { name }));

    await expect(
      actions.save(buildAction(testModule.id, { name })),
    ).rejects.toThrow(QueryFailedError);
  });

  it('findByModule returns actions ordered by precedence', async () => {
    const testModule = await createModule();
    await actions.save(buildAction(testModule.id, { precedence: 2 }));
    await actions.save(buildAction(testModule.id, { precedence: 0 }));
    await actions.save(buildAction(testModule.id, { precedence: 1 }));

    const found = await actions.findByModule(testModule.id);

    expect(found.map((a) => a.precedence)).toEqual([0, 1, 2]);
  });

  it('cascade-deletes actions when the parent module is hard-deleted', async () => {
    const testModule = await createModule();
    const action = await actions.save(buildAction(testModule.id));

    await modules.delete(testModule.id);
    createdModuleIds = createdModuleIds.filter((id) => id !== testModule.id);

    expect(await actions.findOne({ where: { id: action.id } })).toBeNull();
  });
});
