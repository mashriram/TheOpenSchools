import { describe, expect, it } from "vitest";
import { mapFamilyChild } from "./map-family-child";
import { GibbonFamilyChildRow } from "../gibbon-types";

const ROW: GibbonFamilyChildRow = {
  gibbonFamilyChildID: "00000001",
  gibbonFamilyID: "0000001",
  gibbonPersonID: "0000000200",
  comment: "",
};

describe("mapFamilyChild", () => {
  it("strips zerofill from family/person references and nulls an empty comment", () => {
    const mapped = mapFamilyChild(ROW, "new-uuid");

    expect(mapped).toEqual({
      id: "new-uuid",
      gibbonFamilyId: 1,
      gibbonPersonId: 200,
      comment: null,
    });
  });

  it("throws when a required reference is missing", () => {
    expect(() => mapFamilyChild({ ...ROW, gibbonPersonID: "" }, "new-uuid")).toThrow();
  });
});
