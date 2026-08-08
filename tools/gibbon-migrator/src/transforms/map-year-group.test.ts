import { describe, expect, it } from "vitest";
import { mapYearGroup } from "./map-year-group";
import { GibbonYearGroupRow } from "../gibbon-types";

describe("mapYearGroup", () => {
  it("maps name/nameShort and strips zerofill from the head-of-year reference", () => {
    const row: GibbonYearGroupRow = {
      gibbonYearGroupID: "001",
      name: "Year 7",
      nameShort: "Y7",
      sequenceNumber: 7,
      gibbonPersonIDHOY: "0000000119",
    };

    const mapped = mapYearGroup(row, "new-uuid", "school-uuid");

    expect(mapped).toEqual({
      id: "new-uuid",
      schoolId: "school-uuid",
      name: "Year 7",
      shortName: "Y7",
      sequenceNumber: 7,
      headOfYearGibbonPersonId: 119,
    });
  });

  it("leaves headOfYearGibbonPersonId null when Gibbon has no head of year set", () => {
    const row: GibbonYearGroupRow = {
      gibbonYearGroupID: "001",
      name: "Year 7",
      nameShort: "Y7",
      sequenceNumber: 7,
      gibbonPersonIDHOY: null,
    };

    const mapped = mapYearGroup(row, "new-uuid", "school-uuid");

    expect(mapped.headOfYearGibbonPersonId).toBeNull();
  });
});
