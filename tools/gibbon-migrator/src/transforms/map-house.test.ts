import { describe, expect, it } from "vitest";
import { mapHouse } from "./map-house";
import { GibbonHouseRow } from "../gibbon-types";

describe("mapHouse", () => {
  it("maps name/nameShort/logo to name/shortName/logoUrl", () => {
    const row: GibbonHouseRow = {
      gibbonHouseID: "009",
      name: "Ming",
      nameShort: "M",
      logo: "",
    };

    const mapped = mapHouse(row, "new-uuid", "school-uuid");

    expect(mapped).toEqual({
      id: "new-uuid",
      schoolId: "school-uuid",
      name: "Ming",
      shortName: "M",
      logoUrl: null,
    });
  });

  it("keeps a real logo URL rather than nulling it", () => {
    const row: GibbonHouseRow = {
      gibbonHouseID: "009",
      name: "Ming",
      nameShort: "M",
      logo: "uploads/houses/ming.png",
    };

    const mapped = mapHouse(row, "new-uuid", "school-uuid");

    expect(mapped.logoUrl).toBe("uploads/houses/ming.png");
  });
});
