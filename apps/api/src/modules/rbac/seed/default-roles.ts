import type {
  DefaultRoleSlot,
  RoleCategory,
  RoleRestriction,
} from '@purpleschools/shared-types';

export interface DefaultRoleSeed {
  slot: DefaultRoleSlot;
  category: RoleCategory;
  name: string;
  shortName: string;
  description: string;
  restriction: RoleRestriction;
}

/**
 * Transcribed directly from Gibbon's real gibbonRole seed rows (gibbon.sql
 * lines 5056-5061: gibbonRoleID 001/002/003/004/006 - note 005 doesn't exist
 * even in real Gibbon data). Every school gets exactly these 5 Core roles at
 * signup (M7); each slot maps 1:1 to one of Action's
 * defaultPermission{Admin,Teacher,Student,Parent,Support} flags.
 */
export const DEFAULT_ROLE_SEEDS: DefaultRoleSeed[] = [
  {
    slot: 'Admin',
    category: 'Staff',
    name: 'Administrator',
    shortName: 'Adm',
    description: 'Controls all aspects of the system',
    restriction: 'AdminOnly',
  },
  {
    slot: 'Teacher',
    category: 'Staff',
    name: 'Teacher',
    shortName: 'Tcr',
    description: 'Regular, classroom teacher',
    restriction: 'None',
  },
  {
    slot: 'Student',
    category: 'Student',
    name: 'Student',
    shortName: 'Std',
    description: 'Person studying in the school',
    restriction: 'None',
  },
  {
    slot: 'Parent',
    category: 'Parent',
    name: 'Parent',
    shortName: 'Prt',
    description: 'Parent or guardian of a person studying in the school',
    restriction: 'None',
  },
  {
    slot: 'Support',
    category: 'Staff',
    name: 'Support Staff',
    shortName: 'SSt',
    description: 'Staff who support teaching and learning',
    restriction: 'None',
  },
];
