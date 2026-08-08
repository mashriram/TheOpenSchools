import { describe, expect, it } from "vitest";
import { expandPersonRoles } from "./map-person-roles";
import { GibbonPersonRow } from "../gibbon-types";

const BASE_ROW: GibbonPersonRow = {
  gibbonPersonID: "0000000119",
  title: "",
  surname: "Schultz",
  firstName: "Nathan",
  preferredName: "",
  gender: "M",
  username: "119",
  status: "Full",
  canLogin: "Y",
  gibbonRoleIDPrimary: "002",
  gibbonRoleIDAll: "002",
  dob: null,
  email: null,
  emailAlternate: null,
  gibbonHouseID: null,
  studentID: "",
  dateStart: null,
  dateEnd: null,
  gibbonSchoolYearIDClassOf: null,
};

describe("expandPersonRoles", () => {
  it("expands a single-role person with isPrimary true", () => {
    const roles = expandPersonRoles(BASE_ROW);

    expect(roles).toEqual([{ gibbonPersonId: 119, gibbonRoleId: 2, isPrimary: true }]);
  });

  it("marks only the primary role as isPrimary when a person holds multiple roles", () => {
    const roles = expandPersonRoles({
      ...BASE_ROW,
      gibbonRoleIDPrimary: "002",
      gibbonRoleIDAll: "002,004",
    });

    expect(roles.sort((a, b) => a.gibbonRoleId - b.gibbonRoleId)).toEqual([
      { gibbonPersonId: 119, gibbonRoleId: 2, isPrimary: true },
      { gibbonPersonId: 119, gibbonRoleId: 4, isPrimary: false },
    ]);
  });

  it("still includes the primary role even if gibbonRoleIDAll is blank", () => {
    const roles = expandPersonRoles({
      ...BASE_ROW,
      gibbonRoleIDPrimary: "002",
      gibbonRoleIDAll: "",
    });

    expect(roles).toEqual([{ gibbonPersonId: 119, gibbonRoleId: 2, isPrimary: true }]);
  });

  it("does not duplicate the primary role when it also appears in gibbonRoleIDAll", () => {
    const roles = expandPersonRoles({
      ...BASE_ROW,
      gibbonRoleIDPrimary: "002",
      gibbonRoleIDAll: "002",
    });

    expect(roles).toHaveLength(1);
  });
});
