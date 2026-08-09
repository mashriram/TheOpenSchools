import type { ModuleType } from '@purpleschools/shared-types';

export interface FoundationActionSeed {
  name: string;
  category: string;
  description: string;
  verb: string;
  subject: string;
  helpUrl?: string | null;
  precedence?: number;
  entrySidebar?: boolean;
  menuShow?: boolean;
  defaultPermissionAdmin?: boolean;
  defaultPermissionTeacher?: boolean;
  defaultPermissionStudent?: boolean;
  defaultPermissionParent?: boolean;
  defaultPermissionSupport?: boolean;
  /** See Action.defaultConditions' doc comment. */
  defaultConditions?: Record<string, unknown> | null;
  categoryPermissionStaff?: boolean;
  categoryPermissionStudent?: boolean;
  categoryPermissionParent?: boolean;
  categoryPermissionOther?: boolean;
}

export interface FoundationModuleSeed {
  name: string;
  description: string;
  category: string;
  type?: ModuleType;
  actions: FoundationActionSeed[];
}

/**
 * Foundation's action catalog - module/category names and grouping follow
 * Gibbon's real gibbonModule/gibbonAction seed rows (gibbon.sql lines
 * 3490-3517 and 50-75) wherever a direct equivalent exists. Two actions have
 * no Gibbon equivalent at all (people.export/erase) - added now because M9's
 * GDPR endpoints need a permission gate and retrofitting RBAC later is worse
 * than seeding two extra rows today.
 */
export const FOUNDATION_RBAC_CATALOG: FoundationModuleSeed[] = [
  {
    name: 'School Admin',
    description:
      'Configure school years, terms, groupings, facilities, and settings.',
    category: 'Admin',
    actions: [
      {
        name: 'schoolAdmin.schoolYears.manage',
        category: 'Years, Days & Times',
        description: 'Create and edit academic years.',
        verb: 'manage',
        subject: 'SchoolYear',
        defaultPermissionAdmin: true,
      },
      {
        name: 'schoolAdmin.terms.manage',
        category: 'Years, Days & Times',
        description: 'Create and edit school year terms.',
        verb: 'manage',
        subject: 'SchoolYearTerm',
        defaultPermissionAdmin: true,
      },
      {
        name: 'schoolAdmin.yearGroups.manage',
        category: 'Groupings',
        description: 'Create and edit year groups.',
        verb: 'manage',
        subject: 'YearGroup',
        defaultPermissionAdmin: true,
      },
      {
        name: 'schoolAdmin.formGroups.manage',
        category: 'Groupings',
        description: 'Create and edit form groups.',
        verb: 'manage',
        subject: 'FormGroup',
        defaultPermissionAdmin: true,
      },
      {
        name: 'schoolAdmin.houses.manage',
        category: 'Groupings',
        description: 'Create and edit houses.',
        verb: 'manage',
        subject: 'House',
        defaultPermissionAdmin: true,
      },
      {
        name: 'schoolAdmin.spaces.manage',
        category: 'Other',
        description: 'Create and edit spaces and rooms.',
        verb: 'manage',
        subject: 'Space',
        defaultPermissionAdmin: true,
      },
      {
        name: 'schoolAdmin.departments.view',
        category: 'Departments',
        description: 'View department details.',
        verb: 'view',
        subject: 'Department',
        defaultPermissionAdmin: true,
        defaultPermissionTeacher: true,
        defaultPermissionStudent: true,
        defaultPermissionParent: true,
        defaultPermissionSupport: true,
      },
      {
        name: 'schoolAdmin.departments.manage',
        category: 'Departments',
        description: 'Create and edit departments.',
        verb: 'manage',
        subject: 'Department',
        defaultPermissionAdmin: true,
      },
      {
        name: 'schoolAdmin.settings.manage',
        category: 'Settings',
        description: 'Edit school-wide settings.',
        verb: 'manage',
        subject: 'Setting',
        defaultPermissionAdmin: true,
      },
    ],
  },
  {
    name: 'User Admin',
    description: 'Manage user accounts, families, roles, and permissions.',
    category: 'Admin',
    actions: [
      {
        name: 'userAdmin.people.view',
        category: 'User Management',
        description: "View a person's directory profile.",
        verb: 'view',
        subject: 'Person',
        defaultPermissionAdmin: true,
        defaultPermissionTeacher: true,
        defaultPermissionSupport: true,
      },
      {
        name: 'userAdmin.people.manage',
        category: 'User Management',
        description: 'Create and edit user accounts.',
        verb: 'manage',
        subject: 'Person',
        defaultPermissionAdmin: true,
      },
      {
        name: 'userAdmin.people.export',
        category: 'User Management',
        description: "Export a person's data (GDPR right to access).",
        verb: 'export',
        subject: 'Person',
        defaultPermissionAdmin: true,
      },
      {
        name: 'userAdmin.people.erase',
        category: 'User Management',
        description: "Anonymize a person's data (GDPR right to erasure).",
        verb: 'erase',
        subject: 'Person',
        defaultPermissionAdmin: true,
      },
      {
        name: 'userAdmin.families.manage',
        category: 'User Management',
        description: 'Create and edit families and their members.',
        verb: 'manage',
        subject: 'Family',
        defaultPermissionAdmin: true,
      },
      {
        name: 'userAdmin.roles.manage',
        category: 'User Management',
        description: 'Create and edit custom roles.',
        verb: 'manage',
        subject: 'Role',
        defaultPermissionAdmin: true,
      },
      {
        name: 'userAdmin.permissions.manage',
        category: 'User Management',
        description: 'Edit which actions each role is granted.',
        verb: 'manage',
        subject: 'Permission',
        defaultPermissionAdmin: true,
      },
    ],
  },
  {
    name: 'Students',
    description: 'View and manage student profiles and enrolment.',
    category: 'People',
    actions: [
      {
        name: 'students.view',
        category: 'Profiles',
        description: 'View a brief student profile.',
        verb: 'view',
        subject: 'StudentEnrolment',
        defaultPermissionAdmin: true,
        defaultPermissionTeacher: true,
        defaultPermissionSupport: true,
      },
      {
        name: 'students.viewFull',
        category: 'Profiles',
        description: 'View a full student profile.',
        verb: 'view',
        subject: 'StudentEnrolment',
        defaultPermissionAdmin: true,
        defaultPermissionTeacher: true,
      },
      {
        name: 'students.manage',
        category: 'Enrolment',
        description: 'Create and edit student enrolment records.',
        verb: 'manage',
        subject: 'StudentEnrolment',
        defaultPermissionAdmin: true,
      },
    ],
  },
  {
    name: 'Staff',
    description: 'View and manage staff directory information.',
    category: 'People',
    actions: [
      {
        name: 'staff.view',
        category: 'Directory',
        description: 'View staff directory information.',
        verb: 'view',
        subject: 'Staff',
        defaultPermissionAdmin: true,
        defaultPermissionTeacher: true,
        defaultPermissionSupport: true,
      },
      {
        name: 'staff.manage',
        category: 'Directory',
        description: 'Create and edit staff-specific profile information.',
        verb: 'manage',
        subject: 'Staff',
        defaultPermissionAdmin: true,
      },
    ],
  },
];
