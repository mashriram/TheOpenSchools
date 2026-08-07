import { describe, expect, it } from "vitest";
import { ynToBoolean } from "./yn-boolean";

describe("ynToBoolean", () => {
  it("converts 'Y' to true", () => {
    expect(ynToBoolean("Y")).toBe(true);
  });

  it("converts 'N' to false", () => {
    expect(ynToBoolean("N")).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(ynToBoolean("y")).toBe(true);
    expect(ynToBoolean("n")).toBe(false);
  });

  it("returns null for null input", () => {
    expect(ynToBoolean(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(ynToBoolean(undefined)).toBeNull();
  });

  it("returns null for an empty string (Gibbon sometimes leaves enum('Y','N') columns blank)", () => {
    expect(ynToBoolean("")).toBeNull();
  });

  it("throws on a value that is neither Y nor N", () => {
    expect(() => ynToBoolean("Maybe")).toThrow(/expected 'Y' or 'N'/);
  });
});
