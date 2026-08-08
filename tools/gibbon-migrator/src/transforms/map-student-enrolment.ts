import { stripZerofill } from "./zerofill";
import { GibbonStudentEnrolmentRow } from "../gibbon-types";

export interface MappedStudentEnrolment {
  id: string;
  gibbonPersonId: number;
  gibbonSchoolYearId: number;
  gibbonYearGroupId: number;
  gibbonFormGroupId: number;
  rollOrder: number | null;
}

function requireGibbonId(value: string, field: string, rowId: string): number {
  const parsed = stripZerofill(value);
  if (parsed === null) {
    throw new Error(`gibbonStudentEnrolment ${rowId} has no ${field}`);
  }
  return parsed;
}

export function mapStudentEnrolment(
  row: GibbonStudentEnrolmentRow,
  id: string,
): MappedStudentEnrolment {
  return {
    id,
    gibbonPersonId: requireGibbonId(
      row.gibbonPersonID,
      "gibbonPersonID",
      row.gibbonStudentEnrolmentID,
    ),
    gibbonSchoolYearId: requireGibbonId(
      row.gibbonSchoolYearID,
      "gibbonSchoolYearID",
      row.gibbonStudentEnrolmentID,
    ),
    gibbonYearGroupId: requireGibbonId(
      row.gibbonYearGroupID,
      "gibbonYearGroupID",
      row.gibbonStudentEnrolmentID,
    ),
    gibbonFormGroupId: requireGibbonId(
      row.gibbonFormGroupID,
      "gibbonFormGroupID",
      row.gibbonStudentEnrolmentID,
    ),
    rollOrder: row.rollOrder,
  };
}
