import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../../database/database.module';
import { SchoolModule } from '../../school/school.module';
import { RbacModule } from '../rbac.module';
import { PlatformModulesRepository } from '../repositories/platform-modules.repository';
import { ActionsRepository } from '../repositories/actions.repository';
import { RbacCatalogSeeder } from './rbac-catalog-seeder';
import {
  FOUNDATION_RBAC_CATALOG,
  FoundationModuleSeed,
} from './foundation-rbac-catalog';

describe('RbacCatalogSeeder (integration)', () => {
  let module: TestingModule;
  let modules: PlatformModulesRepository;
  let actions: ActionsRepository;
  let seeder: RbacCatalogSeeder;

  beforeAll(async () => {
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
    seeder = module.get(RbacCatalogSeeder);
  });

  afterAll(async () => {
    await module.close();
  });

  function buildFixtureCatalog(): FoundationModuleSeed[] {
    const moduleName = `test-module-${randomUUID()}`;
    return [
      {
        name: moduleName,
        description: 'A fixture module',
        category: 'Admin',
        actions: [
          {
            name: `${moduleName}.view`,
            category: 'Test',
            description: 'View the fixture thing',
            verb: 'view',
            subject: 'Thing',
            defaultPermissionAdmin: true,
          },
          {
            name: `${moduleName}.manage`,
            category: 'Test',
            description: 'Manage the fixture thing',
            verb: 'manage',
            subject: 'Thing',
            defaultPermissionAdmin: true,
          },
        ],
      },
    ];
  }

  async function cleanUpCatalog(catalog: FoundationModuleSeed[]) {
    for (const moduleSeed of catalog) {
      const found = await modules.findByName(moduleSeed.name);
      if (found) {
        // Cascades to rbac_actions.
        await modules.delete(found.id);
      }
    }
  }

  it('creates a module and its actions from the fixture catalog', async () => {
    const catalog = buildFixtureCatalog();

    await seeder.seedCatalog(catalog);

    const created = await modules.findByName(catalog[0].name);
    expect(created).not.toBeNull();
    expect(created?.description).toBe('A fixture module');

    const createdActions = await actions.findByModule(created!.id);
    expect(createdActions.map((a) => a.name).sort()).toEqual(
      catalog[0].actions.map((a) => a.name).sort(),
    );

    await cleanUpCatalog(catalog);
  });

  it('applies the field defaults for an action (helpUrl null, precedence 0, flags as specified)', async () => {
    const catalog = buildFixtureCatalog();

    await seeder.seedCatalog(catalog);

    const created = await modules.findByName(catalog[0].name);
    const viewAction = await actions.findByName(catalog[0].actions[0].name);

    expect(viewAction?.helpUrl).toBeNull();
    expect(viewAction?.precedence).toBe(0);
    expect(viewAction?.entrySidebar).toBe(true);
    expect(viewAction?.defaultPermissionAdmin).toBe(true);
    expect(viewAction?.defaultPermissionTeacher).toBe(false);
    expect(viewAction?.categoryPermissionStaff).toBe(true);
    void created;

    await cleanUpCatalog(catalog);
  });

  it('is idempotent: seeding the same catalog twice does not create duplicates', async () => {
    const catalog = buildFixtureCatalog();

    await seeder.seedCatalog(catalog);
    await seeder.seedCatalog(catalog);

    const created = await modules.findByName(catalog[0].name);
    const createdActions = await actions.findByModule(created!.id);

    expect(createdActions).toHaveLength(2);

    await cleanUpCatalog(catalog);
  });

  it('re-seeding upserts changed fields rather than leaving the old value', async () => {
    const catalog = buildFixtureCatalog();
    await seeder.seedCatalog(catalog);

    const updatedCatalog = [
      { ...catalog[0], description: 'An updated fixture module' },
    ];
    await seeder.seedCatalog(updatedCatalog);

    const found = await modules.findByName(catalog[0].name);
    expect(found?.description).toBe('An updated fixture module');

    await cleanUpCatalog(catalog);
  });

  it('seeds the real Foundation catalog with exactly the expected modules and actions', async () => {
    await seeder.seedCatalog(FOUNDATION_RBAC_CATALOG);

    const expectedModuleNames = FOUNDATION_RBAC_CATALOG.map(
      (m) => m.name,
    ).sort();
    const expectedActionNames = FOUNDATION_RBAC_CATALOG.flatMap((m) =>
      m.actions.map((a) => a.name),
    ).sort();

    const createdModules = await Promise.all(
      expectedModuleNames.map((name) => modules.findByName(name)),
    );
    expect(createdModules.every((m) => m !== null)).toBe(true);

    const createdActions = await Promise.all(
      expectedActionNames.map((name) => actions.findByName(name)),
    );
    expect(createdActions.every((a) => a !== null)).toBe(true);
    expect(createdActions).toHaveLength(21);

    await cleanUpCatalog(FOUNDATION_RBAC_CATALOG);
  });
});
