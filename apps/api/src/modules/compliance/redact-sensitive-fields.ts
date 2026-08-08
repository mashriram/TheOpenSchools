/**
 * Never logged in an audit row, even redacted-in-shape - these are exactly
 * the fields the plan's Compliance design calls out by name ("passwords/
 * tokens never logged").
 */
export const SENSITIVE_AUDIT_FIELDS = new Set([
  'passwordHash',
  'mfaSecret',
  'tokenHash',
  'refreshToken',
]);

/**
 * Replaces sensitive values with a fixed marker rather than deleting the
 * key - so an audit reader can see the field existed and changed, without
 * ever seeing its value. Pure and DB-free so the denylist itself is
 * directly unit-testable.
 */
export function redactSensitiveFields(
  entity: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!entity) {
    return null;
  }
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(entity)) {
    redacted[key] = SENSITIVE_AUDIT_FIELDS.has(key) ? '[REDACTED]' : value;
  }
  return redacted;
}
