import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ConflictException } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from '../school/school.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';
import { RbacModule } from '../rbac/rbac.module';
import { RolesRepository } from '../rbac/repositories/roles.repository';
import { PermissionsRepository } from '../rbac/repositories/permissions.repository';
import { ActionsRepository } from '../rbac/repositories/actions.repository';
import { SchoolModuleEnablementsRepository } from '../rbac/repositories/school-module-enablements.repository';
import { RbacCatalogSeeder } from '../rbac/seed/rbac-catalog-seeder';
import { getDefaultActionsForSlot } from '../rbac/seed/default-role-grants';
import { PeopleModule } from '../people/people.module';
import { PeopleRepository } from '../people/repositories/people.repository';
import { PersonCredentialsRepository } from '../people/repositories/person-credentials.repository';
import { PersonRolesRepository } from '../people/repositories/person-roles.repository';
import { AuthModule } from './auth.module';
import { SignupService } from './signup.service';
import { SignupDto } from './dto/signup.dto';

describe('SignupService (integration)', () => {
  let module: TestingModule;
  let service: SignupService;
  let schools: SchoolsRepository;
  let schoolYears: SchoolYearsRepository;
  let roles: RolesRepository;
  let permissions: PermissionsRepository;
  let actions: ActionsRepository;
  let enablements: SchoolModuleEnablementsRepository;
  let people: PeopleRepository;
  let personCredentials: PersonCredentialsRepository;
  let personRoles: PersonRolesRepository;
  let createdSchoolIds: string[];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      // SchoolModule/RbacModule/PeopleModule are all required directly (not
      // just transitively via AuthModule) because their entities relate to
      // each other, and a bare compile() needs every relevant module's
      // forFeature() to register that entity's metadata with the DataSource -
      // see the "No metadata for X was found" pattern noted elsewhere in
      // this codebase.
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        SchoolModule,
        RbacModule,
        PeopleModule,
        AuthModule,
      ],
    }).compile();

    service = module.get(SignupService);
    schools = module.get(SchoolsRepository);
    schoolYears = module.get(SchoolYearsRepository);
    roles = module.get(RolesRepository);
    permissions = module.get(PermissionsRepository);
    actions = module.get(ActionsRepository);
    enablements = module.get(SchoolModuleEnablementsRepository);
    people = module.get(PeopleRepository);
    personCredentials = module.get(PersonCredentialsRepository);
    personRoles = module.get(PersonRolesRepository);

    // Bare compile() doesn't run onModuleInit (only .init() does - see
    // RbacModule's comment) so the global catalog needs seeding explicitly
    // here for default-permission grants to have real Actions to grant.
    await module.get(RbacCatalogSeeder).seedCatalog();
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

  function buildDto(overrides: Partial<SignupDto> = {}): SignupDto {
    const dto = new SignupDto();
    dto.schoolName = 'Greenwood High';
    dto.subdomainSlug = randomUUID().replace(/-/g, '').slice(0, 20);
    dto.adminEmail = `${randomUUID()}@example.com`;
    dto.adminPassword = 'correct-horse-battery-staple';
    dto.adminFirstName = 'Ada';
    dto.adminSurname = 'Admin';
    return Object.assign(dto, overrides);
  }

  it('atomically creates School + SchoolYear + 5 Core roles + the admin Person/Credential/PersonRole, then logs them in', async () => {
    const dto = buildDto();

    const result = await service.signup(dto);
    const school = await schools.findBySlug(dto.subdomainSlug);
    expect(school).not.toBeNull();
    createdSchoolIds.push(school!.id);
    expect(school!.status).toBe('Active');

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.person.email).toBe(dto.adminEmail);

    const years = await schoolYears.findBySchool(school!.id);
    expect(years).toHaveLength(1);
    expect(years[0].status).toBe('Current');

    const createdRoles = await roles.findBySchool(school!.id);
    expect(createdRoles.map((r) => r.name).sort()).toEqual(
      ['Administrator', 'Parent', 'Student', 'Support Staff', 'Teacher'].sort(),
    );
    expect(createdRoles.every((r) => r.type === 'Core')).toBe(true);

    const enabledModuleIds = await enablements.findEnabledModuleIds(school!.id);
    expect(enabledModuleIds.length).toBeGreaterThan(0);

    const person = await people.findByEmail(school!.id, dto.adminEmail);
    expect(person).not.toBeNull();
    expect(person!.firstName).toBe('Ada');

    const credential = await personCredentials.findByPersonId(person!.id);
    expect(credential).not.toBeNull();
    expect(credential!.username).toBe(dto.adminEmail);

    const primaryRole = await personRoles.findPrimaryRole(person!.id);
    expect(primaryRole).not.toBeNull();
    const adminRole = createdRoles.find((r) => r.name === 'Administrator');
    expect(primaryRole!.roleId).toBe(adminRole!.id);
  });

  it.each(['Admin', 'Teacher', 'Student', 'Parent', 'Support'] as const)(
    'grants the %s role exactly the Actions getDefaultActionsForSlot() says it should get (RBAC parity)',
    async (slot) => {
      const dto = buildDto();
      await service.signup(dto);
      const school = await schools.findBySlug(dto.subdomainSlug);
      createdSchoolIds.push(school!.id);

      const roleNameBySlot: Record<string, string> = {
        Admin: 'Administrator',
        Teacher: 'Teacher',
        Student: 'Student',
        Parent: 'Parent',
        Support: 'Support Staff',
      };
      const createdRoles = await roles.findBySchool(school!.id);
      const role = createdRoles.find((r) => r.name === roleNameBySlot[slot])!;
      const grantedActionIds = (await permissions.findByRole(role.id))
        .map((p) => p.actionId)
        .sort();

      const allActions = await actions.find();
      const expectedActionIds = getDefaultActionsForSlot(slot, allActions)
        .map((a) => a.id)
        .sort();

      expect(grantedActionIds).toEqual(expectedActionIds);
    },
  );

  it('rejects a duplicate subdomain slug without creating a second school', async () => {
    const dto = buildDto();
    await service.signup(dto);
    const school = await schools.findBySlug(dto.subdomainSlug);
    createdSchoolIds.push(school!.id);

    await expect(
      service.signup(buildDto({ subdomainSlug: dto.subdomainSlug })),
    ).rejects.toThrow(ConflictException);

    const matches = await schools.find({
      where: { subdomainSlug: dto.subdomainSlug },
    });
    expect(matches).toHaveLength(1);
  });

  it('is atomic: a failure partway through the transaction leaves no School behind', async () => {
    const dto = buildDto({
      // Exceeds Person.firstName's varchar(60) column - triggers a real
      // MySQL "data too long" error at the Person insert step, which comes
      // AFTER the School/SchoolYear/Role/Permission/SchoolModuleEnablement
      // rows are already written in the same transaction. Calling the
      // service directly (not through the HTTP layer's DTO ValidationPipe)
      // deliberately bypasses class-validator so this reaches the DB.
      adminFirstName: 'x'.repeat(5000),
    });

    await expect(service.signup(dto)).rejects.toThrow();

    expect(await schools.findBySlug(dto.subdomainSlug)).toBeNull();
  });
});
