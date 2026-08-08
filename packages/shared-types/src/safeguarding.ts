/**
 * Shared vocabulary for Tier 2's safeguarding cluster (Individual Needs,
 * Student Alerts). Gibbon models both as real DB lookup tables
 * (gibbonINDescriptor, gibbonAlertLevel) despite never actually letting a
 * school customize or extend either one in practice - real Gibbon only
 * ever seeds these 3 fixed rows each, with no admin UI to add a 4th. This
 * codebase avoids inventing multi-tenant semantics (and an admin CRUD
 * surface) for something that's a fixed enum in every real deployment: a
 * deliberate simplification, not an oversight, matching this plan's
 * "avoid overbuilding" review discipline.
 */
export const INDIVIDUAL_NEED_DESCRIPTOR_TYPES = [
  'SEN',
  'EAL',
  'Other Needs',
] as const;
export type IndividualNeedDescriptorType =
  (typeof INDIVIDUAL_NEED_DESCRIPTOR_TYPES)[number];

export const SAFEGUARDING_SEVERITY_LEVELS = ['High', 'Medium', 'Low'] as const;
export type SafeguardingSeverityLevel =
  (typeof SAFEGUARDING_SEVERITY_LEVELS)[number];
