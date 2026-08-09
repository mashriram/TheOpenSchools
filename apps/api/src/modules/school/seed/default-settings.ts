export interface DefaultSettingSeed {
  scope: string;
  name: string;
  nameDisplay: string;
  description: string;
  value: string;
}

/**
 * Seeded once per school at signup (M7). Deliberately minimal - unlike the
 * RBAC catalog (grounded in real Gibbon seed data), Gibbon's own
 * gibbonSetting table ships ~150 install-wide settings spanning every
 * module, most of which don't apply until their owning module exists. Only
 * the two genuinely Foundation-relevant ones are seeded now; more arrive
 * as their owning module (Tier 2/3) is built, the same incremental pattern
 * already used for RBAC actions.
 */
export function buildDefaultSettings(
  schoolName: string,
  organisationEmail: string,
): DefaultSettingSeed[] {
  return [
    {
      scope: 'System',
      name: 'organisationName',
      nameDisplay: 'Organisation Name',
      description: "The school's name, shown throughout the system.",
      value: schoolName,
    },
    {
      scope: 'System',
      name: 'organisationEmail',
      nameDisplay: 'Organisation Email',
      description: 'The main contact email address for the school.',
      value: organisationEmail,
    },
    {
      // Tier 2, M23: Gibbon has zero retention coverage for Messenger at
      // all - this is a genuinely new capability, not parity. Nullable-by-
      // absence would silently mean "forever"; seeding an explicit default
      // (schools can change/clear it via the existing Settings CRUD) makes
      // the retention window visible and configurable from day one,
      // matching Finance's `retentionPeriodMonths` design (plan §F).
      scope: 'Messenger',
      name: 'retentionWindowMonths',
      nameDisplay: 'Message Retention Window (months)',
      description:
        'Message subjects/bodies older than this are scrubbed by the retention job. Leave blank to disable scrubbing.',
      value: '24',
    },
  ];
}
