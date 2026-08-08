import { ynToBoolean } from "./yn-boolean";
import { GibbonRoleRow } from "../gibbon-types";

export interface MappedRole {
  id: string;
  schoolId: string;
  category: "Staff" | "Student" | "Parent" | "Other";
  name: string;
  shortName: string;
  description: string;
  type: "Core" | "Additional";
  canLogin: boolean;
  futureYearsLogin: boolean;
  pastYearsLogin: boolean;
  restriction: "None" | "SameRole" | "AdminOnly";
}

const RESTRICTION_MAP: Record<GibbonRoleRow["restriction"], MappedRole["restriction"]> = {
  None: "None",
  "Same Role": "SameRole",
  "Admin Only": "AdminOnly",
};

export function mapRole(row: GibbonRoleRow, id: string, schoolId: string): MappedRole {
  return {
    id,
    schoolId,
    category: row.category,
    name: row.name,
    shortName: row.nameShort,
    description: row.description,
    type: row.type,
    canLogin: ynToBoolean(row.canLoginRole) ?? true,
    futureYearsLogin: ynToBoolean(row.futureYearsLogin) ?? true,
    pastYearsLogin: ynToBoolean(row.pastYearsLogin) ?? true,
    restriction: RESTRICTION_MAP[row.restriction],
  };
}
