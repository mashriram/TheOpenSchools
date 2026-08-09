import { GibbonDepartmentRow } from "../gibbon-types";

export interface MappedDepartment {
  id: string;
  schoolId: string;
  type: "LearningArea" | "Administration";
  name: string;
  shortName: string;
  subjectListing: string | null;
  blurb: string | null;
  logoUrl: string | null;
}

export function mapDepartment(
  row: GibbonDepartmentRow,
  id: string,
  schoolId: string,
): MappedDepartment {
  return {
    id,
    schoolId,
    type: row.type === "Learning Area" ? "LearningArea" : "Administration",
    name: row.name,
    shortName: row.nameShort,
    subjectListing: row.subjectListing.trim() === "" ? null : row.subjectListing,
    blurb: row.blurb.trim() === "" ? null : row.blurb,
    logoUrl: row.logo.trim() === "" ? null : row.logo,
  };
}
