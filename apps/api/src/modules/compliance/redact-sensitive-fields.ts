/**
 * Never logged in an audit row, even redacted-in-shape - these are exactly
 * the fields the plan's Compliance design calls out by name ("passwords/
 * tokens never logged"). Global: applies regardless of which entity is
 * being audited.
 */
export const SENSITIVE_AUDIT_FIELDS = new Set([
  'passwordHash',
  'mfaSecret',
  'tokenHash',
  'refreshToken',
]);

export interface EntitySensitiveFields {
  /**
   * Omitted from the audit snapshot entirely - the log records that a
   * change happened, never what it changed to or from. Appropriate when
   * the field has no legitimate forensic-history value worth keeping
   * anywhere (see plan §Data Safety Design D).
   */
  omit?: Set<string>;
  /**
   * Kept in the snapshot, but encrypted with the same Tier C column
   * encryption as the source entity - appropriate when an authorized
   * safeguarding lead has a real need to see edit history (e.g. "was this
   * note altered after the incident?"), so blanking it entirely would
   * destroy value the audit log exists to preserve.
   */
  encrypt?: Set<string>;
}

/**
 * Per-entity Tier B/C field classification (see plan §Data Safety Design A/
 * D), keyed by TypeORM entity class name (already threaded through
 * AuditService.record() as `entityName`). Deliberately a plain Set-keyed
 * map extending the existing SENSITIVE_AUDIT_FIELDS convention, not a
 * decorator/Reflect-metadata mechanism - there's no existing precedent for
 * that in this codebase, and generic field names like `comment`/`notes` are
 * reused across many entities with wildly different sensitivity, so a
 * single global flat Set (as used for secrets above) doesn't scale to Tier
 * 2's entities. Populated as each Tier B/C entity is built (Alert,
 * IndividualNeed, Behaviour, ...) - empty until then.
 */
export const SENSITIVE_FIELDS_BY_ENTITY: Record<string, EntitySensitiveFields> =
  {};

/**
 * Replaces sensitive values with a fixed marker (secrets) or an encrypted
 * value (Tier C content worth keeping forensic history for) rather than
 * deleting the key outright wherever a value should still be knowable to
 * have existed - so an audit reader can see the field existed and changed,
 * without ever seeing its real value unless authorized. Tier C fields in
 * `omit` are the one case where the key is dropped entirely.
 *
 * `encryptValue` is injected (not called via a hardcoded encryption
 * dependency) so this stays pure and DB/env-free for unit testing - the
 * real caller (AuditService) passes a value bound to the app's configured
 * encryption secret.
 */
export function redactSensitiveFields(
  entity: Record<string, unknown> | null | undefined,
  entityName?: string,
  encryptValue: (value: string) => string = () => {
    throw new Error(
      'redactSensitiveFields: an encryptValue function must be supplied to redact an ' +
        'entity with encrypt-classified fields - the default deliberately throws rather ' +
        'than silently persisting the value unencrypted.',
    );
  },
): Record<string, unknown> | null {
  if (!entity) {
    return null;
  }
  const perEntity = entityName
    ? SENSITIVE_FIELDS_BY_ENTITY[entityName]
    : undefined;
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(entity)) {
    if (perEntity?.omit?.has(key)) {
      continue;
    }
    if (SENSITIVE_AUDIT_FIELDS.has(key)) {
      redacted[key] = '[REDACTED]';
    } else if (perEntity?.encrypt?.has(key) && typeof value === 'string') {
      redacted[key] = encryptValue(value);
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}
