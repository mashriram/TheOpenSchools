import { ynToBoolean } from "./yn-boolean";
import { GibbonScaleRow } from "../gibbon-types";

export interface MappedScale {
  id: string;
  schoolId: string;
  name: string;
  shortName: string;
  active: boolean;
}

export function mapScale(row: GibbonScaleRow, id: string, schoolId: string): MappedScale {
  return {
    id,
    schoolId,
    name: row.name,
    shortName: row.nameShort,
    active: ynToBoolean(row.active) ?? true,
  };
}
