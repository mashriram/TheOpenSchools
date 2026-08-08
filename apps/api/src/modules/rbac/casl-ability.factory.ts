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
 * CASL's AbilityBuilder.can() overloads type-check `conditions` against a
 * closed literal subject/interface union it can infer instance shapes from
 * - our subject slot is deliberately plain `string` (Foundation's free-text,
 * migration-safe verb/subject catalog; see the class doc comment below), so
 * TypeScript can never resolve a conditions-accepting overload for it. This
 * narrow, local cast is the accepted boundary for that structural mismatch;
 * the runtime behavior is correct (CASL doesn't care about these literal
 * types at runtime) and is covered by this file's and authorize.spec.ts's
 * tests - do not "fix" this by widening it further or casting `can` itself.
 */
type ConditionalCanBuilder = (
  verb: string,
  subjectType: string,
  conditions: Record<string, unknown>,
) => void;

/**
 * Builds a CASL Ability from a Role's granted Permissions, gated by module
 * enablement: a disabled SchoolModuleEnablement (or a globally inactive
 * PlatformModule) removes that module's actions from the built ability even
 * if a Permission row still grants it. This is the direct replacement for
 * Gibbon's ad hoc isActionAccessible() check, now centralized in one place
 * instead of called at the top of every page script.
 *
 * Permission.conditions (schema-ready since Foundation) is wired into
 * `can()` starting in Tier 2: a truthy `conditions` value on a Permission
 * row is passed as `can()`'s third argument, matched by CASL's default
 * matcher against a literal-comparison projection object callers build at
 * the check site (see rbac/authorize.ts's assertCan() for single-record
 * checks, and each Tier 2 service's list methods for the plain-TypeScript
 * list-scoping branches - see plan §Data Safety Design B for why a generic
 * condition-to-SQL translator was deliberately rejected in favor of this).
 * A `null`/absent conditions value (every Foundation-era Permission row)
 * keeps calling the unconditional 2-arg `can()` form, so this is additive,
 * not a behavior change for existing roles.
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

      if (permission.conditions) {
        (can as unknown as ConditionalCanBuilder)(
          permission.action.verb,
          permission.action.subject,
          permission.conditions,
        );
      } else {
        can(permission.action.verb, permission.action.subject);
      }
    }

    return build();
  }
}
