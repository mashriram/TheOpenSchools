import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { API_BASE_URL } from "@/lib/api-config";
import { ACCESS_TOKEN_HEADER } from "@/proxy";
import { MarkbookRoster, type MarkbookEntryRow } from "./markbook-roster";

export async function fetchEntries(
  accessToken: string,
  columnId: string,
): Promise<MarkbookEntryRow[] | null> {
  const response = await fetch(`${API_BASE_URL}/markbook/columns/${columnId}/entries`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as MarkbookEntryRow[];
}

export default async function MarkbookColumnPage({
  params,
}: {
  params: Promise<{ columnId: string }>;
}) {
  const headerList = await headers();
  const accessToken = headerList.get(ACCESS_TOKEN_HEADER);
  if (!accessToken) {
    redirect("/login");
  }

  const { columnId } = await params;
  const entries = await fetchEntries(accessToken, columnId);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Markbook</h1>
      {entries === null ? (
        <p role="alert" className="text-danger">
          Could not load this markbook column - it may not exist, or you may
          not have permission to manage it.
        </p>
      ) : entries.length === 0 ? (
        // MarkbookEntriesService.listForColumn() returns existing entry
        // rows only, not a computed class roster - confirmed against a
        // real dev server, where a class with enrolled students but zero
        // recorded grades yet renders exactly this state. An earlier
        // version of this message ("No students are enrolled...") was
        // factually wrong about the cause.
        <p className="text-default-500">
          No grades have been entered for this column yet.
        </p>
      ) : (
        <MarkbookRoster columnId={columnId} entries={entries} />
      )}
    </div>
  );
}
