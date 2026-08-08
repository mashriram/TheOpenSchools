import type { FoundationModuleSeed } from '../rbac/seed/foundation-rbac-catalog';

/**
 * Tier 2, M18: Individual Needs records and safeguarding investigations.
 * Module name/category match Gibbon's real gibbonModule row (gibbon.sql
 * line 3500: 'Individual Needs', category 'Pastoral'). Gibbon's real three
 * view tiers (`_view`/`_viewContribute`/`_viewEdit`) only ever gate
 * *editing* which fields in Gibbon itself - every tier can read the full
 * narrative. Here, `individualNeeds.summary.view` (broad: Admin+Teacher)
 * and `individualNeeds.detail.view` (Admin only by default) are genuinely
 * different READ grants: a school can create a custom role (e.g. "SENCO")
 * and grant it `individualNeeds.detail.view` without touching the default
 * Teacher role, fixing the real gap directly (see
 * IndividualNeedsService.getForCaller()).
 */
export const INDIVIDUAL_NEEDS_RBAC_CATALOG: FoundationModuleSeed[] = [
  {
    name: 'Individual Needs',
    description: 'Manage individual needs records and investigations.',
    category: 'Pastoral',
    actions: [
      {
        name: 'individualNeeds.summary.view',
        category: 'Individual Needs',
        description:
          "View a summary of a student's individual needs descriptors.",
        verb: 'view',
        subject: 'IndividualNeedSummary',
        defaultPermissionAdmin: true,
        defaultPermissionTeacher: true,
      },
      {
        name: 'individualNeeds.detail.view',
        category: 'Individual Needs',
        description:
          "View the full narrative content of a student's individual needs record.",
        verb: 'view',
        subject: 'IndividualNeedDetail',
        defaultPermissionAdmin: true,
      },
      {
        name: 'individualNeeds.manage',
        category: 'Individual Needs',
        description:
          'Create and edit individual needs records and descriptors.',
        verb: 'manage',
        subject: 'IndividualNeed',
        defaultPermissionAdmin: true,
      },
      {
        name: 'individualNeeds.investigations.manage',
        category: 'Individual Needs',
        description:
          'Create and contribute to individual needs investigations.',
        verb: 'manage',
        subject: 'IndividualNeedInvestigation',
        defaultPermissionAdmin: true,
        defaultPermissionTeacher: true,
      },
    ],
  },
];
