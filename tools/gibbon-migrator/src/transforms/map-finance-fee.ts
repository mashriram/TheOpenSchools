import { stripZerofill } from "./zerofill";
import { ynToBoolean } from "./yn-boolean";
import { GibbonFinanceFeeRow } from "../gibbon-types";

export interface MappedFinanceFee {
  id: string;
  gibbonSchoolYearId: number;
  gibbonFeeCategoryId: number;
  name: string;
  shortName: string;
  description: string | null;
  active: boolean;
  amount: number;
}

export function mapFinanceFee(row: GibbonFinanceFeeRow, id: string): MappedFinanceFee {
  const gibbonSchoolYearId = stripZerofill(row.gibbonSchoolYearID);
  const gibbonFeeCategoryId = stripZerofill(row.gibbonFinanceFeeCategoryID);
  if (gibbonSchoolYearId === null || gibbonFeeCategoryId === null) {
    throw new Error(
      `gibbonFinanceFee ${row.gibbonFinanceFeeID} is missing gibbonSchoolYearID or gibbonFinanceFeeCategoryID`,
    );
  }

  return {
    id,
    gibbonSchoolYearId,
    gibbonFeeCategoryId,
    name: row.name,
    shortName: row.nameShort,
    description: row.description.trim() === "" ? null : row.description,
    active: ynToBoolean(row.active) ?? true,
    // mysql2 returns DECIMAL columns as strings - normalized to a number
    // here since the target column already applies its own decimalTransformer
    // on read (see apps/api's Finance module for the same mysql2 quirk).
    amount: Number.parseFloat(row.fee),
  };
}
