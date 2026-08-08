import { GibbonSchoolYearRow } from "../gibbon-types";

export interface MappedSchoolYear {
  id: string;
  schoolId: string;
  name: string;
  status: "Past" | "Current" | "Upcoming";
  sequenceNumber: number;
  firstDay: string | null;
  lastDay: string | null;
}

export function mapSchoolYear(
  row: GibbonSchoolYearRow,
  id: string,
  schoolId: string,
): MappedSchoolYear {
  return {
    id,
    schoolId,
    name: row.name,
    status: row.status,
    sequenceNumber: row.sequenceNumber,
    firstDay: row.firstDay,
    lastDay: row.lastDay,
  };
}
