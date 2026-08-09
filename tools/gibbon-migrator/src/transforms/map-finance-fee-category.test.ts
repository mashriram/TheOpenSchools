import { describe, expect, it } from "vitest";
import { mapFinanceFeeCategory } from "./map-finance-fee-category";
import { GibbonFinanceFeeCategoryRow } from "../gibbon-types";

const ROW: GibbonFinanceFeeCategoryRow = {
  gibbonFinanceFeeCategoryID: "0001",
  name: "Tuition",
  nameShort: "TUIT",
  description: "",
  active: "Y",
};

describe("mapFinanceFeeCategory", () => {
  it("maps name/shortName/active and nulls an empty description", () => {
    const mapped = mapFinanceFeeCategory(ROW, "new-uuid", "school-1");

    expect(mapped).toEqual({
      id: "new-uuid",
      schoolId: "school-1",
      name: "Tuition",
      shortName: "TUIT",
      description: null,
      active: true,
    });
  });
});
