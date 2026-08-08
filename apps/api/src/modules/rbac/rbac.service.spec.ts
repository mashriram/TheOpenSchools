import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from '../school/school.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { RbacModule } from './rbac.module';
import { PlatformModulesRepository } from './repositories/platform-modules.repository';
import { ActionsRepository } from './repositories/actions.repository';
import { RolesRepository } from './repositories/roles.repository';
import { PermissionsRepository } from './repositories/permissions.repository';
import { SchoolModuleEnablementsRepository } from './repositories/school-module-enablements.repository';
import { RbacService } from './rbac.service';

describe('RbacService (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let modules: PlatformModulesRepository;
  let actions: ActionsRepository;
  let roles: RolesRepository;
  let permissions: PermissionsRepository;
  let enablements: SchoolModuleEnablementsRepository;
  let service: RbacService;
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
    service = module.get(RbacService);
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

  async function createCoreRole(schoolId: string) {
    return roles.save(
      roles.create({
        schoolId,
        category: 'Staff',
        name: 'Administrator',
        shortName: 'Adm',
        description: 'Controls all aspects of the system',
        restriction: 'AdminOnly',
        type: 'Core',
      }),
    );
  }

  const CREATE_ROLE_DTO = {
    category: 'Staff' as const,
    name: 'Custom Role',
    shortName: 'Cst',
    description: 'A custom role',
    restriction: 'None' as const,
  };

  describe('createRole', () => {
    it('always creates the role as type Additional', async () => {
      const school = await createSchool();

      const role = await service.createRole(school.id, CREATE_ROLE_DTO);

      expect(role.type).toBe('Additional');
    });
  });

  describe('listRoles', () => {
    it('only returns roles for the given school', async () => {
      const schoolA = await createSchool();
      const schoolB = await createSchool();
      await service.createRole(schoolA.id, {
        ...CREATE_ROLE_DTO,
        name: 'A-Role',
      });
      await service.createRole(schoolB.id, {
        ...CREATE_ROLE_DTO,
        name: 'B-Role',
      });

      const found = await service.listRoles(schoolA.id);

      expect(found.map((r) => r.name)).toEqual(['A-Role']);
    });
  });

  describe('updateRole', () => {
    it('updates an Additional role', async () => {
      const school = await createSchool();
      const role = await service.createRole(school.id, CREATE_ROLE_DTO);

      const updated = await service.updateRole(school.id, role.id, {
        description: 'Updated',
      });

      expect(updated.description).toBe('Updated');
    });

    it('rejects updating a Core role', async () => {
      const school = await createSchool();
      const role = await createCoreRole(school.id);

      await expect(
        service.updateRole(school.id, role.id, { description: 'Nope' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFound for a role belonging to a different school', async () => {
      const schoolA = await createSchool();
      const schoolB = await createSchool();
      const role = await service.createRole(schoolA.id, CREATE_ROLE_DTO);

      await expect(
        service.updateRole(schoolB.id, role.id, { description: 'Nope' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFound for a nonexistent role id', async () => {
      const school = await createSchool();

      await expect(
        service.updateRole(school.id, randomUUID(), { description: 'Nope' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteRole', () => {
    it('deletes an Additional role', async () => {
      const school = await createSchool();
      const role = await service.createRole(school.id, CREATE_ROLE_DTO);

      await service.deleteRole(school.id, role.id);

      expect(await roles.findOne({ where: { id: role.id } })).toBeNull();
    });

    it('rejects deleting a Core role', async () => {
      const school = await createSchool();
      const role = await createCoreRole(school.id);

      await expect(service.deleteRole(school.id, role.id)).rejects.toThrow(
        BadRequestException,
      );
      expect(await roles.findOne({ where: { id: role.id } })).not.toBeNull();
    });
  });

  describe('permissions', () => {
    async function createAction(moduleId: string) {
      return actions.save(
        actions.create({
          moduleId,
          name: randomUUID(),
          category: 'Test',
          description: 'Test action',
          verb: 'manage',
          subject: 'Thing',
        }),
      );
    }

    it('getRolePermissionActionIds returns the granted action ids', async () => {
      const school = await createSchool();
      const testModule = await modules.save(
        modules.create({
          name: randomUUID(),
          description: 'm',
          category: 'Admin',
        }),
      );
      createdModuleIds.push(testModule.id);
      const action = await createAction(testModule.id);
      const role = await createCoreRole(school.id);
      await permissions.save(
        permissions.create({ roleId: role.id, actionId: action.id }),
      );

      const actionIds = await service.getRolePermissionActionIds(
        school.id,
        role.id,
      );

      expect(actionIds).toEqual([action.id]);
    });

    it('setRolePermissions replaces the full set (old grants removed)', async () => {
      const school = await createSchool();
      const testModule = await modules.save(
        modules.create({
          name: randomUUID(),
          description: 'm',
          category: 'Admin',
        }),
      );
      createdModuleIds.push(testModule.id);
      const actionA = await createAction(testModule.id);
      const actionB = await createAction(testModule.id);
      const role = await createCoreRole(school.id);
      await service.setRolePermissions(school.id, role.id, [actionA.id]);

      await service.setRolePermissions(school.id, role.id, [actionB.id]);

      const actionIds = await service.getRolePermissionActionIds(
        school.id,
        role.id,
      );
      expect(actionIds).toEqual([actionB.id]);
    });

    it('setRolePermissions is allowed on a Core role (unlike role CRUD)', async () => {
      const school = await createSchool();
      const testModule = await modules.save(
        modules.create({
          name: randomUUID(),
          description: 'm',
          category: 'Admin',
        }),
      );
      createdModuleIds.push(testModule.id);
      const action = await createAction(testModule.id);
      const role = await createCoreRole(school.id);

      await expect(
        service.setRolePermissions(school.id, role.id, [action.id]),
      ).resolves.toBeUndefined();
    });

    it('setRolePermissions rejects an unknown actionId', async () => {
      const school = await createSchool();
      const role = await createCoreRole(school.id);

      await expect(
        service.setRolePermissions(school.id, role.id, [randomUUID()]),
      ).rejects.toThrow(BadRequestException);
    });

    it('setRolePermissions with an empty array clears all grants', async () => {
      const school = await createSchool();
      const testModule = await modules.save(
        modules.create({
          name: randomUUID(),
          description: 'm',
          category: 'Admin',
        }),
      );
      createdModuleIds.push(testModule.id);
      const action = await createAction(testModule.id);
      const role = await createCoreRole(school.id);
      await service.setRolePermissions(school.id, role.id, [action.id]);

      await service.setRolePermissions(school.id, role.id, []);

      expect(
        await service.getRolePermissionActionIds(school.id, role.id),
      ).toEqual([]);
    });
  });

  describe('listGrantableActions', () => {
    it('includes actions from active, school-enabled modules', async () => {
      const school = await createSchool();
      const testModule = await modules.save(
        modules.create({
          name: randomUUID(),
          description: 'm',
          category: 'Admin',
          active: true,
        }),
      );
      createdModuleIds.push(testModule.id);
      const action = await actions.save(
        actions.create({
          moduleId: testModule.id,
          name: randomUUID(),
          category: 'Test',
          description: 'Test action',
          verb: 'manage',
          subject: 'Thing',
        }),
      );
      await enablements.save(
        enablements.create({
          schoolId: school.id,
          moduleId: testModule.id,
          enabled: true,
        }),
      );

      const found = await service.listGrantableActions(school.id);

      expect(found.map((a) => a.id)).toContain(action.id);
    });

    it('excludes actions from a module the school has not enabled', async () => {
      const school = await createSchool();
      const testModule = await modules.save(
        modules.create({
          name: randomUUID(),
          description: 'm',
          category: 'Admin',
          active: true,
        }),
      );
      createdModuleIds.push(testModule.id);
      const action = await actions.save(
        actions.create({
          moduleId: testModule.id,
          name: randomUUID(),
          category: 'Test',
          description: 'Test action',
          verb: 'manage',
          subject: 'Thing',
        }),
      );

      const found = await service.listGrantableActions(school.id);

      expect(found.map((a) => a.id)).not.toContain(action.id);
    });
  });
});
