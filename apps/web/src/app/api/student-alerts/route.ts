import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fetchApiForCurrentUser } from "@/lib/authenticated-fetch";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await fetchApiForCurrentUser("/student-alerts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!result) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const data = await result.response.json().catch(() => null);
  const nextResponse = NextResponse.json(data, { status: result.response.status });
  for (const cookie of result.refreshSetCookies) {
    nextResponse.headers.append("set-cookie", cookie);
  }
  return nextResponse;
}
