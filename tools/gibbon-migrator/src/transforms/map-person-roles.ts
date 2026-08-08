import { stripZerofill } from "./zerofill";
import { expandCsvIds } from "./csv-ids";
import { GibbonPersonRow } from "../gibbon-types";

export interface MappedPersonRoleAssignment {
  gibbonPersonId: number;
  gibbonRoleId: number;
  isPrimary: boolean;
}

/**
 * Replaces gibbonPerson.gibbonRoleIDAll (a denormalized CSV string of role
 * ids) with real PersonRole join rows - gibbonRoleIDPrimary becomes
 * isPrimary, matching the same expansion M4 already did for the live
 * schema (PersonRole replacing gibbonRoleIDAll entirely).
 */
export function expandPersonRoles(row: GibbonPersonRow): MappedPersonRoleAssignment[] {
  const gibbonPersonId = stripZerofill(row.gibbonPersonID);
  if (gibbonPersonId === null) {
    throw new Error("gibbonPerson row has no gibbonPersonID");
  }

  const primaryRoleId = stripZerofill(row.gibbonRoleIDPrimary);
  const allRoleIds = expandCsvIds(row.gibbonRoleIDAll);

  // gibbonRoleIDAll is sometimes left blank even though gibbonRoleIDPrimary
  // is always set - treat the primary role as assigned either way.
  const roleIds = new Set(allRoleIds);
  if (primaryRoleId !== null) {
    roleIds.add(primaryRoleId);
  }

  return [...roleIds].map((gibbonRoleId) => ({
    gibbonPersonId,
    gibbonRoleId,
    isPrimary: gibbonRoleId === primaryRoleId,
  }));
}
