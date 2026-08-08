import { describe, expect, it } from "vitest";
import { mapFamilyAdult } from "./map-family-adult";
import { GibbonFamilyAdultRow } from "../gibbon-types";

const ROW: GibbonFamilyAdultRow = {
  gibbonFamilyAdultID: "00000001",
  gibbonFamilyID: "0000001",
  gibbonPersonID: "0000000119",
  comment: "",
  childDataAccess: "Y",
  contactPriority: 1,
  contactCall: "Y",
  contactSMS: "N",
  contactEmail: "Y",
  contactMail: "N",
};

describe("mapFamilyAdult", () => {
  it("strips zerofill from family/person references and maps Y/N contact flags", () => {
    const mapped = mapFamilyAdult(ROW, "new-uuid");

    expect(mapped).toEqual({
      id: "new-uuid",
      gibbonFamilyId: 1,
      gibbonPersonId: 119,
      comment: null,
      childDataAccess: true,
      contactPriority: 1,
      contactCall: true,
      contactSms: false,
      contactEmail: true,
      contactMail: false,
    });
  });

  it("keeps a real comment rather than nulling it", () => {
    const mapped = mapFamilyAdult({ ...ROW, comment: "Primary contact" }, "new-uuid");

    expect(mapped.comment).toBe("Primary contact");
  });
});
