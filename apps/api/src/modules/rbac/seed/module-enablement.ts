import { Action } from '../entities/action.entity';
import { PlatformModule } from '../entities/platform-module.entity';

/**
 * A Module's `active` flag is the global kill switch (mirrors Gibbon's
 * gibbonModule.active). Per-school SchoolModuleEnablement is the tenant-level
 * toggle on top of that. An Action is only ever grantable if both are true.
 * Pure and DB-free so the decision logic is testable without seeding a real
 * School/SchoolModuleEnablement row.
 */
export function isActionGrantable(
  action: Pick<Action, 'moduleId'>,
  activeModuleIds: ReadonlySet<string>,
  enabledModuleIds: ReadonlySet<string>,
): boolean {
  return (
    activeModuleIds.has(action.moduleId) &&
    enabledModuleIds.has(action.moduleId)
  );
}

export function filterGrantableActions(
  actions: readonly Action[],
  modules: readonly Pick<PlatformModule, 'id' | 'active'>[],
  enabledModuleIds: ReadonlySet<string>,
): Action[] {
  const activeModuleIds = new Set(
    modules.filter((m) => m.active).map((m) => m.id),
  );
  return actions.filter((action) =>
    isActionGrantable(action, activeModuleIds, enabledModuleIds),
  );
}
