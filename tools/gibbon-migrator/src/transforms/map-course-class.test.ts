import { describe, expect, it } from "vitest";
import { mapCourseClass } from "./map-course-class";
import { GibbonCourseClassRow } from "../gibbon-types";

const ROW: GibbonCourseClassRow = {
  gibbonCourseClassID: "00000001",
  gibbonCourseID: "00000001",
  name: "Maths 7A",
  nameShort: "M7A",
  reportable: "Y",
  attendance: "Y",
  enrolmentMin: null,
  enrolmentMax: 30,
};

describe("mapCourseClass", () => {
  it("renames Gibbon's bare `attendance` flag to `takesAttendance`", () => {
    const mapped = mapCourseClass(ROW, "new-uuid");

    expect(mapped).toEqual({
      id: "new-uuid",
      gibbonCourseId: 1,
      name: "Maths 7A",
      shortName: "M7A",
      reportable: true,
      takesAttendance: true,
      enrolmentMin: null,
      enrolmentMax: 30,
    });
  });

  it("throws if gibbonCourseID is missing", () => {
    expect(() => mapCourseClass({ ...ROW, gibbonCourseID: "" }, "new-uuid")).toThrow();
  });
});
