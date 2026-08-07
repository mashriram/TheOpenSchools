export const SCHOOL_STATUSES = ['PendingVerification', 'Active', 'Suspended'] as const;
export type SchoolStatus = (typeof SCHOOL_STATUSES)[number];

export const SCHOOL_PLAN_TIERS = ['Free', 'Standard'] as const;
export type SchoolPlanTier = (typeof SCHOOL_PLAN_TIERS)[number];

export const SCHOOL_YEAR_STATUSES = ['Past', 'Current', 'Upcoming'] as const;
export type SchoolYearStatus = (typeof SCHOOL_YEAR_STATUSES)[number];

/**
 * DNS-label-safe subdomain slug: lowercase alphanumeric, hyphens allowed in the
 * middle only, 2-63 characters (RFC 1035 label length limit).
 */
export const SUBDOMAIN_SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
