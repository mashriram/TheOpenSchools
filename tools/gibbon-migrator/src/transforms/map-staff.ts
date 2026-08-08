import { ynToBoolean } from "./yn-boolean";
import { GibbonStaffRow } from "../gibbon-types";

export interface MappedStaff {
  id: string;
  personId: string;
  type: string | null;
  initials: string | null;
  jobTitle: string | null;
  firstAidQualified: boolean | null;
  firstAidQualification: string | null;
  firstAidExpiry: string | null;
  countryOfOrigin: string | null;
  qualifications: string | null;
  biography: string | null;
  biographicalGrouping: string | null;
  biographicalGroupingPriority: number;
  coverageExclude: boolean;
  coveragePriority: number;
}

function nullIfEmpty(value: string | null | undefined): string | null {
  return value === null || value === undefined || value.trim() === "" ? null : value;
}

export function mapStaff(row: GibbonStaffRow, id: string, personId: string): MappedStaff {
  return {
    id,
    personId,
    type: nullIfEmpty(row.type),
    initials: nullIfEmpty(row.initials),
    jobTitle: nullIfEmpty(row.jobTitle),
    // Gibbon's tri-state enum('','N','Y') maps directly: '' -> null (Y/N
    // helper already treats empty string as "unspecified").
    firstAidQualified: ynToBoolean(row.firstAidQualified),
    firstAidQualification: nullIfEmpty(row.firstAidQualification),
    firstAidExpiry: row.firstAidExpiry,
    countryOfOrigin: nullIfEmpty(row.countryOfOrigin),
    qualifications: nullIfEmpty(row.qualifications),
    biography: nullIfEmpty(row.biography),
    biographicalGrouping: nullIfEmpty(row.biographicalGrouping),
    biographicalGroupingPriority: row.biographicalGroupingPriority,
    coverageExclude: ynToBoolean(row.coverageExclude) ?? false,
    coveragePriority: row.coveragePriority ?? 0,
  };
}
