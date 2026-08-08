export const AUDIT_ACTIONS = [
  'insert',
  'update',
  'remove',
  'soft-remove',
  'export',
  'erase',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];
