import { describe, expect, it } from "vitest";
import { stripZerofill } from "./zerofill";

describe("stripZerofill", () => {
  it("strips leading zeros from a zerofilled numeric string", () => {
    expect(stripZerofill("00000042")).toBe(42);
  });

  it("returns 0 for an all-zero zerofilled value", () => {
    expect(stripZerofill("0000000")).toBe(0);
  });

  it("passes through a plain (non-padded) numeric string", () => {
    expect(stripZerofill("42")).toBe(42);
  });

  it("passes through a plain number unchanged", () => {
    expect(stripZerofill(42)).toBe(42);
  });

  it("passes through zero as a number unchanged", () => {
    expect(stripZerofill(0)).toBe(0);
  });

  it("returns null for null input", () => {
    expect(stripZerofill(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(stripZerofill(undefined)).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(stripZerofill("")).toBeNull();
  });

  it("throws on a non-numeric string", () => {
    expect(() => stripZerofill("not-a-number")).toThrow(
      /not a valid zerofilled integer/,
    );
  });

  it("throws on a negative-looking string, since Gibbon IDs are unsigned", () => {
    expect(() => stripZerofill("-42")).toThrow();
  });

  it("handles the largest realistic Gibbon ID width without overflow", () => {
    expect(stripZerofill("0000123456")).toBe(123456);
  });

  it("trims surrounding whitespace before parsing", () => {
    expect(stripZerofill("  00042  ")).toBe(42);
  });

  it("returns null for a whitespace-only string", () => {
    expect(stripZerofill("   ")).toBeNull();
  });

  it("throws on a '+'-prefixed string, since MySQL never emits one", () => {
    expect(() => stripZerofill("+42")).toThrow(
      /not a valid zerofilled integer/,
    );
  });

  it("throws on a decimal string", () => {
    expect(() => stripZerofill("42.5")).toThrow();
  });
});
