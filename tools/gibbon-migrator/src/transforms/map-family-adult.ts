import { stripZerofill } from "./zerofill";
import { ynToBoolean } from "./yn-boolean";
import { GibbonFamilyAdultRow } from "../gibbon-types";

export interface MappedFamilyAdult {
  id: string;
  gibbonFamilyId: number;
  gibbonPersonId: number;
  comment: string | null;
  childDataAccess: boolean;
  contactPriority: number;
  contactCall: boolean;
  contactSms: boolean;
  contactEmail: boolean;
  contactMail: boolean;
}

export function mapFamilyAdult(row: GibbonFamilyAdultRow, id: string): MappedFamilyAdult {
  const gibbonFamilyId = stripZerofill(row.gibbonFamilyID);
  const gibbonPersonId = stripZerofill(row.gibbonPersonID);
  if (gibbonFamilyId === null || gibbonPersonId === null) {
    throw new Error(
      `gibbonFamilyAdult ${row.gibbonFamilyAdultID} is missing gibbonFamilyID or gibbonPersonID`,
    );
  }

  return {
    id,
    gibbonFamilyId,
    gibbonPersonId,
    comment: row.comment.trim() === "" ? null : row.comment,
    childDataAccess: ynToBoolean(row.childDataAccess) ?? true,
    contactPriority: row.contactPriority,
    contactCall: ynToBoolean(row.contactCall) ?? true,
    contactSms: ynToBoolean(row.contactSMS) ?? true,
    contactEmail: ynToBoolean(row.contactEmail) ?? true,
    contactMail: ynToBoolean(row.contactMail) ?? true,
  };
}
