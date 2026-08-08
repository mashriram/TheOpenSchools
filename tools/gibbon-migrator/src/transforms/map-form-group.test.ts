import { describe, expect, it } from "vitest";
import { expandFormGroupStaff, mapFormGroup } from "./map-form-group";
import { GibbonFormGroupRow } from "../gibbon-types";

const ROW: GibbonFormGroupRow = {
  gibbonFormGroupID: "00001",
  gibbonSchoolYearID: "025",
  name: "Year 7 Blue",
  nameShort: "7B",
  gibbonPersonIDTutor: "0000000119",
  gibbonPersonIDTutor2: null,
  gibbonPersonIDTutor3: null,
  gibbonPersonIDEA: "0000000120",
  gibbonPersonIDEA2: null,
  gibbonPersonIDEA3: null,
  attendance: "Y",
  website: "",
};

describe("mapFormGroup", () => {
  it("maps name/nameShort/attendance/website and strips zerofill from the school year reference", () => {
    const mapped = mapFormGroup(ROW, "new-uuid");

    expect(mapped).toEqual({
      id: "new-uuid",
      gibbonSchoolYearId: 25,
      name: "Year 7 Blue",
      shortName: "7B",
      attendance: true,
      website: null,
    });
  });

  it("throws for a row with no gibbonSchoolYearID (should never happen - NOT NULL in Gibbon)", () => {
    expect(() =>
      mapFormGroup({ ...ROW, gibbonSchoolYearID: "" }, "new-uuid"),
    ).toThrow();
  });
});

describe("expandFormGroupStaff", () => {
  it("expands the 6 numbered tutor/EA columns into staff assignments, skipping unset ones", () => {
    const assignments = expandFormGroupStaff(ROW, 1);

    expect(assignments).toEqual([
      { gibbonFormGroupId: 1, gibbonPersonId: 119, role: "Tutor", priority: 0 },
      {
        gibbonFormGroupId: 1,
        gibbonPersonId: 120,
        role: "LearningAssistant",
        priority: 0,
      },
    ]);
  });

  it("returns an empty array when no tutor/EA is set", () => {
    const assignments = expandFormGroupStaff(
      {
        ...ROW,
        gibbonPersonIDTutor: null,
        gibbonPersonIDEA: null,
      },
      1,
    );

    expect(assignments).toEqual([]);
  });

  it("includes all three tutor slots and all three EA slots when set", () => {
    const assignments = expandFormGroupStaff(
      {
        ...ROW,
        gibbonPersonIDTutor2: "0000000121",
        gibbonPersonIDTutor3: "0000000122",
        gibbonPersonIDEA2: "0000000123",
        gibbonPersonIDEA3: "0000000124",
      },
      1,
    );

    expect(assignments).toHaveLength(6);
    expect(assignments.filter((a) => a.role === "Tutor")).toHaveLength(3);
    expect(assignments.filter((a) => a.role === "LearningAssistant")).toHaveLength(3);
  });
});
