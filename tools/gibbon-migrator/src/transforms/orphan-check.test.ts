import { describe, expect, it } from "vitest";
import { findOrphanReferences } from "./orphan-check";

describe("findOrphanReferences", () => {
  it("returns no orphans when every reference resolves to a known id", () => {
    const knownIds = new Set([1, 2, 3]);
    const references = [
      { recordId: "p1", field: "gibbonSchoolYearID", value: 1 },
      { recordId: "p2", field: "gibbonSchoolYearID", value: 3 },
    ];

    expect(findOrphanReferences(knownIds, references)).toEqual([]);
  });

  it("reports a reference whose value is not in the known id set", () => {
    const knownIds = new Set([1, 2, 3]);
    const references = [
      { recordId: "p1", field: "gibbonSchoolYearID", value: 99 },
    ];

    expect(findOrphanReferences(knownIds, references)).toEqual([
      { recordId: "p1", field: "gibbonSchoolYearID", value: 99 },
    ]);
  });

  it("reports one orphan entry per offending record, even for the same dangling id", () => {
    const knownIds = new Set([1]);
    const references = [
      { recordId: "p1", field: "gibbonFamilyID", value: 99 },
      { recordId: "p2", field: "gibbonFamilyID", value: 99 },
    ];

    expect(findOrphanReferences(knownIds, references)).toEqual([
      { recordId: "p1", field: "gibbonFamilyID", value: 99 },
      { recordId: "p2", field: "gibbonFamilyID", value: 99 },
    ]);
  });

  it("does not flag null values, since a nullable FK with no value is valid", () => {
    const knownIds = new Set([1, 2, 3]);
    const references = [
      { recordId: "p1", field: "gibbonHouseID", value: null },
    ];

    expect(findOrphanReferences(knownIds, references)).toEqual([]);
  });

  it("treats every non-null reference as orphaned when the known id set is empty", () => {
    const knownIds = new Set<number>();
    const references = [{ recordId: "p1", field: "gibbonRoleID", value: 1 }];

    expect(findOrphanReferences(knownIds, references)).toEqual([
      { recordId: "p1", field: "gibbonRoleID", value: 1 },
    ]);
  });

  it("returns an empty array when there are no references to check", () => {
    expect(findOrphanReferences(new Set([1, 2]), [])).toEqual([]);
  });

  it("does not mutate the input references array or the known id set", () => {
    const knownIds = new Set([1, 2]);
    const references = [
      { recordId: "p1", field: "gibbonSchoolYearID", value: 1 },
      { recordId: "p2", field: "gibbonSchoolYearID", value: 99 },
    ];
    const referencesSnapshot = JSON.parse(JSON.stringify(references));

    findOrphanReferences(knownIds, references);

    expect(references).toEqual(referencesSnapshot);
    expect(knownIds).toEqual(new Set([1, 2]));
  });

  it("handles a mix of valid, orphaned, and null references in one pass", () => {
    const knownIds = new Set([1, 2]);
    const references = [
      { recordId: "p1", field: "gibbonSchoolYearID", value: 1 },
      { recordId: "p2", field: "gibbonSchoolYearID", value: 42 },
      { recordId: "p3", field: "gibbonSchoolYearID", value: null },
      { recordId: "p4", field: "gibbonSchoolYearID", value: 2 },
    ];

    expect(findOrphanReferences(knownIds, references)).toEqual([
      { recordId: "p2", field: "gibbonSchoolYearID", value: 42 },
    ]);
  });
});
