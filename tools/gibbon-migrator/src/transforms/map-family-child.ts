import { stripZerofill } from "./zerofill";
import { GibbonFamilyChildRow } from "../gibbon-types";

export interface MappedFamilyChild {
  id: string;
  gibbonFamilyId: number;
  gibbonPersonId: number;
  comment: string | null;
}

export function mapFamilyChild(row: GibbonFamilyChildRow, id: string): MappedFamilyChild {
  const gibbonFamilyId = stripZerofill(row.gibbonFamilyID);
  const gibbonPersonId = stripZerofill(row.gibbonPersonID);
  if (gibbonFamilyId === null || gibbonPersonId === null) {
    throw new Error(
      `gibbonFamilyChild ${row.gibbonFamilyChildID} is missing gibbonFamilyID or gibbonPersonID`,
    );
  }

  return {
    id,
    gibbonFamilyId,
    gibbonPersonId,
    comment: row.comment.trim() === "" ? null : row.comment,
  };
}
