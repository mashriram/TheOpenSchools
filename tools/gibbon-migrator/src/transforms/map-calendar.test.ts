import { describe, expect, it } from "vitest";
import { mapCalendar } from "./map-calendar";
import { GibbonCalendarRow } from "../gibbon-types";

const ROW: GibbonCalendarRow = {
  gibbonCalendarID: "000001",
  gibbonSchoolYearID: "001",
  name: "Whole School",
  description: null,
  summary: null,
  color: "#ff0000",
  public: "Y",
  viewableStaff: "N",
  viewableStudents: "N",
  viewableParents: "N",
  viewableOther: "N",
  viewableParticipants: null,
  editableStaff: null,
  sequenceNumber: 1,
};

describe("mapCalendar", () => {
  it("maps every viewability flag, defaulting a null viewableParticipants/editableStaff to false", () => {
    const mapped = mapCalendar(ROW, "new-uuid");

    expect(mapped).toEqual({
      id: "new-uuid",
      gibbonSchoolYearId: 1,
      name: "Whole School",
      description: null,
      summary: null,
      color: "#ff0000",
      public: true,
      viewableStaff: false,
      viewableStudents: false,
      viewableParents: false,
      viewableOther: false,
      viewableParticipants: false,
      editableStaff: false,
      sequenceNumber: 1,
    });
  });

  it("throws if gibbonSchoolYearID is missing", () => {
    expect(() => mapCalendar({ ...ROW, gibbonSchoolYearID: "" }, "new-uuid")).toThrow();
  });
});
