import type { MarkbookConcernFlag } from './entities/markbook-entry.entity';

interface RankedGrade {
  value: number;
}

/**
 * Reproduces Gibbon's real markbook concern calculation: compare the
 * entered grade against a student's personal target if one is set
 * (MarkbookTarget), otherwise against the scale's `lowestAcceptable`
 * threshold grade. Higher `value` means a better result.
 *
 * - Personal target set: below target -> 'Y', above target -> 'P'
 *   (exceeded), equal -> 'N'.
 * - No personal target, scale has a threshold grade: below it -> 'Y',
 *   otherwise 'N'. No 'P' case here - "exceeded the minimum" isn't a
 *   noteworthy event the way "exceeded your personal target" is.
 * - Neither configured: always 'N' - there's nothing to warn against.
 */
export function computeConcern(
  enteredGrade: RankedGrade,
  targetGrade: RankedGrade | null,
  lowestAcceptableGrade: RankedGrade | null,
): MarkbookConcernFlag {
  if (targetGrade) {
    if (enteredGrade.value > targetGrade.value) {
      return 'P';
    }
    if (enteredGrade.value < targetGrade.value) {
      return 'Y';
    }
    return 'N';
  }

  if (lowestAcceptableGrade) {
    return enteredGrade.value < lowestAcceptableGrade.value ? 'Y' : 'N';
  }

  return 'N';
}
