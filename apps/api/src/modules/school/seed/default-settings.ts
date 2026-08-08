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
  ];
}
