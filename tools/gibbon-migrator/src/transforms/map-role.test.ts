import { describe, expect, it } from "vitest";
import { mapRole } from "./map-role";
import { GibbonRoleRow } from "../gibbon-types";

describe("mapRole", () => {
  it("maps the real Administrator role (gibbonRoleID 001) fields", () => {
    const row: GibbonRoleRow = {
      gibbonRoleID: "001",
      category: "Staff",
      name: "Administrator",
      nameShort: "Admin",
      description: "Controls all aspects of the system",
      type: "Core",
      canLoginRole: "Y",
      futureYearsLogin: "Y",
      pastYearsLogin: "Y",
      restriction: "Admin Only",
    };

    const mapped = mapRole(row, "new-uuid", "school-uuid");

    expect(mapped).toEqual({
      id: "new-uuid",
      schoolId: "school-uuid",
      category: "Staff",
      name: "Administrator",
      shortName: "Admin",
      description: "Controls all aspects of the system",
      type: "Core",
      canLogin: true,
      futureYearsLogin: true,
      pastYearsLogin: true,
      restriction: "AdminOnly",
    });
  });

  it.each([
    ["None", "None"],
    ["Same Role", "SameRole"],
    ["Admin Only", "AdminOnly"],
  ] as const)("maps Gibbon restriction %s to %s", (gibbonValue, expected) => {
    const row: GibbonRoleRow = {
      gibbonRoleID: "002",
      category: "Staff",
      name: "Teacher",
      nameShort: "Tchr",
      description: "Regular, classroom teacher",
      type: "Core",
      canLoginRole: "Y",
      futureYearsLogin: "Y",
      pastYearsLogin: "Y",
      restriction: gibbonValue,
    };

    expect(mapRole(row, "id", "school").restriction).toBe(expected);
  });

  it("maps canLoginRole=N to canLogin: false", () => {
    const row: GibbonRoleRow = {
      gibbonRoleID: "099",
      category: "Other",
      name: "Disabled Role",
      nameShort: "Dis",
      description: "A role that cannot log in",
      type: "Additional",
      canLoginRole: "N",
      futureYearsLogin: "N",
      pastYearsLogin: "N",
      restriction: "None",
    };

    const mapped = mapRole(row, "id", "school");
    expect(mapped.canLogin).toBe(false);
    expect(mapped.futureYearsLogin).toBe(false);
    expect(mapped.pastYearsLogin).toBe(false);
  });
});
