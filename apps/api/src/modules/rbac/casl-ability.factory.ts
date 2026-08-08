import { Injectable } from '@nestjs/common';
import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
} from '@casl/ability';
import { PermissionsRepository } from './repositories/permissions.repository';
import { SchoolModuleEnablementsRepository } from './repositories/school-module-enablements.repository';
import { isActionGrantable } from './seed/module-enablement';

export type AppAbility = MongoAbility<[string, string]>;

/**
 * Builds a CASL Ability from a Role's granted Permissions, gated by module
 * enablement: a disabled SchoolModuleEnablement (or a globally inactive
 * PlatformModule) removes that module's actions from the built ability even
 * if a Permission row still grants it. This is the direct replacement for
 * Gibbon's ad hoc isActionAccessible() check, now centralized in one place
 * instead of called at the top of every page script.
 *
 * Permission.conditions (schema-ready for Tier 2's row-level rules) is not
 * wired into `can()` yet: every row is `null` this milestone, and CASL v7's
 * MongoAbility conditions type parameter doesn't compose cleanly with a
 * dynamically-shaped JSON column without real query shapes to type it
 * against. Revisit when Tier 2 defines what those shapes actually are.
 */
@Injectable()
export class CaslAbilityFactory {
  constructor(
    private readonly permissions: PermissionsRepository,
    private readonly schoolModuleEnablements: SchoolModuleEnablementsRepository,
  ) {}

  async buildAbilityForRole(
    schoolId: string,
    activeRoleId: string,
  ): Promise<AppAbility> {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    const permissions = await this.permissions.findByRole(activeRoleId);
    const enabledModuleIds = new Set(
      await this.schoolModuleEnablements.findEnabledModuleIds(schoolId),
    );
    const activeModuleIds = new Set(
      permissions
        .filter((p) => p.action.module.active)
        .map((p) => p.action.moduleId),
    );

    for (const permission of permissions) {
      if (
        !isActionGrantable(permission.action, activeModuleIds, enabledModuleIds)
      ) {
        continue;
      }

      can(permission.action.verb, permission.action.subject);
    }

    return build();
  }
}
