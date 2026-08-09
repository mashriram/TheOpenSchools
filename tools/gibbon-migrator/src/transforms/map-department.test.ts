import { describe, expect, it } from "vitest";
import { mapDepartment } from "./map-department";
import { GibbonDepartmentRow } from "../gibbon-types";

const ROW: GibbonDepartmentRow = {
  gibbonDepartmentID: "0001",
  type: "Learning Area",
  name: "Mathematics",
  nameShort: "MATH",
  subjectListing: "",
  blurb: "",
  logo: "",
};

describe("mapDepartment", () => {
  it("maps Gibbon's spaced 'Learning Area' to the target's 'LearningArea'", () => {
    const mapped = mapDepartment(ROW, "new-uuid", "school-1");

    expect(mapped).toEqual({
      id: "new-uuid",
      schoolId: "school-1",
      type: "LearningArea",
      name: "Mathematics",
      shortName: "MATH",
      subjectListing: null,
      blurb: null,
      logoUrl: null,
    });
  });

  it("passes 'Administration' through unchanged", () => {
    const mapped = mapDepartment({ ...ROW, type: "Administration" }, "new-uuid", "school-1");

    expect(mapped.type).toBe("Administration");
  });
});
