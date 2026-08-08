import type { FoundationModuleSeed } from '../rbac/seed/foundation-rbac-catalog';

/**
 * Tier 2, M16: grading scales, columns, entries, personal targets, and
 * weightings. Module name/category match Gibbon's real gibbonModule row
 * (gibbon.sql line 3497: 'Markbook', category 'Assess'). 'manage' actions
 * collapse Gibbon's several scope-tiered actions (e.g. 'Edit
 * Markbook_singleClass'/'_everything', 'Manage Weightings_singleClass'/
 * '_everything') into one Admin+Teacher-granted action, consistent with
 * Curriculum/Timetable's precedent of not reproducing per-instance
 * ownership scoping unless the plan calls for it. `markbook.entries.view`
 * corresponds to 'View Markbook_myMarks'/'_allClassesAllData' collapsed the
 * same way Timetable's `timetable.schedule.view` collapsed Gibbon's
 * `_my`/`_myChildren`/`_allYears` view actions - the real scope distinction
 * (self/child vs. everyone) is enforced by
 * MarkbookEntriesService.getVisibleEntryForCaller(), not by separate RBAC
 * actions.
 */
export const MARKBOOK_RBAC_CATALOG: FoundationModuleSeed[] = [
  {
    name: 'Markbook',
    description: 'A system for keeping track of marks.',
    category: 'Assess',
    actions: [
      {
        name: 'markbook.scales.manage',
        category: 'Grading Scales',
        description: 'Create and edit grading scales and their grades.',
        verb: 'manage',
        subject: 'Scale',
        defaultPermissionAdmin: true,
      },
      {
        name: 'markbook.columns.manage',
        category: 'Markbook',
        description: 'Create and edit markbook columns.',
        verb: 'manage',
        subject: 'MarkbookColumn',
        defaultPermissionAdmin: true,
        defaultPermissionTeacher: true,
      },
      {
        name: 'markbook.entries.manage',
        category: 'Markbook',
        description: 'Enter and edit grades for a class.',
        verb: 'manage',
        subject: 'MarkbookEntry',
        defaultPermissionAdmin: true,
        defaultPermissionTeacher: true,
      },
      {
        name: 'markbook.entries.view',
        category: 'Markbook',
        description: "View a student's own published grades.",
        verb: 'view',
        subject: 'MarkbookEntry',
        defaultPermissionAdmin: true,
        defaultPermissionTeacher: true,
        defaultPermissionStudent: true,
        defaultPermissionParent: true,
      },
      {
        name: 'markbook.targets.manage',
        category: 'Markbook',
        description: 'Set personal target grades for students.',
        verb: 'manage',
        subject: 'MarkbookTarget',
        defaultPermissionAdmin: true,
        defaultPermissionTeacher: true,
      },
      {
        name: 'markbook.weights.manage',
        category: 'Markbook',
        description: 'Manage markbook column weightings for a class.',
        verb: 'manage',
        subject: 'MarkbookWeight',
        defaultPermissionAdmin: true,
        defaultPermissionTeacher: true,
      },
    ],
  },
];
