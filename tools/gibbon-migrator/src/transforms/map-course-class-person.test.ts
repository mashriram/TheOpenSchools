import { describe, expect, it } from "vitest";
import { mapCourseClassPerson } from "./map-course-class-person";
import { GibbonCourseClassPersonRow } from "../gibbon-types";

const ROW: GibbonCourseClassPersonRow = {
  gibbonCourseClassPersonID: "0000000001",
  gibbonCourseClassID: "00000001",
  gibbonPersonID: "0000000119",
  role: "Student",
  dateEnrolled: "2026-09-01",
  dateUnenrolled: null,
  reportable: "Y",
};

describe("mapCourseClassPerson", () => {
  it("strips zerofill and maps a normal role unchanged", () => {
    const mapped = mapCourseClassPerson(ROW, "new-uuid");

    expect(mapped).toEqual({
      id: "new-uuid",
      gibbonCourseClassId: 1,
      gibbonPersonId: 119,
      role: "Student",
      dateEnrolled: "2026-09-01",
      dateUnenrolled: null,
      reportable: true,
    });
  });

  it("strips the ' - Left' suffix from role, per CourseClassPerson's clean role union", () => {
    const mapped = mapCourseClassPerson(
      { ...ROW, role: "Student - Left", dateUnenrolled: "2026-12-01" },
      "new-uuid",
    );

    expect(mapped.role).toBe("Student");
    expect(mapped.dateUnenrolled).toBe("2026-12-01");
  });

  it("throws if either reference id is missing", () => {
    expect(() =>
      mapCourseClassPerson({ ...ROW, gibbonPersonID: "" }, "new-uuid"),
    ).toThrow();
  });
});
