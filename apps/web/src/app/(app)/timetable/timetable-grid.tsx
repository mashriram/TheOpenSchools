export interface ScheduledPeriod {
  date: string;
  timeStart: string;
  timeEnd: string;
  courseClassId: string;
  courseClassName: string;
  spaceId: string | null;
  spaceName: string | null;
}

/**
 * Split out from page.tsx as a plain presentational component, same
 * rationale as PeopleList - directly RTL-testable without mocking
 * next/headers. Grouped by date since the API returns a flat, already
 * date-ordered list (see TimetableReadModelService.getScheduleForPerson).
 */
export function TimetableGrid({ periods }: { periods: ScheduledPeriod[] }) {
  if (periods.length === 0) {
    return <p className="text-default-500">No lessons scheduled this week.</p>;
  }

  const byDate = new Map<string, ScheduledPeriod[]>();
  for (const period of periods) {
    const existing = byDate.get(period.date);
    if (existing) {
      existing.push(period);
    } else {
      byDate.set(period.date, [period]);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {[...byDate.entries()].map(([date, dayPeriods]) => (
        <section key={date}>
          <h2 className="font-medium mb-2">{date}</h2>
          <ul className="flex flex-col gap-2">
            {dayPeriods.map((period) => (
              <li
                key={`${period.courseClassId}-${period.timeStart}`}
                className="rounded border border-default-200 p-3"
              >
                {period.timeStart}–{period.timeEnd}: {period.courseClassName}
                {period.spaceName ? ` (${period.spaceName})` : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
