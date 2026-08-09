import type { FoundationModuleSeed } from '../rbac/seed/foundation-rbac-catalog';

/**
 * Tier 2, M19: alert types and student alerts. Module name/category match
 * Gibbon's real gibbonModule row (gibbon.sql line 3516: 'Student Alerts',
 * category 'Pastoral').
 *
 * Fixes Gibbon's real bug #1 directly: reference Gibbon's `adminOnly` flag
 * only ever filters which alert types appear in the *creation* dropdown -
 * it is never checked when *viewing* an alert. Here, 'view'/'Alert' is
 * split into two named actions carrying different `defaultConditions`
 * (Action.defaultConditions - see that column's doc comment), mirroring
 * how Gibbon itself splits a single conceptual permission into several
 * fixed-scope named actions (`_all`/`_headOfYear`/`_my`) rather than one
 * action with a role-varying condition:
 *   - `studentAlerts.alerts.view` (Admin only, unconditioned) - sees every
 *     alert including admin-only types (Medical/Privacy/...).
 *   - `studentAlerts.alerts.viewNonRestricted` (Admin+Teacher+Support,
 *     conditions `{ alertTypeAdminOnly: false }`) - can never see an
 *     admin-only-typed alert, by construction, not just by dropdown
 *     filtering. A school can grant the elevated `.view` action to a
 *     custom role (e.g. "Designated Safeguarding Lead") without touching
 *     the default Teacher role.
 * The same split is applied symmetrically to `manage` (create/edit),
 * hardening Gibbon's own dropdown-only (client-side, bypassable) creation
 * filter into a real server-side check.
 */
export const STUDENT_ALERTS_RBAC_CATALOG: FoundationModuleSeed[] = [
  {
    name: 'Student Alerts',
    description: 'View, create and manage alerts for students.',
    category: 'Pastoral',
    actions: [
      {
        name: 'studentAlerts.types.manage',
        category: 'Alert Types',
        description: 'Create and edit alert types.',
        verb: 'manage',
        subject: 'AlertType',
        defaultPermissionAdmin: true,
      },
      {
        name: 'studentAlerts.alerts.manageRestricted',
        category: 'Alerts',
        description:
          'Create and edit alerts of any type, including admin-only types.',
        verb: 'manage',
        subject: 'Alert',
        defaultPermissionAdmin: true,
      },
      {
        name: 'studentAlerts.alerts.manage',
        category: 'Alerts',
        description: 'Create and edit alerts of non-admin-only types.',
        verb: 'manage',
        subject: 'Alert',
        defaultConditions: { alertTypeAdminOnly: false },
        defaultPermissionAdmin: true,
        defaultPermissionTeacher: true,
      },
      {
        name: 'studentAlerts.alerts.view',
        category: 'Alerts',
        description: 'View all alerts, including admin-only types.',
        verb: 'view',
        subject: 'Alert',
        defaultPermissionAdmin: true,
      },
      {
        name: 'studentAlerts.alerts.viewNonRestricted',
        category: 'Alerts',
        description: 'View alerts of non-admin-only types.',
        verb: 'view',
        subject: 'Alert',
        defaultConditions: { alertTypeAdminOnly: false },
        defaultPermissionAdmin: true,
        defaultPermissionTeacher: true,
        defaultPermissionSupport: true,
      },
    ],
  },
];
