import { stripZerofill } from "./zerofill";
import { ynToBoolean } from "./yn-boolean";
import { GibbonFormGroupRow } from "../gibbon-types";

export interface MappedFormGroup {
  id: string;
  gibbonSchoolYearId: number;
  name: string;
  shortName: string;
  attendance: boolean;
  website: string | null;
}

export function mapFormGroup(row: GibbonFormGroupRow, id: string): MappedFormGroup {
  const gibbonSchoolYearId = stripZerofill(row.gibbonSchoolYearID);
  if (gibbonSchoolYearId === null) {
    throw new Error(
      `gibbonFormGroup ${row.gibbonFormGroupID} has no gibbonSchoolYearID`,
    );
  }

  return {
    id,
    gibbonSchoolYearId,
    name: row.name,
    shortName: row.nameShort,
    attendance: ynToBoolean(row.attendance) ?? true,
    website: row.website.trim() === "" ? null : row.website,
  };
}

export interface MappedFormGroupStaffAssignment {
  gibbonFormGroupId: number;
  gibbonPersonId: number;
  role: "Tutor" | "LearningAssistant";
  priority: number;
}

/**
 * Replaces gibbonFormGroup's 6 numbered tutor/EA columns
 * (gibbonPersonIDTutor/Tutor2/Tutor3/EA/EA2/EA3) with real FormGroupStaff
 * join rows - the same "numbered columns -> child table" normalization
 * already applied to Person's phone/emergency-contact columns in M4.
 */
export function expandFormGroupStaff(
  row: GibbonFormGroupRow,
  gibbonFormGroupId: number,
): MappedFormGroupStaffAssignment[] {
  const assignments: Array<
    [personId: string | null, role: "Tutor" | "LearningAssistant", priority: number]
  > = [
    [row.gibbonPersonIDTutor, "Tutor", 0],
    [row.gibbonPersonIDTutor2, "Tutor", 1],
    [row.gibbonPersonIDTutor3, "Tutor", 2],
    [row.gibbonPersonIDEA, "LearningAssistant", 0],
    [row.gibbonPersonIDEA2, "LearningAssistant", 1],
    [row.gibbonPersonIDEA3, "LearningAssistant", 2],
  ];

  const result: MappedFormGroupStaffAssignment[] = [];
  for (const [rawPersonId, role, priority] of assignments) {
    const gibbonPersonId = stripZerofill(rawPersonId);
    if (gibbonPersonId === null) {
      continue;
    }
    result.push({ gibbonFormGroupId, gibbonPersonId, role, priority });
  }
  return result;
}
