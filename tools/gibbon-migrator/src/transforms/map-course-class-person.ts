import { stripZerofill } from "./zerofill";
import { ynToBoolean } from "./yn-boolean";
import { GibbonCourseClassPersonRow } from "../gibbon-types";

export type MappedCourseClassPersonRole =
  | "Student"
  | "Teacher"
  | "Assistant"
  | "Technician"
  | "Parent";

export interface MappedCourseClassPerson {
  id: string;
  gibbonCourseClassId: number;
  gibbonPersonId: number;
  role: MappedCourseClassPersonRole;
  dateEnrolled: string | null;
  dateUnenrolled: string | null;
  reportable: boolean;
}

/**
 * Strips Gibbon's real 'Student - Left'/'Teacher - Left' pseudo-values down
 * to the clean 5-value role union - see CourseClassPerson's doc comment for
 * why "has this person left" is represented purely by `dateUnenrolled`
 * being non-null in the target schema, not a separate role value.
 */
function mapRole(role: GibbonCourseClassPersonRow["role"]): MappedCourseClassPersonRole {
  return role.replace(" - Left", "") as MappedCourseClassPersonRole;
}

export function mapCourseClassPerson(
  row: GibbonCourseClassPersonRow,
  id: string,
): MappedCourseClassPerson {
  const gibbonCourseClassId = stripZerofill(row.gibbonCourseClassID);
  const gibbonPersonId = stripZerofill(row.gibbonPersonID);
  if (gibbonCourseClassId === null || gibbonPersonId === null) {
    throw new Error(
      `gibbonCourseClassPerson ${row.gibbonCourseClassPersonID} is missing gibbonCourseClassID or gibbonPersonID`,
    );
  }

  return {
    id,
    gibbonCourseClassId,
    gibbonPersonId,
    role: mapRole(row.role),
    dateEnrolled: row.dateEnrolled,
    dateUnenrolled: row.dateUnenrolled,
    reportable: ynToBoolean(row.reportable) ?? true,
  };
}
