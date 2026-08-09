import { stripZerofill } from "./zerofill";
import { ynToBoolean } from "./yn-boolean";
import { GibbonCourseClassRow } from "../gibbon-types";

export interface MappedCourseClass {
  id: string;
  gibbonCourseId: number;
  name: string;
  shortName: string;
  reportable: boolean;
  takesAttendance: boolean;
  enrolmentMin: number | null;
  enrolmentMax: number | null;
}

export function mapCourseClass(row: GibbonCourseClassRow, id: string): MappedCourseClass {
  const gibbonCourseId = stripZerofill(row.gibbonCourseID);
  if (gibbonCourseId === null) {
    throw new Error(`gibbonCourseClass ${row.gibbonCourseClassID} has no gibbonCourseID`);
  }

  return {
    id,
    gibbonCourseId,
    name: row.name,
    shortName: row.nameShort,
    reportable: ynToBoolean(row.reportable) ?? true,
    takesAttendance: ynToBoolean(row.attendance) ?? true,
    enrolmentMin: row.enrolmentMin,
    enrolmentMax: row.enrolmentMax,
  };
}
