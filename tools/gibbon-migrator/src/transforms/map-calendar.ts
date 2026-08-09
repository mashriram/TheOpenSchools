import { stripZerofill } from "./zerofill";
import { ynToBoolean } from "./yn-boolean";
import { GibbonCalendarRow } from "../gibbon-types";

export interface MappedCalendar {
  id: string;
  gibbonSchoolYearId: number;
  name: string;
  description: string | null;
  summary: string | null;
  color: string | null;
  public: boolean;
  viewableStaff: boolean;
  viewableStudents: boolean;
  viewableParents: boolean;
  viewableOther: boolean;
  viewableParticipants: boolean;
  editableStaff: boolean;
  sequenceNumber: number;
}

export function mapCalendar(row: GibbonCalendarRow, id: string): MappedCalendar {
  const gibbonSchoolYearId = stripZerofill(row.gibbonSchoolYearID);
  if (gibbonSchoolYearId === null) {
    throw new Error(`gibbonCalendar ${row.gibbonCalendarID} has no gibbonSchoolYearID`);
  }

  return {
    id,
    gibbonSchoolYearId,
    name: row.name,
    description: row.description,
    summary: row.summary,
    color: row.color,
    public: ynToBoolean(row.public) ?? false,
    viewableStaff: ynToBoolean(row.viewableStaff) ?? false,
    viewableStudents: ynToBoolean(row.viewableStudents) ?? false,
    viewableParents: ynToBoolean(row.viewableParents) ?? false,
    viewableOther: ynToBoolean(row.viewableOther) ?? false,
    viewableParticipants: ynToBoolean(row.viewableParticipants) ?? false,
    editableStaff: ynToBoolean(row.editableStaff) ?? false,
    sequenceNumber: row.sequenceNumber,
  };
}
