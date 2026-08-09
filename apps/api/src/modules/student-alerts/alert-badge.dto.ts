import type { SafeguardingSeverityLevel } from '@purpleschools/shared-types';

/**
 * Fixes Gibbon's real bug #2 directly (plan §M19): a badge/profile-summary
 * shape that is STRUCTURALLY incapable of embedding an alert's raw
 * `comment` - there is no field for it. In reference Gibbon, an automatic
 * "Privacy" badge renders `Person.privacy` verbatim in a tooltip to any
 * staff who can view a student's profile, regardless of the alert type's
 * `adminOnly` flag - never consulted for that badge at all. This codebase
 * doesn't port that automatic badge (see AlertType's doc comment); this
 * DTO is what any future badge/summary endpoint must use instead.
 */
export interface AlertBadgeDto {
  id: string;
  alertTypeName: string;
  alertTypeTag: string | null;
  color: string | null;
  colorBG: string | null;
  level: SafeguardingSeverityLevel | null;
}
