import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { API_BASE_URL } from "@/lib/api-config";
import { ACCESS_TOKEN_HEADER } from "@/proxy";
import { PeopleList, type Person } from "./people-list";

/**
 * The access token here was minted by proxy.ts's refresh-and-rotate step,
 * not read from any client-supplied value - see proxy.ts's docstring for
 * why the refresh has to happen there rather than here.
 */
export async function fetchPeople(accessToken: string): Promise<Person[] | null> {
  const response = await fetch(`${API_BASE_URL}/people`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as Person[];
}

export default async function PeoplePage() {
  const headerList = await headers();
  const accessToken = headerList.get(ACCESS_TOKEN_HEADER);
  if (!accessToken) {
    redirect("/login");
  }

  const people = await fetchPeople(accessToken);
  if (people === null) {
    redirect("/login");
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">People</h1>
      <PeopleList people={people} />
    </div>
  );
}
