import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { subject } from '@casl/ability';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from '../school/school.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { RbacModule } from './rbac.module';
import { PlatformModulesRepository } from './repositories/platform-modules.repository';
import { ActionsRepository } from './repositories/actions.repository';
import { RolesRepository } from './repositories/roles.repository';
import { PermissionsRepository } from './repositories/permissions.repository';
import { SchoolModuleEnablementsRepository } from './repositories/school-module-enablements.repository';
import { CaslAbilityFactory } from './casl-ability.factory';

describe('CaslAbilityFactory (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let modules: PlatformModulesRepository;
  let actions: ActionsRepository;
  let roles: RolesRepository;
  let permissions: PermissionsRepository;
  let enablements: SchoolModuleEnablementsRepository;
  let abilityFactory: CaslAbilityFactory;
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
    actions = module.get(ActionsRepository);
    roles = module.get(RolesRepository);
    permissions = module.get(PermissionsRepository);
    enablements = module.get(SchoolModuleEnablementsRepository);
    abilityFactory = module.get(CaslAbilityFactory);
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

  async function setUp(
    options: { moduleActive?: boolean; schoolEnabled?: boolean } = {},
  ) {
    const school = await schools.save(
      schools.create({ name: 'Test School', subdomainSlug: randomUUID() }),
    );
    createdSchoolIds.push(school.id);

    const testModule = await modules.save(
      modules.create({
        name: randomUUID(),
        description: 'Test module',
        category: 'Admin',
        active: options.moduleActive ?? true,
      }),
    );
    createdModuleIds.push(testModule.id);

    const action = await actions.save(
      actions.create({
        moduleId: testModule.id,
        name: randomUUID(),
        category: 'Test',
        description: 'Manage the thing',
        verb: 'manage',
        subject: 'Thing',
      }),
    );

    const role = await roles.save(
      roles.create({
        schoolId: school.id,
        category: 'Staff',
        name: 'Administrator',
        shortName: 'Adm',
        description: 'Controls all aspects of the system',
        restriction: 'AdminOnly',
      }),
    );

    await permissions.save(
      permissions.create({ roleId: role.id, actionId: action.id }),
    );

    if (options.schoolEnabled !== false) {
      await enablements.save(
        enablements.create({
          schoolId: school.id,
          moduleId: testModule.id,
          enabled: true,
        }),
      );
    }

    return { school, testModule, action, role };
  }

  it('grants the ability when the module is active and enabled for the school', async () => {
    const { school, role } = await setUp();

    const ability = await abilityFactory.buildAbilityForRole(
      school.id,
      role.id,
    );

    expect(ability.can('manage', 'Thing')).toBe(true);
  });

  it('does not grant an unrelated subject even with the same verb', async () => {
    const { school, role } = await setUp();

    const ability = await abilityFactory.buildAbilityForRole(
      school.id,
      role.id,
    );

    expect(ability.can('manage', 'OtherThing')).toBe(false);
  });

  it("does not grant an unrelated verb on a different subject when that verb isn't 'manage'", async () => {
    // Deliberately not reusing setUp(): it grants manage/Thing, and
    // 'manage' is a wildcard for every verb on that subject - reusing it
    // here would make this assertion pass for the wrong reason.
    const school = await schools.save(
      schools.create({ name: 'Isolated School', subdomainSlug: randomUUID() }),
    );
    createdSchoolIds.push(school.id);
    const testModule = await modules.save(
      modules.create({
        name: randomUUID(),
        description: 'Test module',
        category: 'Admin',
      }),
    );
    createdModuleIds.push(testModule.id);
    const role = await roles.save(
      roles.create({
        schoolId: school.id,
        category: 'Staff',
        name: 'Administrator',
        shortName: 'Adm',
        description: 'Controls all aspects of the system',
        restriction: 'AdminOnly',
      }),
    );
    // "export" is a real verb used elsewhere in the Foundation catalog
    // (userAdmin.people.export) - grant it only on "OtherThing".
    const exportAction = await actions.save(
      actions.create({
        moduleId: testModule.id,
        name: randomUUID(),
        category: 'Test',
        description: 'Export the other thing',
        verb: 'export',
        subject: 'OtherThing',
      }),
    );
    await permissions.save(
      permissions.create({ roleId: role.id, actionId: exportAction.id }),
    );
    await enablements.save(
      enablements.create({
        schoolId: school.id,
        moduleId: testModule.id,
        enabled: true,
      }),
    );

    const ability = await abilityFactory.buildAbilityForRole(
      school.id,
      role.id,
    );

    expect(ability.can('export', 'OtherThing')).toBe(true);
    expect(ability.can('export', 'Thing')).toBe(false);
    expect(ability.can('manage', 'Thing')).toBe(false);
  });

  it("grants every verb on a subject once 'manage' is granted (CASL's documented wildcard semantics)", async () => {
    const { school, role } = await setUp();

    const ability = await abilityFactory.buildAbilityForRole(
      school.id,
      role.id,
    );

    // We only ever granted `can('manage', 'Thing')` in setUp() - CASL treats
    // 'manage' as "any action" both when granting and when checking, so
    // this is expected, not a bug. Foundation's own catalog relies on this:
    // userAdmin.people.manage is meant to imply view-level access too.
    expect(ability.can('view', 'Thing')).toBe(true);
    expect(ability.can('delete', 'Thing')).toBe(true);
  });

  it('does not grant the ability when the school never enabled the module', async () => {
    const { school, role } = await setUp({ schoolEnabled: false });

    const ability = await abilityFactory.buildAbilityForRole(
      school.id,
      role.id,
    );

    expect(ability.can('manage', 'Thing')).toBe(false);
  });

  it('does not grant the ability when the module is globally inactive', async () => {
    const { school, role } = await setUp({ moduleActive: false });

    const ability = await abilityFactory.buildAbilityForRole(
      school.id,
      role.id,
    );

    expect(ability.can('manage', 'Thing')).toBe(false);
  });

  it('wires a Permission.conditions value into the built ability, matched via CASL conditions', async () => {
    const { school, role, testModule } = await setUp();
    const conditionalAction = await actions.save(
      actions.create({
        moduleId: testModule.id,
        name: randomUUID(),
        category: 'Test',
        description: 'View a conditionally-restricted thing',
        verb: 'view',
        subject: 'RestrictedThing',
      }),
    );
    await permissions.save(
      permissions.create({
        roleId: role.id,
        actionId: conditionalAction.id,
        conditions: { restricted: false },
      }),
    );

    const ability = await abilityFactory.buildAbilityForRole(
      school.id,
      role.id,
    );

    // See casl-ability.factory.ts's ConditionalCanBuilder comment: AppAbility's
    // subject slot is plain `string`, so instance-based checks need this cast.
    expect(
      ability.can(
        'view',
        subject('RestrictedThing', { restricted: false }) as unknown as string,
      ),
    ).toBe(true);
    expect(
      ability.can(
        'view',
        subject('RestrictedThing', { restricted: true }) as unknown as string,
      ),
    ).toBe(false);
  });

  it('a null/absent Permission.conditions value still grants unconditionally (no behavior change for existing roles)', async () => {
    const { school, role } = await setUp();

    const ability = await abilityFactory.buildAbilityForRole(
      school.id,
      role.id,
    );

    // setUp()'s permission has conditions: null (the Foundation-era default).
    expect(ability.can('manage', 'Thing')).toBe(true);
  });

  it('returns an empty ability for a role with no permissions', async () => {
    const school = await schools.save(
      schools.create({ name: 'Empty School', subdomainSlug: randomUUID() }),
    );
    createdSchoolIds.push(school.id);
    const role = await roles.save(
      roles.create({
        schoolId: school.id,
        category: 'Staff',
        name: 'Teacher',
        shortName: 'Tcr',
        description: 'Regular, classroom teacher',
        restriction: 'None',
      }),
    );

    const ability = await abilityFactory.buildAbilityForRole(
      school.id,
      role.id,
    );

    expect(ability.can('manage', 'Thing')).toBe(false);
    expect(ability.rules).toEqual([]);
  });
});
