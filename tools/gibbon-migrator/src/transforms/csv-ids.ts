/**
 * Several Gibbon columns denormalize a list of ids into a single
 * comma-separated varchar/text field instead of a join table
 * (gibbonPerson.gibbonRoleIDAll, gibbonCourse.gibbonYearGroupIDList, ...).
 * These become real join-table rows in the new schema; this parses the
 * source CSV into a de-duplicated array of ids.
 */
export function expandCsvIds(value: string | null | undefined): number[] {
  if (value === null || value === undefined) {
    return [];
  }

  const ids = new Set<number>();

  for (const rawSegment of value.split(",")) {
    const segment = rawSegment.trim();
    if (segment === "") {
      continue;
    }

    if (!/^\d+$/.test(segment)) {
      throw new Error(
        `"${segment}" is not a valid id segment in CSV id list "${value}"`,
      );
    }

    ids.add(Number.parseInt(segment, 10));
  }

  return [...ids];
}
