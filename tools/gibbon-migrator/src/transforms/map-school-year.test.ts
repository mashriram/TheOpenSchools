import { describe, expect, it } from "vitest";
import { mapSchoolYear } from "./map-school-year";
import { GibbonSchoolYearRow } from "../gibbon-types";

const ROW: GibbonSchoolYearRow = {
  gibbonSchoolYearID: "025",
  name: "2023/2024",
  status: "Current",
  sequenceNumber: 5,
  firstDay: "2023-08-01",
  lastDay: "2024-06-30",
};

describe("mapSchoolYear", () => {
  it("maps fields 1:1 and attaches the given id/schoolId", () => {
    const mapped = mapSchoolYear(ROW, "new-uuid", "school-uuid");

    expect(mapped).toEqual({
      id: "new-uuid",
      schoolId: "school-uuid",
      name: "2023/2024",
      status: "Current",
      sequenceNumber: 5,
      firstDay: "2023-08-01",
      lastDay: "2024-06-30",
    });
  });

  it("passes through null firstDay/lastDay", () => {
    const mapped = mapSchoolYear(
      { ...ROW, firstDay: null, lastDay: null },
      "new-uuid",
      "school-uuid",
    );

    expect(mapped.firstDay).toBeNull();
    expect(mapped.lastDay).toBeNull();
  });
});
