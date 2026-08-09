import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { API_BASE_URL } from "@/lib/api-config";
import { ACCESS_TOKEN_HEADER } from "@/proxy";
import {
  AttendanceRegisterForm,
  type AttendanceCodeOption,
  type RosterPerson,
} from "./attendance-register-form";

interface FormGroupOption {
  id: string;
  name: string;
}

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

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ formGroupId?: string; date?: string }>;
}) {
  const headerList = await headers();
  const accessToken = headerList.get(ACCESS_TOKEN_HEADER);
  if (!accessToken) {
    redirect("/login");
  }

  const { formGroupId, date = today() } = await searchParams;

  const schoolYear = await fetchJson<{ id: string }>(
    accessToken,
    "/me/current-school-year",
  );
  const formGroups = schoolYear
    ? await fetchJson<FormGroupOption[]>(
        accessToken,
        `/school-admin/form-groups?schoolYearId=${schoolYear.id}`,
      )
    : null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Attendance Register</h1>

      {formGroups === null ? (
        <p className="text-default-500">
          You do not have permission to take a register, or no school year is
          set up yet.
        </p>
      ) : (
        <form method="GET" className="flex gap-2 items-end">
          <label className="flex flex-col gap-1">
            <span>Form group</span>
            <select
              name="formGroupId"
              defaultValue={formGroupId}
              className="rounded border border-default-200 p-2"
            >
              <option value="">Select a form group</option>
              {formGroups.map((formGroup) => (
                <option key={formGroup.id} value={formGroup.id}>
                  {formGroup.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span>Date</span>
            <input
              type="date"
              name="date"
              defaultValue={date}
              className="rounded border border-default-200 p-2"
            />
          </label>
          <button type="submit" className="rounded border border-default-200 px-4 py-2">
            Load register
          </button>
        </form>
      )}

      {formGroupId ? (
        <RegisterForFormGroup accessToken={accessToken} formGroupId={formGroupId} date={date} />
      ) : null}
    </div>
  );
}

async function RegisterForFormGroup({
  accessToken,
  formGroupId,
  date,
}: {
  accessToken: string;
  formGroupId: string;
  date: string;
}) {
  const [roster, codes] = await Promise.all([
    fetchJson<RosterPerson[]>(accessToken, `/people?formGroupId=${formGroupId}`),
    fetchJson<AttendanceCodeOption[]>(accessToken, "/attendance/codes"),
  ]);

  if (roster === null || codes === null) {
    return (
      <p role="alert" className="text-danger">
        Could not load the roster or attendance codes for this form group.
      </p>
    );
  }

  return (
    <AttendanceRegisterForm
      formGroupId={formGroupId}
      date={date}
      roster={roster}
      codes={codes}
    />
  );
}
