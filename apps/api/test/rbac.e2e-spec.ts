import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { SchoolsRepository } from '../src/modules/school/repositories/schools.repository';
import { PeopleRepository } from '../src/modules/people/repositories/people.repository';
import { PersonCredentialsRepository } from '../src/modules/people/repositories/person-credentials.repository';
import { PersonRolesRepository } from '../src/modules/people/repositories/person-roles.repository';
import { RolesRepository } from '../src/modules/rbac/repositories/roles.repository';
import { ActionsRepository } from '../src/modules/rbac/repositories/actions.repository';
import { PermissionsRepository } from '../src/modules/rbac/repositories/permissions.repository';
import { PlatformModulesRepository } from '../src/modules/rbac/repositories/platform-modules.repository';
import { SchoolModuleEnablementsRepository } from '../src/modules/rbac/repositories/school-module-enablements.repository';
import { RbacCatalogSeeder } from '../src/modules/rbac/seed/rbac-catalog-seeder';
import { FOUNDATION_RBAC_CATALOG } from '../src/modules/rbac/seed/foundation-rbac-catalog';
import { CURRICULUM_RBAC_CATALOG } from '../src/modules/curriculum/curriculum-rbac-catalog';
import { TIMETABLE_RBAC_CATALOG } from '../src/modules/timetable/timetable-rbac-catalog';
import { MARKBOOK_RBAC_CATALOG } from '../src/modules/markbook/markbook-rbac-catalog';
import { ATTENDANCE_RBAC_CATALOG } from '../src/modules/attendance/attendance-rbac-catalog';
import { HashingService } from '../src/modules/auth/hashing.service';

const PASSWORD = 'correct-horse-battery-staple';

interface LoginResponseBody {
  accessToken: string;
}

function body<T>(response: request.Response): T {
  return response.body as T;
}

