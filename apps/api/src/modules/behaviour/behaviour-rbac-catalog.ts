import type { FoundationModuleSeed } from '../rbac/seed/foundation-rbac-catalog';

/**
 * Tier 2, M20: behaviour records, follow-ups, and letter snapshots. Module
 * name/category match Gibbon's real gibbonModule row (gibbon.sql line
 * 3506: 'Behaviour', category 'Pastoral'). `behaviour.records.view` is
 * broadly granted by default (Admin/Teacher/Student/Parent, matching
 * Gibbon's real `_all`/`_myChildren`/`_my`/`_myself` view actions collapsed
 * into one), and the self/child-vs-staff field-visibility split is
 * enforced by BehaviourService.getVisibleBehaviour()/listForPerson(), not
 * by separate RBAC actions - see that service's doc comment.
 * `behaviour.letters.*` are Admin+Teacher only by default, matching
 * Gibbon's real 'View Behaviour Letters' action (never granted to
 * Student/Parent - the letter itself is emailed to parents; there is no
 * parent-facing "sent letters" list in Gibbon).
 */
export const BEHAVIOUR_RBAC_CATALOG: FoundationModuleSeed[] = [
  {
    name: 'Behaviour',
    description: 'Tracking student behaviour.',
    category: 'Pastoral',
    actions: [
      {
        name: 'behaviour.records.manage',
        category: 'Behaviour Records',
        description: 'Create and edit behaviour records.',
        verb: 'manage',
        subject: 'Behaviour',
        defaultPermissionAdmin: true,
        defaultPermissionTeacher: true,
      },
      {
        name: 'behaviour.records.view',
        category: 'Behaviour Records',
        description: 'View behaviour records.',
        verb: 'view',
        subject: 'Behaviour',
        defaultPermissionAdmin: true,
        defaultPermissionTeacher: true,
        defaultPermissionStudent: true,
        defaultPermissionParent: true,
      },
      {
        name: 'behaviour.followUps.manage',
        category: 'Behaviour Records',
        description: 'Add follow-up notes to behaviour records.',
        verb: 'manage',
        subject: 'BehaviourFollowUp',
        defaultPermissionAdmin: true,
        defaultPermissionTeacher: true,
      },
      {
        name: 'behaviour.letters.manage',
        category: 'Behaviour Letters',
        description: 'Send behaviour letters to parents.',
        verb: 'manage',
        subject: 'BehaviourLetterSnapshot',
        defaultPermissionAdmin: true,
        defaultPermissionTeacher: true,
      },
      {
        name: 'behaviour.letters.view',
        category: 'Behaviour Letters',
        description: 'View previously sent behaviour letters.',
        verb: 'view',
        subject: 'BehaviourLetterSnapshot',
        defaultPermissionAdmin: true,
        defaultPermissionTeacher: true,
      },
    ],
  },
];
