import { describe, expect, it } from "vitest";
import { expandCsvIds } from "./csv-ids";

describe("expandCsvIds", () => {
  it("parses a comma-separated list of ids into numbers", () => {
    expect(expandCsvIds("001,003,006")).toEqual([1, 3, 6]);
  });

  it("parses a single id with no commas", () => {
    expect(expandCsvIds("002")).toEqual([2]);
  });

  it("de-duplicates repeated ids", () => {
    expect(expandCsvIds("001,001,003")).toEqual([1, 3]);
  });

  it("ignores stray whitespace around ids", () => {
    expect(expandCsvIds(" 001 , 003 ,006 ")).toEqual([1, 3, 6]);
  });

  it("ignores empty segments from trailing/double commas", () => {
    expect(expandCsvIds("001,,003,")).toEqual([1, 3]);
  });

  it("returns an empty array for null (gibbonRoleIDAll can be unset)", () => {
    expect(expandCsvIds(null)).toEqual([]);
  });

  it("returns an empty array for undefined", () => {
    expect(expandCsvIds(undefined)).toEqual([]);
  });

  it("returns an empty array for an empty string", () => {
    expect(expandCsvIds("")).toEqual([]);
  });

  it("returns an empty array for a whitespace-only string", () => {
    expect(expandCsvIds("   ")).toEqual([]);
  });

  it("throws when a segment is not a valid integer, to surface bad source data instead of silently dropping it", () => {
    expect(() => expandCsvIds("001,abc,003")).toThrow(
      /not a valid id segment/,
    );
  });

  it("returns an empty array for a string that is only commas", () => {
    expect(expandCsvIds(",,,")).toEqual([]);
  });

  it("preserves first-seen order while de-duplicating", () => {
    expect(expandCsvIds("003,001,003,002,001")).toEqual([3, 1, 2]);
  });
});
