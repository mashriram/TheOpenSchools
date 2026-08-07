import type { DefaultRoleSlot } from '@purpleschools/shared-types';
import { Action } from '../entities/action.entity';

const SLOT_TO_DEFAULT_PERMISSION_FLAG: Record<
  DefaultRoleSlot,
  keyof Pick<
    Action,
    | 'defaultPermissionAdmin'
    | 'defaultPermissionTeacher'
    | 'defaultPermissionStudent'
    | 'defaultPermissionParent'
    | 'defaultPermissionSupport'
  >
> = {
  Admin: 'defaultPermissionAdmin',
  Teacher: 'defaultPermissionTeacher',
  Student: 'defaultPermissionStudent',
  Parent: 'defaultPermissionParent',
  Support: 'defaultPermissionSupport',
};

/**
 * Pure function, deliberately DB-free: given one of the 5 canonical role
 * slots and the full Action catalog, returns exactly the Actions that slot's
 * defaultPermission* flag grants. Gibbon's install-time seeding logic, made
 * testable without a database.
 */
export function getDefaultActionsForSlot(
  slot: DefaultRoleSlot,
  actions: readonly Action[],
): Action[] {
  const flag = SLOT_TO_DEFAULT_PERMISSION_FLAG[slot];
  return actions.filter((action) => action[flag]);
}
