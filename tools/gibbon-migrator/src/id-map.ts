/**
 * Gibbon's integer ids are only unique per-install, never safe to reuse
 * directly as PurpleSchools' UUID primary keys. Every transform step
 * assigns a fresh UUID per Gibbon row and records the mapping here, so
 * later steps (e.g. StudentEnrolment needing the new Person/YearGroup/
 * FormGroup ids) can resolve a Gibbon id to the id it was actually given.
 * Scoped by `kind` (e.g. "person", "role") since different tables reuse
 * the same numeric id space independently.
 */
export class IdMap {
  private readonly byKind = new Map<string, Map<number, string>>();

  assign(kind: string, gibbonId: number, newId: string): void {
    let kindMap = this.byKind.get(kind);
    if (!kindMap) {
      kindMap = new Map();
      this.byKind.set(kind, kindMap);
    }
    kindMap.set(gibbonId, newId);
  }

  resolve(kind: string, gibbonId: number): string | undefined {
    return this.byKind.get(kind)?.get(gibbonId);
  }

  knownGibbonIds(kind: string): ReadonlySet<number> {
    return new Set(this.byKind.get(kind)?.keys() ?? []);
  }
}
