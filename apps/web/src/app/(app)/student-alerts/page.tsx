import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { API_BASE_URL } from "@/lib/api-config";
import { ACCESS_TOKEN_HEADER } from "@/proxy";
import { AlertsList, type AlertRow } from "./alerts-list";
import { CreateAlertForm, type AlertTypeOption } from "./create-alert-form";

async function fetchJson<T>(accessToken: string, path: string): Promise<T | null> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as T;
}

export default async function StudentAlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ personId?: string }>;
}) {
  const headerList = await headers();
  const accessToken = headerList.get(ACCESS_TOKEN_HEADER);
  if (!accessToken) {
    redirect("/login");
  }

  const { personId } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Student Alerts</h1>
      <form method="GET" className="flex gap-2 items-end max-w-md">
        <label className="flex flex-col gap-1 grow">
          <span>Person ID</span>
          <input
            name="personId"
            defaultValue={personId}
            className="rounded border border-default-200 p-2"
          />
        </label>
        <button type="submit" className="rounded border border-default-200 px-4 py-2">
          View
        </button>
      </form>

      {personId ? (
        <StudentAlertsForPerson accessToken={accessToken} personId={personId} />
      ) : (
        <p className="text-default-500">Enter a person ID to view or add alerts.</p>
      )}
    </div>
  );
}

async function StudentAlertsForPerson({
  accessToken,
  personId,
}: {
  accessToken: string;
  personId: string;
}) {
  const [schoolYear, alertTypes, alerts] = await Promise.all([
    fetchJson<{ id: string }>(accessToken, "/me/current-school-year"),
    fetchJson<AlertTypeOption[]>(accessToken, "/student-alerts/types"),
    fetchJson<AlertRow[]>(accessToken, `/student-alerts/people/${personId}`),
  ]);

  if (alerts === null) {
    return (
      <p role="alert" className="text-danger">
        Could not load alerts for this person - they may not exist, or you may
        not have permission to view them.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AlertsList alerts={alerts} />
      {schoolYear && alertTypes ? (
        <CreateAlertForm
          personId={personId}
          schoolYearId={schoolYear.id}
          alertTypes={alertTypes}
        />
      ) : (
        <p className="text-default-500">
          You do not have permission to create alerts.
        </p>
      )}
    </div>
  );
}
