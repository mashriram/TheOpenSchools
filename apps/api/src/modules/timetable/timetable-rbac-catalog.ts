import type { FoundationModuleSeed } from '../rbac/seed/foundation-rbac-catalog';

/**
 * Tier 2, M15: Timetable structure/admin actions extend the same
 * 'Timetable Admin' module M14 created (Course/Class management has
 * always lived there too - the seeder's upsertModule is idempotent by
 * name, so a second catalog file targeting the same module is expected),
 * plus a separate 'Timetable' module matching Gibbon's real
 * gibbonModuleID=0014 for the broadly-granted view action.
 */
export const TIMETABLE_RBAC_CATALOG: FoundationModuleSeed[] = [
  {
    name: 'Timetable Admin',
    description: 'Manage courses, classes, and their enrolment.',
    category: 'Admin',
    actions: [
      {
        name: 'timetable.columns.manage',
        category: 'Timetable',
        description: 'Create and edit timetable period patterns.',
        verb: 'manage',
        subject: 'TimetableColumn',
        defaultPermissionAdmin: true,
      },
      {
        name: 'timetable.timetables.manage',
        category: 'Timetable',
        description: 'Create and manage timetables.',
        verb: 'manage',
        subject: 'Timetable',
        defaultPermissionAdmin: true,
      },
      {
        name: 'timetable.days.manage',
        category: 'Timetable',
        description: 'Manage timetable days and their calendar-date mappings.',
        verb: 'manage',
        subject: 'TimetableDay',
        defaultPermissionAdmin: true,
      },
      {
        name: 'timetable.scheduledClasses.manage',
        category: 'Timetable',
        description: 'Schedule classes into timetable periods and rooms.',
        verb: 'manage',
        subject: 'TimetableDayRowClass',
        defaultPermissionAdmin: true,
      },
      {
        name: 'timetable.facilityBookings.manage',
        category: 'Facilities',
        description: 'Book rooms and facilities outside the regular timetable.',
        verb: 'manage',
        subject: 'FacilityBooking',
        defaultPermissionAdmin: true,
        defaultPermissionTeacher: true,
      },
    ],
  },
  {
    name: 'Timetable',
    description: 'Allows users to view timetables.',
    category: 'Learn',
    actions: [
      {
        name: 'timetable.schedule.view',
        category: 'View Timetables',
        description: "View a person's timetable schedule.",
        verb: 'view',
        subject: 'Timetable',
        defaultPermissionAdmin: true,
        defaultPermissionTeacher: true,
        defaultPermissionStudent: true,
        defaultPermissionParent: true,
        defaultPermissionSupport: true,
      },
    ],
  },
];
