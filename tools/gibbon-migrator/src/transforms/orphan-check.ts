export interface ReferenceCheck {
  recordId: string | number;
  field: string;
  value: number | null;
}

export type OrphanReference = ReferenceCheck & { value: number };

/**
 * Gibbon's schema declares zero foreign keys anywhere (confirmed: 0
 * `FOREIGN KEY` / `REFERENCES` statements across gibbon.sql) - referential
 * integrity has only ever been enforced by application code. The migrator
 * must not assume the dump is internally consistent: every reference is
 * checked against the set of ids actually being imported, and mismatches
 * are reported rather than silently inserted as broken data.
 */
export function findOrphanReferences(
  knownIds: ReadonlySet<number>,
  references: readonly ReferenceCheck[],
): OrphanReference[] {
  const orphans: OrphanReference[] = [];

  for (const reference of references) {
    if (reference.value === null) {
      continue;
    }

    if (!knownIds.has(reference.value)) {
      orphans.push(reference as OrphanReference);
    }
  }

  return orphans;
}
