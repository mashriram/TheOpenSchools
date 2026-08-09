import { describe, expect, it } from "vitest";
import { mapAttendanceCode } from "./map-attendance-code";
import { GibbonAttendanceCodeRow } from "../gibbon-types";

const ROW: GibbonAttendanceCodeRow = {
  gibbonAttendanceCodeID: "001",
  name: "Present",
  nameShort: "P",
  type: "Core",
  direction: "In",
  scope: "Onsite",
  active: "Y",
  reportable: "Y",
  future: "N",
  prefill: "Y",
  sequenceNumber: 1,
};

describe("mapAttendanceCode", () => {
  it("maps every flag and renames `future` to `allowFutureDate`", () => {
    const mapped = mapAttendanceCode(ROW, "new-uuid", "school-1");

    expect(mapped).toEqual({
      id: "new-uuid",
      schoolId: "school-1",
      name: "Present",
      shortName: "P",
      type: "Core",
      direction: "In",
      scope: "Onsite",
      active: true,
      reportable: true,
      allowFutureDate: false,
      prefill: true,
      sequenceNumber: 1,
    });
  });
});
