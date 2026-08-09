import { Injectable } from '@nestjs/common';
import { PlatformModulesRepository } from '../repositories/platform-modules.repository';
import { ActionsRepository } from '../repositories/actions.repository';
import { PlatformModule } from '../entities/platform-module.entity';
import { Action } from '../entities/action.entity';
import {
  FOUNDATION_RBAC_CATALOG,
  FoundationActionSeed,
  FoundationModuleSeed,
} from './foundation-rbac-catalog';

/**
 * Idempotent by design: matches on the natural key (Module.name, Action.name)
 * rather than any generated id, so running it repeatedly in dev/test/CI - or
 * against a school created by an earlier catalog version - upserts rather
 * than duplicates or errors.
 */
@Injectable()
export class RbacCatalogSeeder {
  constructor(
    private readonly modules: PlatformModulesRepository,
    private readonly actions: ActionsRepository,
  ) {}

  async seedCatalog(
    catalog: readonly FoundationModuleSeed[] = FOUNDATION_RBAC_CATALOG,
  ): Promise<void> {
    for (const moduleSeed of catalog) {
      const module = await this.upsertModule(moduleSeed);
      for (const actionSeed of moduleSeed.actions) {
        await this.upsertAction(module.id, actionSeed);
      }
    }
  }

  private async upsertModule(
    seed: FoundationModuleSeed,
  ): Promise<PlatformModule> {
    const existing = await this.modules.findByName(seed.name);
    const attrs = {
      name: seed.name,
      description: seed.description,
      category: seed.category,
      type: seed.type ?? ('Core' as const),
    };

    if (existing) {
      return this.modules.save(Object.assign(existing, attrs));
    }
    return this.modules.save(this.modules.create({ ...attrs, active: true }));
  }

  private async upsertAction(
    moduleId: string,
    seed: FoundationActionSeed,
  ): Promise<Action> {
    const existing = await this.actions.findByName(seed.name);
    const attrs = {
      moduleId,
      name: seed.name,
      category: seed.category,
      description: seed.description,
      helpUrl: seed.helpUrl ?? null,
      precedence: seed.precedence ?? 0,
      entrySidebar: seed.entrySidebar ?? true,
      menuShow: seed.menuShow ?? true,
      verb: seed.verb,
      subject: seed.subject,
      defaultPermissionAdmin: seed.defaultPermissionAdmin ?? false,
      defaultPermissionTeacher: seed.defaultPermissionTeacher ?? false,
      defaultPermissionStudent: seed.defaultPermissionStudent ?? false,
      defaultPermissionParent: seed.defaultPermissionParent ?? false,
      defaultPermissionSupport: seed.defaultPermissionSupport ?? false,
      defaultConditions: seed.defaultConditions ?? null,
      categoryPermissionStaff: seed.categoryPermissionStaff ?? true,
      categoryPermissionStudent: seed.categoryPermissionStudent ?? true,
      categoryPermissionParent: seed.categoryPermissionParent ?? true,
      categoryPermissionOther: seed.categoryPermissionOther ?? true,
    };

    if (existing) {
      return this.actions.save(Object.assign(existing, attrs));
    }
    return this.actions.save(this.actions.create(attrs));
  }
}
