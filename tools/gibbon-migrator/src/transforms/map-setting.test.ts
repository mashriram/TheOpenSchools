import { describe, expect, it } from "vitest";
import { mapSetting } from "./map-setting";
import { GibbonSettingRow } from "../gibbon-types";

describe("mapSetting", () => {
  it("maps fields 1:1 and nulls an empty description", () => {
    const row: GibbonSettingRow = {
      gibbonSettingID: "00001",
      scope: "System",
      name: "organisationName",
      nameDisplay: "Organisation Name",
      description: "",
      value: "Greenwood High",
    };

    const mapped = mapSetting(row, "new-uuid", "school-uuid");

    expect(mapped).toEqual({
      id: "new-uuid",
      schoolId: "school-uuid",
      scope: "System",
      name: "organisationName",
      nameDisplay: "Organisation Name",
      description: null,
      value: "Greenwood High",
    });
  });

  it("keeps a real description rather than nulling it", () => {
    const row: GibbonSettingRow = {
      gibbonSettingID: "00001",
      scope: "System",
      name: "organisationName",
      nameDisplay: "Organisation Name",
      description: "The name of the school",
      value: "Greenwood High",
    };

    expect(mapSetting(row, "id", "school").description).toBe("The name of the school");
  });
});
