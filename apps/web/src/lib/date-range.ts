/**
 * No date library exists in this app yet (see package.json) - kept as
 * plain, dependency-free date-string arithmetic since this is the only
 * place that needs it. Returns Monday..Sunday for the week containing
 * `today`, as `YYYY-MM-DD` strings (the shape every Tier 2 date-range
 * endpoint expects).
 */
export function currentWeekRange(today: Date): { dateStart: string; dateEnd: string } {
  const dayOfWeek = today.getDay(); // 0 (Sun) .. 6 (Sat)
  const daysSinceMonday = (dayOfWeek + 6) % 7;

  const monday = new Date(today);
  monday.setDate(today.getDate() - daysSinceMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return { dateStart: toDateString(monday), dateEnd: toDateString(sunday) };
}

function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
