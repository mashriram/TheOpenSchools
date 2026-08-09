import { ConflictException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { isDuplicateEntryError } from '../../common/duplicate-entry-error';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { School } from '../school/entities/school.entity';
import { SchoolYear } from '../school/entities/school-year.entity';
import { PlatformModulesRepository } from '../rbac/repositories/platform-modules.repository';
import { ActionsRepository } from '../rbac/repositories/actions.repository';
import { PlatformModule } from '../rbac/entities/platform-module.entity';
import { Action } from '../rbac/entities/action.entity';
import { Role } from '../rbac/entities/role.entity';
import { Permission } from '../rbac/entities/permission.entity';
import { SchoolModuleEnablement } from '../rbac/entities/school-module-enablement.entity';
import { DEFAULT_ROLE_SEEDS } from '../rbac/seed/default-roles';
import { getDefaultActionsForSlot } from '../rbac/seed/default-role-grants';
import { Setting } from '../school/entities/setting.entity';
import { buildDefaultSettings } from '../school/seed/default-settings';
import { Person } from '../people/entities/person.entity';
import { PersonCredential } from '../people/entities/person-credential.entity';
import { PersonRole } from '../people/entities/person-role.entity';
import { HashingService } from './hashing.service';
import { AuthService, AuthResult } from './auth.service';
import { SignupDto } from './dto/signup.dto';

interface SignupTransactionResult {
  person: Person;
  credential: PersonCredential;
  adminRoleId: string;
}

/**
 * Ties M1 (School/SchoolYear) + M2 (RBAC catalog) + M3 (Setting) + M4
 * (Person) + M5 (Auth) + M6 (CASL) together: a real public signup, not an
 * admin-seeded stub. Everything from School creation through the first
 * PersonRole grant is one transaction - a failure partway through leaves no
 * partial School behind.
 */
@Injectable()
export class SignupService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly schools: SchoolsRepository,
    private readonly platformModules: PlatformModulesRepository,
    private readonly actions: ActionsRepository,
    private readonly hashing: HashingService,
    private readonly auth: AuthService,
  ) {}

  async signup(dto: SignupDto): Promise<AuthResult> {
    const existingSlug = await this.schools.findBySlug(dto.subdomainSlug);
    if (existingSlug) {
      throw new ConflictException('That subdomain is already taken');
    }

    const [allModules, allActions] = await Promise.all([
      this.platformModules.find(),
      this.actions.find(),
    ]);

    const { person, credential, adminRoleId } = await this.runInTransaction(
      dto,
      allModules,
      allActions,
    );

    return this.auth.issueTokens(person, credential.id, adminRoleId);
  }

  private async runInTransaction(
    dto: SignupDto,
    allModules: PlatformModule[],
    allActions: Action[],
  ): Promise<SignupTransactionResult> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const schoolsRepo = manager.getRepository(School);
        const schoolYearsRepo = manager.getRepository(SchoolYear);
        const rolesRepo = manager.getRepository(Role);
        const permissionsRepo = manager.getRepository(Permission);
        const enablementsRepo = manager.getRepository(SchoolModuleEnablement);
        const peopleRepo = manager.getRepository(Person);
        const credentialsRepo = manager.getRepository(PersonCredential);
        const personRolesRepo = manager.getRepository(PersonRole);
        const settingsRepo = manager.getRepository(Setting);

        const school = await schoolsRepo.save(
          schoolsRepo.create({
            name: dto.schoolName,
            subdomainSlug: dto.subdomainSlug,
            status: 'Active',
          }),
        );

        await schoolYearsRepo.save(
          schoolYearsRepo.create(this.buildDefaultSchoolYear(school.id)),
        );

        // Every Core-type module in the global catalog is enabled for a new
        // school by default; a future Additional/paid-tier module (gated by
        // School.planTier) would be excluded here.
        const coreModules = allModules.filter(
          (module) => module.type === 'Core',
        );
        if (coreModules.length > 0) {
          await enablementsRepo.save(
            coreModules.map((module) =>
              enablementsRepo.create({
                schoolId: school.id,
                moduleId: module.id,
                enabled: true,
                enabledAt: new Date(),
              }),
            ),
          );
        }

        const adminRole = await this.seedDefaultRolesAndPermissions(
          rolesRepo,
          permissionsRepo,
          school.id,
          allActions,
        );

        await settingsRepo.save(
          buildDefaultSettings(dto.schoolName, dto.adminEmail).map((seed) =>
            settingsRepo.create({ schoolId: school.id, ...seed }),
          ),
        );

        const person = await peopleRepo.save(
          peopleRepo.create({
            schoolId: school.id,
            firstName: dto.adminFirstName,
            surname: dto.adminSurname,
            email: dto.adminEmail,
          }),
        );

        const credential = await credentialsRepo.save(
          credentialsRepo.create({
            personId: person.id,
            schoolId: school.id,
            username: dto.adminEmail,
            passwordHash: await this.hashing.hashPassword(dto.adminPassword),
          }),
        );

        await personRolesRepo.save(
          personRolesRepo.create({
            personId: person.id,
            roleId: adminRole.id,
            isPrimary: true,
          }),
        );

        return { person, credential, adminRoleId: adminRole.id };
      });
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException('That subdomain is already taken');
      }
      throw error;
    }
  }

  private buildDefaultSchoolYear(schoolId: string) {
    const year = new Date().getFullYear();
    return {
      schoolId,
      name: String(year),
      status: 'Current' as const,
      sequenceNumber: 1,
      firstDay: `${year}-01-01`,
      lastDay: `${year}-12-31`,
    };
  }

  /**
   * Seeds all 5 canonical Gibbon roles (not just Admin) with the Actions
   * their slot's defaultPermission* flag grants - mirrors what a fresh
   * Gibbon install seeds. Returns the Admin role, since the signing-up
   * person needs it.
   */
  private async seedDefaultRolesAndPermissions(
    rolesRepo: Repository<Role>,
    permissionsRepo: Repository<Permission>,
    schoolId: string,
    allActions: Action[],
  ): Promise<Role> {
    let adminRole: Role | undefined;

    for (const seed of DEFAULT_ROLE_SEEDS) {
      const role = await rolesRepo.save(
        rolesRepo.create({
          schoolId,
          category: seed.category,
          name: seed.name,
          shortName: seed.shortName,
          description: seed.description,
          restriction: seed.restriction,
          type: 'Core',
        }),
      );

      if (seed.slot === 'Admin') {
        adminRole = role;
      }

      const grantedActions = getDefaultActionsForSlot(seed.slot, allActions);
      if (grantedActions.length > 0) {
        await permissionsRepo.save(
          grantedActions.map((action) =>
            permissionsRepo.create({
              roleId: role.id,
              actionId: action.id,
              conditions: action.defaultConditions ?? null,
            }),
          ),
        );
      }
    }

    // DEFAULT_ROLE_SEEDS is a fixed constant that always includes the
    // 'Admin' slot (see rbac/seed/default-roles.ts) - this is an invariant,
    // not a real runtime possibility.
    if (!adminRole) {
      throw new Error('DEFAULT_ROLE_SEEDS is missing the Admin slot');
    }
    return adminRole;
  }
}
