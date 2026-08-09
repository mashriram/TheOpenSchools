import { describe, expect, it } from "vitest";
import { mapFinanceFee } from "./map-finance-fee";
import { GibbonFinanceFeeRow } from "../gibbon-types";

const ROW: GibbonFinanceFeeRow = {
  gibbonFinanceFeeID: "000001",
  gibbonSchoolYearID: "001",
  name: "Term 1 Tuition",
  nameShort: "T1TU",
  description: "",
  active: "Y",
  gibbonFinanceFeeCategoryID: "0001",
  fee: "1500.00",
};

describe("mapFinanceFee", () => {
  it("parses the decimal fee string into a number", () => {
    const mapped = mapFinanceFee(ROW, "new-uuid");

    expect(mapped).toEqual({
      id: "new-uuid",
      gibbonSchoolYearId: 1,
      gibbonFeeCategoryId: 1,
      name: "Term 1 Tuition",
      shortName: "T1TU",
      description: null,
      active: true,
      amount: 1500,
    });
  });

  it("throws if a required reference is missing", () => {
    expect(() =>
      mapFinanceFee({ ...ROW, gibbonFinanceFeeCategoryID: "" }, "new-uuid"),
    ).toThrow();
  });
});
