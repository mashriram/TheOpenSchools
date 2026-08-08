import { GibbonHouseRow } from "../gibbon-types";

export interface MappedHouse {
  id: string;
  schoolId: string;
  name: string;
  shortName: string;
  logoUrl: string | null;
}

export function mapHouse(
  row: GibbonHouseRow,
  id: string,
  schoolId: string,
): MappedHouse {
  return {
    id,
    schoolId,
    name: row.name,
    shortName: row.nameShort,
    logoUrl: row.logo.trim() === "" ? null : row.logo,
  };
}
