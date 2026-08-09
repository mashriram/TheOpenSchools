import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { API_BASE_URL } from "@/lib/api-config";
import { ACCESS_TOKEN_HEADER } from "@/proxy";
import { currentWeekRange } from "@/lib/date-range";
import { TimetableGrid, type ScheduledPeriod } from "./timetable-grid";

export async function fetchSchedule(
  accessToken: string,
  dateStart: string,
  dateEnd: string,
): Promise<ScheduledPeriod[] | null> {
  const response = await fetch(
    `${API_BASE_URL}/timetable/schedule?dateStart=${dateStart}&dateEnd=${dateEnd}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as ScheduledPeriod[];
}

export default async function TimetablePage() {
  const headerList = await headers();
  const accessToken = headerList.get(ACCESS_TOKEN_HEADER);
  if (!accessToken) {
    redirect("/login");
  }

  const { dateStart, dateEnd } = currentWeekRange(new Date());
  const periods = await fetchSchedule(accessToken, dateStart, dateEnd);
  if (periods === null) {
    redirect("/login");
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">
        My Timetable ({dateStart} – {dateEnd})
      </h1>
      <TimetableGrid periods={periods} />
    </div>
  );
}
