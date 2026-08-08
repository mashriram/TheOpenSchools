import type { FoundationModuleSeed } from '../rbac/seed/foundation-rbac-catalog';

/**
 * Tier 2, M14: Course/CourseClass/CourseClassPerson/Unit management. Module
 * name matches Gibbon's real gibbonModule row for this action set
 * ('Timetable Admin', category 'Admin') even though Timetable itself isn't
 * built yet - Course/Class management has always lived under that module
 * name in Gibbon, and Timetable (a later Tier 2 milestone) will add its own
 * actions to this same module rather than inventing a new one.
 */
export const CURRICULUM_RBAC_CATALOG: FoundationModuleSeed[] = [
  {
    name: 'Timetable Admin',
    description: 'Manage courses, classes, and their enrolment.',
    category: 'Admin',
    actions: [
      {
        name: 'curriculum.courses.manage',
        category: 'Courses & Classes',
        description: 'Create and edit courses.',
        verb: 'manage',
        subject: 'Course',
        defaultPermissionAdmin: true,
        defaultPermissionTeacher: true,
      },
      {
        name: 'curriculum.classes.manage',
        category: 'Courses & Classes',
        description: 'Create and edit course classes.',
        verb: 'manage',
        subject: 'CourseClass',
        defaultPermissionAdmin: true,
        defaultPermissionTeacher: true,
      },
      {
        name: 'curriculum.enrolment.manage',
        category: 'Courses & Classes',
        description: 'Manage student and staff enrolment in course classes.',
        verb: 'manage',
        subject: 'CourseClassPerson',
        defaultPermissionAdmin: true,
        defaultPermissionTeacher: true,
      },
      {
        name: 'curriculum.units.manage',
        category: 'Courses & Classes',
        description: 'Create and edit curriculum units.',
        verb: 'manage',
        subject: 'Unit',
        defaultPermissionAdmin: true,
        defaultPermissionTeacher: true,
      },
    ],
  },
];
