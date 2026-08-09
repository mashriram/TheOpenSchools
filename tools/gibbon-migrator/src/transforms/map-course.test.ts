import { describe, expect, it } from "vitest";
import { mapCourse } from "./map-course";
import { GibbonCourseRow } from "../gibbon-types";

const ROW: GibbonCourseRow = {
  gibbonCourseID: "00000001",
  gibbonSchoolYearID: "001",
  gibbonDepartmentID: "0002",
  name: "Mathematics 7",
  nameShort: "MATH7",
  description: "",
  map: "Y",
  orderBy: 1,
};

describe("mapCourse", () => {
  it("strips zerofill and maps the includeInCurriculumMaps flag", () => {
    const mapped = mapCourse(ROW, "new-uuid");

    expect(mapped).toEqual({
      id: "new-uuid",
      gibbonSchoolYearId: 1,
      gibbonDepartmentId: 2,
      name: "Mathematics 7",
      shortName: "MATH7",
      description: null,
      includeInCurriculumMaps: true,
      sequenceNumber: 1,
    });
  });

  it("nulls departmentId when absent rather than throwing", () => {
    const mapped = mapCourse({ ...ROW, gibbonDepartmentID: null }, "new-uuid");

    expect(mapped.gibbonDepartmentId).toBeNull();
  });

  it("throws if gibbonSchoolYearID is missing (a required reference)", () => {
    expect(() => mapCourse({ ...ROW, gibbonSchoolYearID: "" }, "new-uuid")).toThrow();
  });
});
