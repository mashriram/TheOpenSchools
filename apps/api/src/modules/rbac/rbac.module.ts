import { Module } from '@nestjs/common';
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
export class RbacModule {}
