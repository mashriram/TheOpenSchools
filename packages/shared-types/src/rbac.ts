export const MODULE_TYPES = ['Core', 'Additional'] as const;
export type ModuleType = (typeof MODULE_TYPES)[number];

export const ROLE_TYPES = ['Core', 'Additional'] as const;
export type RoleType = (typeof ROLE_TYPES)[number];

export const ROLE_CATEGORIES = ['Staff', 'Student', 'Parent', 'Other'] as const;
export type RoleCategory = (typeof ROLE_CATEGORIES)[number];

export const ROLE_RESTRICTIONS = ['None', 'SameRole', 'AdminOnly'] as const;
export type RoleRestriction = (typeof ROLE_RESTRICTIONS)[number];

/**
 * The 5 canonical roles every school gets seeded with at signup, matching
 * Gibbon's real gibbonRoleID 001/002/003/004/006 (note: 005 doesn't exist in
 * real Gibbon data either - never assume a contiguous id range). Each slot
 * corresponds 1:1 to one of Action's defaultPermission{Admin,Teacher,Student,
 * Parent,Support} flags.
 */
export const DEFAULT_ROLE_SLOTS = [
  'Admin',
  'Teacher',
  'Student',
  'Parent',
  'Support',
] as const;
export type DefaultRoleSlot = (typeof DEFAULT_ROLE_SLOTS)[number];
