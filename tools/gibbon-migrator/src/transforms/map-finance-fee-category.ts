import { ynToBoolean } from "./yn-boolean";
import { GibbonFinanceFeeCategoryRow } from "../gibbon-types";

export interface MappedFinanceFeeCategory {
  id: string;
  schoolId: string;
  name: string;
  shortName: string;
  description: string | null;
  active: boolean;
}

export function mapFinanceFeeCategory(
  row: GibbonFinanceFeeCategoryRow,
  id: string,
  schoolId: string,
): MappedFinanceFeeCategory {
  return {
    id,
    schoolId,
    name: row.name,
    shortName: row.nameShort,
    description: row.description.trim() === "" ? null : row.description,
    active: ynToBoolean(row.active) ?? true,
  };
}
