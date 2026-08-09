import { cookies } from "next/headers";
import { API_BASE_URL } from "./api-config";

export interface AuthenticatedFetchResult {
  response: Response;
  /**
   * Set-Cookie header(s) from the internal /auth/refresh call. Refresh
   * tokens are single-use/rotating (see proxy.ts) - the caller MUST forward
   * these onto its own NextResponse, or the rotated token this call just
   * consumed is never delivered to the browser, silently breaking the
   * user's session on the very next request. Confirmed as a real bug
   * (not hypothetical) via manual testing against a real dev server before
   * this field existed.
   */
  refreshSetCookies: string[];
}

/**
 * For Route Handlers that need to call the NestJS API on behalf of the
 * current user for a WRITE action (a Server Component can read the access
 * token proxy.ts already minted via the request header - see
 * `(app)/people/page.tsx` - but a client component's own fetch has no such
 * header available, only the httpOnly `refreshToken` cookie). Re-derives a
 * fresh access token the same way proxy.ts does, then forwards the
 * request. Returns null if there's no session at all (no refreshToken) or
 * the refresh itself fails - the caller should treat both as "not
 * authenticated".
 */
export async function fetchApiForCurrentUser(
  path: string,
  init?: RequestInit,
): Promise<AuthenticatedFetchResult | null> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;
  if (!refreshToken) {
    return null;
  }

  const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { cookie: `refreshToken=${refreshToken}` },
  });
  if (!refreshResponse.ok) {
    return null;
  }
  const { accessToken } = (await refreshResponse.json()) as { accessToken: string };
  const refreshSetCookies = refreshResponse.headers.getSetCookie();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return { response, refreshSetCookies };
}
