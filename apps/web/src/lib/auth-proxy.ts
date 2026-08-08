import { NextResponse } from "next/server";
import { API_BASE_URL } from "./api-config";

/**
 * Proxies a POST to the NestJS auth API and forwards its Set-Cookie
 * header(s) onto the browser-facing response untouched - the refresh
 * token cookie's httpOnly/Secure/SameSite/path attributes are set by
 * AuthController and should reach the browser exactly as issued, not be
 * reconstructed here. Uses `getSetCookie()` (not `.get('set-cookie')`)
 * since a response can carry more than one Set-Cookie header and those
 * can't be safely comma-joined the way other headers can.
 */
export async function proxyAuthRequest(
  path: string,
  body: unknown,
  incomingCookieHeader?: string | null,
): Promise<NextResponse> {
  const apiResponse = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(incomingCookieHeader ? { cookie: incomingCookieHeader } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const contentType = apiResponse.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? await apiResponse.json()
    : null;

  // NestJS's /auth/logout responds 204 (@HttpCode(204)) - a body-forbidden
  // status per the Fetch spec. NextResponse.json() always attaches a body,
  // so calling it with status 204 throws at runtime; this must stay
  // bodiless for any status in that class.
  const response = isBodyForbiddenStatus(apiResponse.status)
    ? new NextResponse(null, { status: apiResponse.status })
    : NextResponse.json(data, { status: apiResponse.status });

  for (const cookie of apiResponse.headers.getSetCookie()) {
    response.headers.append("set-cookie", cookie);
  }
  return response;
}

function isBodyForbiddenStatus(status: number): boolean {
  return status === 204 || status === 205 || status === 304;
}
