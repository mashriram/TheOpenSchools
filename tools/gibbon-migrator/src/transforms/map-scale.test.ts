import { describe, expect, it } from "vitest";
import { mapScale } from "./map-scale";
import { GibbonScaleRow } from "../gibbon-types";

const ROW: GibbonScaleRow = {
  gibbonScaleID: "00001",
  name: "IB MYP 1-7",
  nameShort: "MYP",
  lowestAcceptable: "5",
  active: "Y",
};

describe("mapScale", () => {
  it("maps name/shortName/active", () => {
    const mapped = mapScale(ROW, "new-uuid", "school-1");

    expect(mapped).toEqual({
      id: "new-uuid",
      schoolId: "school-1",
      name: "IB MYP 1-7",
      shortName: "MYP",
      active: true,
    });
  });
});
