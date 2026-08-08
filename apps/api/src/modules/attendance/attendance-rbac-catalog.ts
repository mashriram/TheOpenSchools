import type { FoundationModuleSeed } from '../rbac/seed/foundation-rbac-catalog';

/**
 * Tier 2, M17: attendance codes, register-taking, and viewing. Module
 * name/category match Gibbon's real gibbonModule row (gibbon.sql line 3496:
 * 'Attendance', category 'Pastoral'). 'manage' actions collapse Gibbon's
 * several scope-tiered actions (e.g. 'Attendance By Form Group_all'/
 * '_myGroups') into one Admin+Teacher-granted action, consistent with
 * Curriculum/Timetable/Markbook's precedent. `attendance.records.view`
 * corresponds to 'Student History_all'/'_myChildren'/'_my' collapsed the
 * same way - the real self/child-vs-everyone distinction is enforced by
 * AttendanceAccessService.assertCanViewAttendance(), not by separate RBAC
 * actions.
 */
export const ATTENDANCE_RBAC_CATALOG: FoundationModuleSeed[] = [
  {
    name: 'Attendance',
    description: 'School attendance taking.',
    category: 'Pastoral',
    actions: [
      {
        name: 'attendance.codes.manage',
        category: 'Attendance',
        description: 'Create and edit attendance codes.',
        verb: 'manage',
        subject: 'AttendanceCode',
        defaultPermissionAdmin: true,
      },
      {
        name: 'attendance.formGroupRegisters.manage',
        category: 'Take Attendance',
        description: 'Take and edit form group attendance registers.',
        verb: 'manage',
        subject: 'AttendanceLogFormGroup',
        defaultPermissionAdmin: true,
        defaultPermissionTeacher: true,
      },
      {
        name: 'attendance.courseClassRegisters.manage',
        category: 'Take Attendance',
        description: 'Take and edit class attendance registers.',
        verb: 'manage',
        subject: 'AttendanceLogCourseClass',
        defaultPermissionAdmin: true,
        defaultPermissionTeacher: true,
      },
      {
        name: 'attendance.records.view',
        category: 'Reports',
        description: "View a person's own attendance history.",
        verb: 'view',
        subject: 'AttendanceLogPerson',
        defaultPermissionAdmin: true,
        defaultPermissionTeacher: true,
        defaultPermissionStudent: true,
        defaultPermissionParent: true,
      },
    ],
  },
];
