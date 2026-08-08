import { describe, expect, it } from "vitest";
import { mapFamily } from "./map-family";
import { GibbonFamilyRow } from "../gibbon-types";

const ROW: GibbonFamilyRow = {
  gibbonFamilyID: "0000001",
  name: "The Smiths",
  nameAddress: "Mr. & Mrs. Smith",
  homeAddress: "1 Example St",
  homeAddressDistrict: "",
  homeAddressCountry: "UK",
  status: "De Facto",
  languageHomePrimary: "English",
  languageHomeSecondary: null,
};

describe("mapFamily", () => {
  it("maps Gibbon's 'De Facto' status to our 'DeFacto' union value", () => {
    const mapped = mapFamily(ROW, "new-uuid", "school-uuid");

    expect(mapped.status).toBe("DeFacto");
  });

  it("nulls empty-string fields", () => {
    const mapped = mapFamily(ROW, "new-uuid", "school-uuid");

    expect(mapped.homeAddressDistrict).toBeNull();
    expect(mapped.languageHomeSecondary).toBeNull();
  });

  it.each([
    ["Married", "Married"],
    ["Separated", "Separated"],
    ["Divorced", "Divorced"],
    ["Other", "Other"],
    ["Single", "Single"],
  ] as const)("maps status %s to %s", (gibbonValue, expected) => {
    expect(mapFamily({ ...ROW, status: gibbonValue }, "id", "school").status).toBe(expected);
  });
});
