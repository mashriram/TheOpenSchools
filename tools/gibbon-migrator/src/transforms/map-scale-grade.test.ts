import { describe, expect, it } from "vitest";
import { mapScaleGrade } from "./map-scale-grade";
import { GibbonScaleGradeRow } from "../gibbon-types";

const ROW: GibbonScaleGradeRow = {
  gibbonScaleGradeID: "0000013",
  gibbonScaleID: "00003",
  value: "A*",
  descriptor: "A*",
  sequenceNumber: 1,
};

describe("mapScaleGrade", () => {
  it("negates sequenceNumber into a higher-is-better numeric value", () => {
    const mapped = mapScaleGrade(ROW, "new-uuid");

    expect(mapped).toEqual({
      id: "new-uuid",
      gibbonScaleId: 3,
      name: "A*",
      shortName: "A*",
      value: -1,
      sequenceNumber: 1,
    });
  });

  it("ranks a worse (higher sequenceNumber) grade with a lower value", () => {
    const best = mapScaleGrade({ ...ROW, sequenceNumber: 1 }, "id-1");
    const worst = mapScaleGrade({ ...ROW, sequenceNumber: 8 }, "id-2");

    expect(best.value).toBeGreaterThan(worst.value);
  });

  it("throws if gibbonScaleID is missing", () => {
    expect(() => mapScaleGrade({ ...ROW, gibbonScaleID: "" }, "new-uuid")).toThrow();
  });
});
