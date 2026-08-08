import { GibbonFamilyRow } from "../gibbon-types";

export interface MappedFamily {
  id: string;
  schoolId: string;
  name: string;
  nameAddress: string | null;
  homeAddress: string | null;
  homeAddressDistrict: string | null;
  homeAddressCountry: string | null;
  status: "Married" | "Separated" | "Divorced" | "DeFacto" | "Other" | "Single";
  languageHomePrimary: string | null;
  languageHomeSecondary: string | null;
}

const STATUS_MAP: Record<GibbonFamilyRow["status"], MappedFamily["status"]> = {
  Married: "Married",
  Separated: "Separated",
  Divorced: "Divorced",
  "De Facto": "DeFacto",
  Other: "Other",
  Single: "Single",
};

function nullIfEmpty(value: string | null | undefined): string | null {
  return value === null || value === undefined || value.trim() === "" ? null : value;
}

export function mapFamily(row: GibbonFamilyRow, id: string, schoolId: string): MappedFamily {
  return {
    id,
    schoolId,
    name: row.name,
    nameAddress: nullIfEmpty(row.nameAddress),
    homeAddress: nullIfEmpty(row.homeAddress),
    homeAddressDistrict: nullIfEmpty(row.homeAddressDistrict),
    homeAddressCountry: nullIfEmpty(row.homeAddressCountry),
    status: STATUS_MAP[row.status],
    languageHomePrimary: nullIfEmpty(row.languageHomePrimary),
    languageHomeSecondary: nullIfEmpty(row.languageHomeSecondary),
  };
}
