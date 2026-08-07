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
  providers: [
    PlatformModulesRepository,
    ActionsRepository,
    RolesRepository,
    PermissionsRepository,
    SchoolModuleEnablementsRepository,
    RbacCatalogSeeder,
  ],
  exports: [
    PlatformModulesRepository,
    ActionsRepository,
    RolesRepository,
    PermissionsRepository,
    SchoolModuleEnablementsRepository,
    RbacCatalogSeeder,
  ],
})
export class RbacModule {}
