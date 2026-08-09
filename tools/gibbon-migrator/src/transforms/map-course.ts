import { stripZerofill } from "./zerofill";
import { ynToBoolean } from "./yn-boolean";
import { GibbonCourseRow } from "../gibbon-types";

export interface MappedCourse {
  id: string;
  gibbonSchoolYearId: number;
  gibbonDepartmentId: number | null;
  name: string;
  shortName: string;
  description: string | null;
  includeInCurriculumMaps: boolean;
  sequenceNumber: number;
}

export function mapCourse(row: GibbonCourseRow, id: string): MappedCourse {
  const gibbonSchoolYearId = stripZerofill(row.gibbonSchoolYearID);
  if (gibbonSchoolYearId === null) {
    throw new Error(`gibbonCourse ${row.gibbonCourseID} has no gibbonSchoolYearID`);
  }

  return {
    id,
    gibbonSchoolYearId,
    gibbonDepartmentId: stripZerofill(row.gibbonDepartmentID),
    name: row.name,
    shortName: row.nameShort,
    description: row.description.trim() === "" ? null : row.description,
    includeInCurriculumMaps: ynToBoolean(row.map) ?? true,
    sequenceNumber: row.orderBy,
  };
}
