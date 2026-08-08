import { describe, expect, it } from "vitest";
import { mapStaff } from "./map-staff";
import { GibbonStaffRow } from "../gibbon-types";

const BASE_ROW: GibbonStaffRow = {
  gibbonStaffID: "0000000001",
  gibbonPersonID: "0000000119",
  type: "Teaching Staff",
  initials: "NS",
  jobTitle: "Teacher",
  firstAidQualified: "",
  firstAidQualification: null,
  firstAidExpiry: null,
  countryOfOrigin: "",
  qualifications: "",
  biography: "",
  biographicalGrouping: "",
  biographicalGroupingPriority: 0,
  coverageExclude: "N",
  coveragePriority: 0,
};

describe("mapStaff", () => {
  it("maps a fully-populated row", () => {
    const mapped = mapStaff(BASE_ROW, "staff-uuid", "person-uuid");

    expect(mapped.id).toBe("staff-uuid");
    expect(mapped.personId).toBe("person-uuid");
    expect(mapped.type).toBe("Teaching Staff");
    expect(mapped.initials).toBe("NS");
    expect(mapped.jobTitle).toBe("Teacher");
  });

  it("maps the tri-state firstAidQualified enum('','N','Y') correctly", () => {
    expect(mapStaff(BASE_ROW, "id", "person").firstAidQualified).toBeNull();
    expect(
      mapStaff({ ...BASE_ROW, firstAidQualified: "Y" }, "id", "person").firstAidQualified,
    ).toBe(true);
    expect(
      mapStaff({ ...BASE_ROW, firstAidQualified: "N" }, "id", "person").firstAidQualified,
    ).toBe(false);
  });

  it("nulls empty-string free-text fields rather than keeping them as ''", () => {
    const mapped = mapStaff(BASE_ROW, "id", "person");

    expect(mapped.countryOfOrigin).toBeNull();
    expect(mapped.qualifications).toBeNull();
    expect(mapped.biography).toBeNull();
    expect(mapped.biographicalGrouping).toBeNull();
  });

  it("defaults coveragePriority to 0 when null", () => {
    const mapped = mapStaff({ ...BASE_ROW, coveragePriority: null }, "id", "person");

    expect(mapped.coveragePriority).toBe(0);
  });
});