describe('RBAC (e2e)', () => {
  let app: INestApplication<App>;
  let schools: SchoolsRepository;
  let people: PeopleRepository;
  let personCredentials: PersonCredentialsRepository;
  let personRoles: PersonRolesRepository;
  let roles: RolesRepository;
  let actionsRepo: ActionsRepository;
  let permissionsRepo: PermissionsRepository;
  let platformModules: PlatformModulesRepository;
  let enablements: SchoolModuleEnablementsRepository;
  let seeder: RbacCatalogSeeder;
  let hashing: HashingService;
  let createdSchoolIds: string[];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    schools = moduleFixture.get(SchoolsRepository);
    people = moduleFixture.get(PeopleRepository);
    personCredentials = moduleFixture.get(PersonCredentialsRepository);
    personRoles = moduleFixture.get(PersonRolesRepository);
    roles = moduleFixture.get(RolesRepository);
    actionsRepo = moduleFixture.get(ActionsRepository);
    permissionsRepo = moduleFixture.get(PermissionsRepository);
    platformModules = moduleFixture.get(PlatformModulesRepository);
    enablements = moduleFixture.get(SchoolModuleEnablementsRepository);
    seeder = moduleFixture.get(RbacCatalogSeeder);
    hashing = moduleFixture.get(HashingService);

    // Real Foundation catalog, seeded once - idempotent, and deliberately
    // never torn down (it's persistent infrastructure, not per-test data).
    await seeder.seedCatalog();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    createdSchoolIds = [];
  });

  afterEach(async () => {
    if (createdSchoolIds.length > 0) {
      await schools.delete(createdSchoolIds);
    }
  });

  /**
   * Seeds a school with every Foundation module enabled, an Administrator
   * (Core) role granted userAdmin.roles.manage + userAdmin.permissions.manage,
   * and a Teacher (Core) role with no admin grants - then a logged-in-ready
   * Person for each.
   */
  async function seedSchoolWithAdminAndTeacher() {
    const school = await schools.save(
      schools.create({ name: 'Greenwood High', subdomainSlug: randomUUID() }),
    );
    createdSchoolIds.push(school.id);

    const allModules = await platformModules.find();
    for (const platformModule of allModules) {
      await enablements.save(
        enablements.create({
          schoolId: school.id,
          moduleId: platformModule.id,
          enabled: true,
        }),
      );
    }

    const adminRole = await roles.save(
      roles.create({
        schoolId: school.id,
        category: 'Staff',
        name: 'Administrator',
        shortName: 'Adm',
        description: 'Controls all aspects of the system',
        restriction: 'AdminOnly',
        type: 'Core',
      }),
    );
    const rolesManageAction = await actionsRepo.findByName(
      'userAdmin.roles.manage',
    );
    const permissionsManageAction = await actionsRepo.findByName(
      'userAdmin.permissions.manage',
    );
    if (!rolesManageAction || !permissionsManageAction) {
      throw new Error('Foundation catalog was not seeded correctly');
    }
    await permissionsRepo.save([
      permissionsRepo.create({
        roleId: adminRole.id,
        actionId: rolesManageAction.id,
      }),
      permissionsRepo.create({
        roleId: adminRole.id,
        actionId: permissionsManageAction.id,
      }),
    ]);

    const teacherRole = await roles.save(
      roles.create({
        schoolId: school.id,
        category: 'Staff',
        name: 'Teacher',
        shortName: 'Tcr',
        description: 'Regular, classroom teacher',
        restriction: 'None',
        type: 'Core',
      }),
    );

    const adminEmail = `${randomUUID()}@example.com`;
    const adminPerson = await people.save(
      people.create({
        schoolId: school.id,
        surname: 'Admin',
        firstName: 'Ada',
        email: adminEmail,
      }),
    );
    await personRoles.save(
      personRoles.create({
        personId: adminPerson.id,
        roleId: adminRole.id,
        isPrimary: true,
      }),
    );
    await personCredentials.save(
      personCredentials.create({
        personId: adminPerson.id,
        schoolId: school.id,
        username: adminEmail,
        passwordHash: await hashing.hashPassword(PASSWORD),
      }),
    );

    const teacherEmail = `${randomUUID()}@example.com`;
    const teacherPerson = await people.save(
      people.create({
        schoolId: school.id,
        surname: 'Teacher',
        firstName: 'Tom',
        email: teacherEmail,
      }),
    );
    await personRoles.save(
      personRoles.create({
        personId: teacherPerson.id,
        roleId: teacherRole.id,
        isPrimary: true,
      }),
    );
    await personCredentials.save(
      personCredentials.create({
        personId: teacherPerson.id,
        schoolId: school.id,
        username: teacherEmail,
        passwordHash: await hashing.hashPassword(PASSWORD),
      }),
    );

    return { school, adminRole, teacherRole, adminEmail, teacherEmail };
  }

  async function loginAs(schoolSlug: string, email: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ schoolSlug, email, password: PASSWORD });
    return body<LoginResponseBody>(response).accessToken;
  }

  const SLOT_DEFAULT_PERMISSION_FLAG = {
    Admin: 'defaultPermissionAdmin',
    Teacher: 'defaultPermissionTeacher',
    Student: 'defaultPermissionStudent',
    Parent: 'defaultPermissionParent',
    Support: 'defaultPermissionSupport',
  } as const;

  /**
   * The real Gibbon-grounded default-permission flags, straight from the
   * catalogs signup (M7, then M14's curriculum catalog) actually seeds
   * Permissions from - not a hand-picked subset. This is the
   * "hand-computed grant" the parity test below checks /me/abilities
   * against, for every real action across every catalog RbacModule seeds.
   */
  function expectedGrantsForSlot(
    slot: keyof typeof SLOT_DEFAULT_PERMISSION_FLAG,
  ): string[] {
    const flag = SLOT_DEFAULT_PERMISSION_FLAG[slot];
    return [
      ...FOUNDATION_RBAC_CATALOG,
      ...CURRICULUM_RBAC_CATALOG,
      ...TIMETABLE_RBAC_CATALOG,
      ...MARKBOOK_RBAC_CATALOG,
      ...ATTENDANCE_RBAC_CATALOG,
    ]
      .flatMap((platformModule) => platformModule.actions)
      .filter((action) => action[flag])
      .map((action) => `${action.verb}:${action.subject}`)
      .sort();
  }

  describe('GET /me/abilities', () => {
    it("includes the admin's granted rules", async () => {
      const { school, adminEmail } = await seedSchoolWithAdminAndTeacher();
      const accessToken = await loginAs(school.subdomainSlug, adminEmail);

      const response = await request(app.getHttpServer())
        .get('/me/abilities')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      const rules = body<{ rules: { action: string; subject: string }[] }>(
        response,
      ).rules;
      expect(rules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ action: 'manage', subject: 'Role' }),
          expect.objectContaining({ action: 'manage', subject: 'Permission' }),
        ]),
      );
    });

    it('does not include Role/Permission management for a Teacher', async () => {
      const { school, teacherEmail } = await seedSchoolWithAdminAndTeacher();
      const accessToken = await loginAs(school.subdomainSlug, teacherEmail);

      const response = await request(app.getHttpServer())
        .get('/me/abilities')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      const rules = body<{ rules: { action: string; subject: string }[] }>(
        response,
      ).rules;
      expect(rules.some((r) => r.subject === 'Role')).toBe(false);
    });

    it('rejects an unauthenticated request', async () => {
      const response = await request(app.getHttpServer()).get('/me/abilities');

      expect(response.status).toBe(401);
    });
  });

  describe('RBAC parity: /me/abilities vs a hand-computed grant', () => {
    it('grants exactly the two actions explicitly permissioned to the admin role, no more', async () => {
      const { school, adminEmail } = await seedSchoolWithAdminAndTeacher();
      const accessToken = await loginAs(school.subdomainSlug, adminEmail);

      const response = await request(app.getHttpServer())
        .get('/me/abilities')
        .set('Authorization', `Bearer ${accessToken}`);

      const rules = body<{ rules: { action: string; subject: string }[] }>(
        response,
      ).rules;
      const subjects = rules.map((r) => `${r.action}:${r.subject}`).sort();
      expect(subjects).toEqual(['manage:Permission', 'manage:Role']);
    });

    it('grants /me/abilities exactly the defaultPermission-flagged actions from the real Foundation catalog, across all 5 signup-seeded roles (M12 broader sample)', async () => {
      const subdomainSlug = randomUUID();
      const adminEmail = `${randomUUID()}@example.com`;
      const signupResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          schoolName: 'Riverside Academy',
          subdomainSlug,
          adminEmail,
          adminPassword: PASSWORD,
          adminFirstName: 'Ada',
          adminSurname: 'Admin',
        });
      expect(signupResponse.status).toBe(201);
      const school = await schools.findBySlug(subdomainSlug);
      if (!school) {
        throw new Error('Expected signup to create a School');
      }
      createdSchoolIds.push(school.id);

      const adminAccessToken =
        body<LoginResponseBody>(signupResponse).accessToken;
      const rolesResponse = await request(app.getHttpServer())
        .get('/rbac/roles')
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const roleIdByName = new Map(
        body<{ id: string; name: string }[]>(rolesResponse).map((r) => [
          r.name,
          r.id,
        ]),
      );

      const roleNameForSlot: Record<
        keyof typeof SLOT_DEFAULT_PERMISSION_FLAG,
        string
      > = {
        Admin: 'Administrator',
        Teacher: 'Teacher',
        Student: 'Student',
        Parent: 'Parent',
        Support: 'Support Staff',
      };

      for (const slot of Object.keys(
        SLOT_DEFAULT_PERMISSION_FLAG,
      ) as (keyof typeof SLOT_DEFAULT_PERMISSION_FLAG)[]) {
        const roleName = roleNameForSlot[slot];
        const roleId = roleIdByName.get(roleName);
        if (!roleId) {
          throw new Error(`Expected signup to seed a ${roleName} role`);
        }

        let accessToken: string;
        if (slot === 'Admin') {
          accessToken = adminAccessToken;
        } else {
          const email = `${randomUUID()}@example.com`;
          const person = await people.save(
            people.create({
              schoolId: school.id,
              surname: roleName,
              firstName: 'Test',
              email,
            }),
          );
          await personRoles.save(
            personRoles.create({
              personId: person.id,
              roleId,
              isPrimary: true,
            }),
          );
          await personCredentials.save(
            personCredentials.create({
              personId: person.id,
              schoolId: school.id,
              username: email,
              passwordHash: await hashing.hashPassword(PASSWORD),
            }),
          );
          accessToken = await loginAs(subdomainSlug, email);
        }

        const abilitiesResponse = await request(app.getHttpServer())
          .get('/me/abilities')
          .set('Authorization', `Bearer ${accessToken}`);
        expect(abilitiesResponse.status).toBe(200);
        const rules = body<{ rules: { action: string; subject: string }[] }>(
          abilitiesResponse,
        ).rules;
        const actual = rules.map((r) => `${r.action}:${r.subject}`).sort();

        expect(actual).toEqual(expectedGrantsForSlot(slot));
      }
    });
  });

  describe('GET /rbac/actions', () => {
    it('returns the Foundation action catalog for an authorized admin', async () => {
      const { school, adminEmail } = await seedSchoolWithAdminAndTeacher();
      const accessToken = await loginAs(school.subdomainSlug, adminEmail);

      const response = await request(app.getHttpServer())
        .get('/rbac/actions')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      const names = body<{ name: string }[]>(response).map((a) => a.name);
      expect(names).toContain('schoolAdmin.schoolYears.manage');
      expect(names).toContain('userAdmin.people.export');
    });

    it('is forbidden for a Teacher (no manage-Permission grant)', async () => {
      const { school, teacherEmail } = await seedSchoolWithAdminAndTeacher();
      const accessToken = await loginAs(school.subdomainSlug, teacherEmail);

      const response = await request(app.getHttpServer())
        .get('/rbac/actions')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(403);
    });

    it('rejects an unauthenticated request', async () => {
      const response = await request(app.getHttpServer()).get('/rbac/actions');

      expect(response.status).toBe(401);
    });
  });

  describe('Role CRUD', () => {
    it('lets an admin create, update, and delete a custom (Additional) role', async () => {
      const { school, adminEmail } = await seedSchoolWithAdminAndTeacher();
      const accessToken = await loginAs(school.subdomainSlug, adminEmail);
      const auth = { Authorization: `Bearer ${accessToken}` };

      const createResponse = await request(app.getHttpServer())
        .post('/rbac/roles')
        .set(auth)
        .send({
          category: 'Staff',
          name: 'Head of Year',
          shortName: 'HoY',
          description: 'Leads a year group',
          restriction: 'None',
        });
      expect(createResponse.status).toBe(201);
      const created = body<{ id: string; type: string }>(createResponse);
      expect(created.type).toBe('Additional');

      const updateResponse = await request(app.getHttpServer())
        .patch(`/rbac/roles/${created.id}`)
        .set(auth)
        .send({ description: 'Updated description' });
      expect(updateResponse.status).toBe(200);
      expect(body<{ description: string }>(updateResponse).description).toBe(
        'Updated description',
      );

      const deleteResponse = await request(app.getHttpServer())
        .delete(`/rbac/roles/${created.id}`)
        .set(auth);
      expect(deleteResponse.status).toBe(200);

      expect(await roles.findOne({ where: { id: created.id } })).toBeNull();
    });

    it('is forbidden for a Teacher', async () => {
      const { school, teacherEmail } = await seedSchoolWithAdminAndTeacher();
      const accessToken = await loginAs(school.subdomainSlug, teacherEmail);

      const response = await request(app.getHttpServer())
        .post('/rbac/roles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          category: 'Staff',
          name: 'Sneaky Role',
          shortName: 'Snk',
          description: 'x',
          restriction: 'None',
        });

      expect(response.status).toBe(403);
    });

    it('rejects editing the Core Administrator role', async () => {
      const { school, adminRole, adminEmail } =
        await seedSchoolWithAdminAndTeacher();
      const accessToken = await loginAs(school.subdomainSlug, adminEmail);

      const response = await request(app.getHttpServer())
        .patch(`/rbac/roles/${adminRole.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ description: 'Trying to rename the Core role' });

      expect(response.status).toBe(400);
    });

    it('rejects deleting the Core Administrator role', async () => {
      const { school, adminRole, adminEmail } =
        await seedSchoolWithAdminAndTeacher();
      const accessToken = await loginAs(school.subdomainSlug, adminEmail);

      const response = await request(app.getHttpServer())
        .delete(`/rbac/roles/${adminRole.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(400);
      expect(
        await roles.findOne({ where: { id: adminRole.id } }),
      ).not.toBeNull();
    });

    it('returns 400 for a malformed role id', async () => {
      const { school, adminEmail } = await seedSchoolWithAdminAndTeacher();
      const accessToken = await loginAs(school.subdomainSlug, adminEmail);

      const response = await request(app.getHttpServer())
        .patch('/rbac/roles/not-a-uuid')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ description: 'x' });

      expect(response.status).toBe(400);
    });

    it('returns 404 for a syntactically-valid but nonexistent role id', async () => {
      const { school, adminEmail } = await seedSchoolWithAdminAndTeacher();
      const accessToken = await loginAs(school.subdomainSlug, adminEmail);

      const response = await request(app.getHttpServer())
        .patch(`/rbac/roles/${randomUUID()}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ description: 'x' });

      expect(response.status).toBe(404);
    });

    it('returns 404 for a role belonging to a different school', async () => {
      const { school, adminRole } = await seedSchoolWithAdminAndTeacher();
      void school;
      const { school: otherSchool, adminEmail: otherAdminEmail } =
        await seedSchoolWithAdminAndTeacher();
      const otherAccessToken = await loginAs(
        otherSchool.subdomainSlug,
        otherAdminEmail,
      );

      const response = await request(app.getHttpServer())
        .patch(`/rbac/roles/${adminRole.id}`)
        .set('Authorization', `Bearer ${otherAccessToken}`)
        .send({ description: 'x' });

      expect(response.status).toBe(404);
    });
  });

  describe('Role permissions bulk-set', () => {
    it('lets an admin set and read back a role permission grid, including for a Core role', async () => {
      const { school, teacherRole, adminEmail } =
        await seedSchoolWithAdminAndTeacher();
      const accessToken = await loginAs(school.subdomainSlug, adminEmail);
      const auth = { Authorization: `Bearer ${accessToken}` };
      const viewAction = await actionsRepo.findByName('students.view');
      if (!viewAction) {
        throw new Error(
          'Expected students.view to exist in the seeded catalog',
        );
      }

      const setResponse = await request(app.getHttpServer())
        .put(`/rbac/roles/${teacherRole.id}/permissions`)
        .set(auth)
        .send({ actionIds: [viewAction.id] });
      expect(setResponse.status).toBe(200);

      const getResponse = await request(app.getHttpServer())
        .get(`/rbac/roles/${teacherRole.id}/permissions`)
        .set(auth);
      expect(getResponse.status).toBe(200);
      expect(body<{ actionIds: string[] }>(getResponse).actionIds).toEqual([
        viewAction.id,
      ]);
    });

    it('rejects an unknown actionId', async () => {
      const { school, teacherRole, adminEmail } =
        await seedSchoolWithAdminAndTeacher();
      const accessToken = await loginAs(school.subdomainSlug, adminEmail);

      const response = await request(app.getHttpServer())
        .put(`/rbac/roles/${teacherRole.id}/permissions`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ actionIds: [randomUUID()] });

      expect(response.status).toBe(400);
    });
  });
});
