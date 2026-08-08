import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformModule } from './entities/platform-module.entity';
import { Action } from './entities/action.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { SchoolModuleEnablement } from './entities/school-module-enablement.entity';
import { PlatformModulesRepository } from './repositories/platform-modules.repository';
import { ActionsRepository } from './repositories/actions.repository';
import { RolesRepository } from './repositories/roles.repository';
import { PermissionsRepository } from './repositories/permissions.repository';
import { SchoolModuleEnablementsRepository } from './repositories/school-module-enablements.repository';
import { RbacCatalogSeeder } from './seed/rbac-catalog-seeder';
import { CaslAbilityFactory } from './casl-ability.factory';
import { PoliciesGuard } from './policies.guard';
import { RbacService } from './rbac.service';
import { RbacController } from './rbac.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlatformModule,
      Action,
      Role,
      Permission,
      SchoolModuleEnablement,
    ]),
  ],
  controllers: [RbacController],
  providers: [
    PlatformModulesRepository,
    ActionsRepository,
    RolesRepository,
    PermissionsRepository,
    SchoolModuleEnablementsRepository,
    RbacCatalogSeeder,
    CaslAbilityFactory,
    PoliciesGuard,
    RbacService,
  ],
  exports: [
    PlatformModulesRepository,
    ActionsRepository,
    RolesRepository,
    PermissionsRepository,
    SchoolModuleEnablementsRepository,
    RbacCatalogSeeder,
    CaslAbilityFactory,
  ],
})
export class RbacModule implements OnModuleInit {
  constructor(private readonly rbacCatalogSeeder: RbacCatalogSeeder) {}

  // Runs on every app boot (and in e2e tests, which call app.init()) - safe
  // because seedCatalog() is an idempotent upsert. This guarantees the
  // global Module/Action catalog always exists before M7's signup flow
  // needs to grant default permissions, without an easy-to-forget manual
  // ops step. Bare `Test.createTestingModule().compile()` (used by this
  // module's own integration specs) does NOT trigger onModuleInit - only
  // `.init()` does - so those tests are unaffected and keep seeding their
  // own ad hoc fixtures.
  async onModuleInit(): Promise<void> {
    await this.rbacCatalogSeeder.seedCatalog();
  }
}
