import { describe, expect, it } from "vitest";
import { mapStudentEnrolment } from "./map-student-enrolment";
import { GibbonStudentEnrolmentRow } from "../gibbon-types";

const ROW: GibbonStudentEnrolmentRow = {
  gibbonStudentEnrolmentID: "00000001",
  gibbonPersonID: "0000000119",
  gibbonSchoolYearID: "025",
  gibbonYearGroupID: "001",
  gibbonFormGroupID: "00001",
  rollOrder: 3,
};

describe("mapStudentEnrolment", () => {
  it("strips zerofill from every reference id", () => {
    const mapped = mapStudentEnrolment(ROW, "new-uuid");

    expect(mapped).toEqual({
      id: "new-uuid",
      gibbonPersonId: 119,
      gibbonSchoolYearId: 25,
      gibbonYearGroupId: 1,
      gibbonFormGroupId: 1,
      rollOrder: 3,
    });
  });

  it("throws if a required reference id is missing (should never happen - all NOT NULL in Gibbon)", () => {
    expect(() =>
      mapStudentEnrolment({ ...ROW, gibbonYearGroupID: "" }, "new-uuid"),
    ).toThrow();
  });

  it("passes through a null rollOrder", () => {
    const mapped = mapStudentEnrolment({ ...ROW, rollOrder: null }, "new-uuid");

    expect(mapped.rollOrder).toBeNull();
  });
});
