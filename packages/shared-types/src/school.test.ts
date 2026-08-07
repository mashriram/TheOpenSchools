import { describe, expect, it } from "vitest";
import { SUBDOMAIN_SLUG_PATTERN } from "./school";

describe("SUBDOMAIN_SLUG_PATTERN", () => {
  it.each(["greenwood", "greenwood-high", "school2", "a1", "ab"])(
    "accepts valid slug %s",
    (slug) => {
      expect(SUBDOMAIN_SLUG_PATTERN.test(slug)).toBe(true);
    },
  );

  it("accepts a single-character slug", () => {
    expect(SUBDOMAIN_SLUG_PATTERN.test("a")).toBe(true);
  });

  it("accepts the maximum-length 63 character slug", () => {
    const slug = "a" + "b".repeat(61) + "c";
    expect(slug).toHaveLength(63);
    expect(SUBDOMAIN_SLUG_PATTERN.test(slug)).toBe(true);
  });

  it("rejects a 64 character slug (exceeds DNS label length)", () => {
    const slug = "a" + "b".repeat(62) + "c";
    expect(slug).toHaveLength(64);
    expect(SUBDOMAIN_SLUG_PATTERN.test(slug)).toBe(false);
  });

  it.each([
    ["Uppercase", "Greenwood"],
    ["leading hyphen", "-greenwood"],
    ["trailing hyphen", "greenwood-"],
    ["underscore", "green_wood"],
    ["space", "green wood"],
    ["empty string", ""],
    ["dot (no subdomains-within-subdomains)", "green.wood"],
  ])("rejects %s: %s", (_label, slug) => {
    expect(SUBDOMAIN_SLUG_PATTERN.test(slug)).toBe(false);
  });
});
