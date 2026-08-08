import { describe, expect, it } from "vitest";
import { IdMap } from "./id-map";

describe("IdMap", () => {
  it("resolves an id previously assigned under the same kind", () => {
    const map = new IdMap();
    map.assign("person", 119, "uuid-119");

    expect(map.resolve("person", 119)).toBe("uuid-119");
  });

  it("returns undefined for an id never assigned", () => {
    const map = new IdMap();

    expect(map.resolve("person", 999)).toBeUndefined();
  });

  it("keeps kinds independent, even with overlapping numeric ids", () => {
    const map = new IdMap();
    map.assign("person", 1, "person-uuid-1");
    map.assign("role", 1, "role-uuid-1");

    expect(map.resolve("person", 1)).toBe("person-uuid-1");
    expect(map.resolve("role", 1)).toBe("role-uuid-1");
  });

  it("overwrites a previous assignment for the same kind and id", () => {
    const map = new IdMap();
    map.assign("person", 1, "first-uuid");
    map.assign("person", 1, "second-uuid");

    expect(map.resolve("person", 1)).toBe("second-uuid");
  });

  it("reports the known Gibbon ids for a kind", () => {
    const map = new IdMap();
    map.assign("person", 1, "uuid-1");
    map.assign("person", 2, "uuid-2");

    expect(map.knownGibbonIds("person")).toEqual(new Set([1, 2]));
  });

  it("returns an empty set of known ids for a kind that was never used", () => {
    const map = new IdMap();

    expect(map.knownGibbonIds("family")).toEqual(new Set());
  });
});
