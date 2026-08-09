import { ynToBoolean } from "./yn-boolean";
import { GibbonAttendanceCodeRow } from "../gibbon-types";

export interface MappedAttendanceCode {
  id: string;
  schoolId: string;
  name: string;
  shortName: string;
  type: "Core" | "Additional";
  direction: "In" | "Out";
  scope: GibbonAttendanceCodeRow["scope"];
  active: boolean;
  reportable: boolean;
  allowFutureDate: boolean;
  prefill: boolean;
  sequenceNumber: number;
}

/**
 * Deliberately does NOT migrate `gibbonRoleIDAll` (the CSV of roles allowed
 * to set this code, normalized into the target's AttendanceCodeRole join
 * table) - a documented fast-follow alongside AttendanceLogPerson, since
 * both belong to the same "who can take/set attendance" workflow this
 * first Tier 2 migrator pass doesn't cover yet (see transform.ts's Tier 2
 * doc comment).
 */
export function mapAttendanceCode(
  row: GibbonAttendanceCodeRow,
  id: string,
  schoolId: string,
): MappedAttendanceCode {
  return {
    id,
    schoolId,
    name: row.name,
    shortName: row.nameShort,
    type: row.type,
    direction: row.direction,
    scope: row.scope,
    active: ynToBoolean(row.active) ?? true,
    reportable: ynToBoolean(row.reportable) ?? true,
    allowFutureDate: ynToBoolean(row.future) ?? false,
    prefill: ynToBoolean(row.prefill) ?? true,
    sequenceNumber: row.sequenceNumber,
  };
}
