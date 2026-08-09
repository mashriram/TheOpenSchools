import { stripZerofill } from "./zerofill";
import { GibbonScaleGradeRow } from "../gibbon-types";

export interface MappedScaleGrade {
  id: string;
  gibbonScaleId: number;
  name: string;
  shortName: string;
  /**
   * Real Gibbon `value` is often a letter grade ("A*", "B", not numeric),
   * while the target schema's `value` column is a numeric rank ("higher
   * means better", see ScaleGrade's doc comment). Rather than trying to
   * parse a letter grade as a number, this uses `-sequenceNumber`: Gibbon's
   * sequenceNumber is always "1 = best" ordering regardless of scale type,
   * so negating it preserves the correct relative rank without needing to
   * know the max sequenceNumber in the scale.
   */
  value: number;
  sequenceNumber: number;
}

export function mapScaleGrade(row: GibbonScaleGradeRow, id: string): MappedScaleGrade {
  const gibbonScaleId = stripZerofill(row.gibbonScaleID);
  if (gibbonScaleId === null) {
    throw new Error(`gibbonScaleGrade ${row.gibbonScaleGradeID} has no gibbonScaleID`);
  }

  return {
    id,
    gibbonScaleId,
    // Gibbon's `value` (varchar(10)) is the short display label; `descriptor`
    // (varchar(50)) is the longer one - truncated defensively since the
    // target columns are narrower (varchar(8)/varchar(40)).
    name: row.descriptor.slice(0, 40),
    shortName: row.value.slice(0, 8),
    value: -row.sequenceNumber,
    sequenceNumber: row.sequenceNumber,
  };
}
