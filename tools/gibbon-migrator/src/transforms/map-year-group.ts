import { stripZerofill } from "./zerofill";
import { GibbonYearGroupRow } from "../gibbon-types";

export interface MappedYearGroup {
  id: string;
  schoolId: string;
  name: string;
  shortName: string;
  sequenceNumber: number;
  /**
   * Left as the raw (zerofill-stripped) Gibbon person id, not yet resolved
   * to a new-schema UUID - cross-entity references are resolved in a
   * separate pass (after every entity has been assigned an id), so the
   * order entities are transformed in doesn't matter and orphan references
   * can be checked in one place.
   */
  headOfYearGibbonPersonId: number | null;
}

export function mapYearGroup(
  row: GibbonYearGroupRow,
  id: string,
  schoolId: string,
): MappedYearGroup {
  return {
    id,
    schoolId,
    name: row.name,
    shortName: row.nameShort,
    sequenceNumber: row.sequenceNumber,
    headOfYearGibbonPersonId: stripZerofill(row.gibbonPersonIDHOY),
  };
}
