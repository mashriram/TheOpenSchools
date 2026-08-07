import { describe, expect, it } from "vitest";
import {
  DEFAULT_ROLE_SLOTS,
  MODULE_TYPES,
  ROLE_CATEGORIES,
  ROLE_RESTRICTIONS,
  ROLE_TYPES,
} from "./rbac";

describe("rbac shared constants", () => {
  it("defines exactly the 5 default role slots, in the order the Action default-permission flags are named", () => {
    expect(DEFAULT_ROLE_SLOTS).toEqual([
      "Admin",
      "Teacher",
      "Student",
      "Parent",
      "Support",
    ]);
  });

  it("defines the 4 role categories", () => {
    expect(ROLE_CATEGORIES).toEqual(["Staff", "Student", "Parent", "Other"]);
  });

  it("defines the 3 role restriction levels", () => {
    expect(ROLE_RESTRICTIONS).toEqual(["None", "SameRole", "AdminOnly"]);
  });

  it("module and role types are both Core/Additional", () => {
    expect(MODULE_TYPES).toEqual(["Core", "Additional"]);
    expect(ROLE_TYPES).toEqual(["Core", "Additional"]);
  });
});
