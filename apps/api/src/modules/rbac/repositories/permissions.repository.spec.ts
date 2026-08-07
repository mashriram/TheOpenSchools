import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { QueryFailedError } from 'typeorm';
import { DatabaseModule } from '../../../database/database.module';
import { SchoolModule } from '../../school/school.module';
import { SchoolsRepository } from '../../school/repositories/schools.repository';
import { RbacModule } from '../rbac.module';
import { RolesRepository } from './roles.repository';
import { PlatformModulesRepository } from './platform-modules.repository';
import { ActionsRepository } from './actions.repository';
import { PermissionsRepository } from './permissions.repository';

describe('PermissionsRepository (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let roles: RolesRepository;
  let modules: PlatformModulesRepository;
  let actions: ActionsRepository;
  let permissions: PermissionsRepository;
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
    roles = module.get(RolesRepository);
    modules = module.get(PlatformModulesRepository);
    actions = module.get(ActionsRepository);
    permissions = module.get(PermissionsRepository);
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

  async function createRole() {
    const school = await schools.save(
      schools.create({ name: 'Test School', subdomainSlug: randomUUID() }),
    );
    createdSchoolIds.push(school.id);
    return roles.save(
      roles.create({
        schoolId: school.id,
        category: 'Staff',
        name: 'Administrator',
        shortName: 'Adm',
        description: 'Controls all aspects of the system',
        restriction: 'AdminOnly',
      }),
    );
  }

  async function createAction() {
    const testModule = await modules.save(
      modules.create({
        name: randomUUID(),
        description: 'Test module',
        category: 'Admin',
      }),
    );
    createdModuleIds.push(testModule.id);
    return actions.save(
      actions.create({
        moduleId: testModule.id,
        name: randomUUID(),
        category: 'Test',
        description: 'Test action',
        verb: 'manage',
        subject: 'Thing',
      }),
    );
  }

  it('persists a permission linking a role to an action, with null conditions by default', async () => {
    const role = await createRole();
    const action = await createAction();

    const permission = await permissions.save(
      permissions.create({ roleId: role.id, actionId: action.id }),
    );

    expect(permission.conditions).toBeNull();
  });

  it('findByRole returns permissions with the action relation loaded', async () => {
    const role = await createRole();
    const action = await createAction();
    await permissions.save(
      permissions.create({ roleId: role.id, actionId: action.id }),
    );

    const found = await permissions.findByRole(role.id);

    expect(found).toHaveLength(1);
    expect(found[0].action.name).toBe(action.name);
  });

  it('rejects granting the same action to the same role twice', async () => {
    const role = await createRole();
    const action = await createAction();
    await permissions.save(
      permissions.create({ roleId: role.id, actionId: action.id }),
    );

    await expect(
      permissions.save(
        permissions.create({ roleId: role.id, actionId: action.id }),
      ),
    ).rejects.toThrow(QueryFailedError);
  });

  it('allows the same action to be granted to two different roles', async () => {
    const roleA = await createRole();
    const roleB = await createRole();
    const action = await createAction();

    await permissions.save(
      permissions.create({ roleId: roleA.id, actionId: action.id }),
    );
    const permissionB = await permissions.save(
      permissions.create({ roleId: roleB.id, actionId: action.id }),
    );

    expect(permissionB.actionId).toBe(action.id);
  });

  it('persists an explicit conditions object when provided', async () => {
    const role = await createRole();
    const action = await createAction();

    const permission = await permissions.save(
      permissions.create({
        roleId: role.id,
        actionId: action.id,
        conditions: { formGroupId: 'own' },
      }),
    );

    const reloaded = await permissions.findOne({
      where: { id: permission.id },
    });
    expect(reloaded?.conditions).toEqual({ formGroupId: 'own' });
  });

  it('cascade-deletes permissions when the role is hard-deleted', async () => {
    const role = await createRole();
    const action = await createAction();
    const permission = await permissions.save(
      permissions.create({ roleId: role.id, actionId: action.id }),
    );

    await roles.delete(role.id);

    expect(
      await permissions.findOne({ where: { id: permission.id } }),
    ).toBeNull();
  });

  it('cascade-deletes permissions when the action is hard-deleted', async () => {
    const role = await createRole();
    const action = await createAction();
    const permission = await permissions.save(
      permissions.create({ roleId: role.id, actionId: action.id }),
    );

    await actions.delete(action.id);

    expect(
      await permissions.findOne({ where: { id: permission.id } }),
    ).toBeNull();
  });
});
