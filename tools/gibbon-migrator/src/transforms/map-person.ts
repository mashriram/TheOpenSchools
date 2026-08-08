import { stripZerofill } from "./zerofill";
import { GibbonPersonRow } from "../gibbon-types";

export interface MappedPerson {
  id: string;
  schoolId: string;
  title: string | null;
  surname: string;
  firstName: string;
  preferredName: string | null;
  gender: "M" | "F" | "Other" | "Unspecified";
  status: "Full" | "Expected" | "Left" | "PendingApproval";
  dateOfBirth: string | null;
  email: string | null;
  emailAlternate: string | null;
  studentIdNumber: string | null;
  dateStart: string | null;
  dateEnd: string | null;
  gibbonHouseId: number | null;
  gibbonClassOfSchoolYearId: number | null;
}

const STATUS_MAP: Record<GibbonPersonRow["status"], MappedPerson["status"]> = {
  Full: "Full",
  Expected: "Expected",
  Left: "Left",
  "Pending Approval": "PendingApproval",
};

function nullIfEmpty(value: string): string | null {
  return value.trim() === "" ? null : value;
}

export function mapPerson(
  row: GibbonPersonRow,
  id: string,
  schoolId: string,
): MappedPerson {
  return {
    id,
    schoolId,
    title: nullIfEmpty(row.title),
    surname: row.surname,
    firstName: row.firstName,
    preferredName: nullIfEmpty(row.preferredName),
    gender: row.gender,
    status: STATUS_MAP[row.status],
    dateOfBirth: row.dob,
    email: row.email,
    emailAlternate: row.emailAlternate,
    studentIdNumber: nullIfEmpty(row.studentID),
    dateStart: row.dateStart,
    dateEnd: row.dateEnd,
    gibbonHouseId: stripZerofill(row.gibbonHouseID),
    gibbonClassOfSchoolYearId: stripZerofill(row.gibbonSchoolYearIDClassOf),
  };
}
