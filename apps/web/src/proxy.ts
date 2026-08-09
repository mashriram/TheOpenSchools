import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { API_BASE_URL } from "@/lib/api-config";

/**
 * The request header the protected page reads the freshly-minted access
 * token from (see (app)/people/page.tsx). Set here, never by the browser -
 * Next.js strips/overwrites any client-supplied value with the same name
 * when using `NextResponse.next({ request: { headers } })`.
 */
export const ACCESS_TOKEN_HEADER = "x-purpleschools-access-token";

/**
 * Coarse route protection + the "server-side re-verification" the plan
 * calls for: this refreshes (and rotates) the access token on every
 * request to a protected route, before the page ever renders.
 *
 * This has to happen here, not in the page itself: refresh tokens are
 * single-use/rotating (M5), and Next.js Server Components cannot set
 * response cookies - only a Route Handler or Proxy/Middleware can. Doing
 * the refresh in the page would rotate the token server-side but have
 * nowhere to deliver the new one to the browser, breaking the session on
 * the very next request. Proxy can set cookies, so it does the refresh
 * and passes the resulting access token forward via a request header for
 * the page to read.
 *
 * Deliberately NOT a substitute for the API's own CASL guards - this is
 * the "optimistic check" Next's own docs describe Proxy for, not the full
 * authorization solution.
 */
export async function proxy(request: NextRequest) {
  const refreshToken = request.cookies.get("refreshToken")?.value;
  if (!refreshToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { cookie: `refreshToken=${refreshToken}` },
  });

  if (!refreshResponse.ok) {
    const redirectResponse = NextResponse.redirect(new URL("/login", request.url));
    redirectResponse.cookies.delete("refreshToken");
    return redirectResponse;
  }

  const { accessToken } = (await refreshResponse.json()) as { accessToken: string };

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(ACCESS_TOKEN_HEADER, accessToken);
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  for (const cookie of refreshResponse.headers.getSetCookie()) {
    response.headers.append("set-cookie", cookie);
  }

  return response;
}

export const config = {
  matcher: [
    "/people/:path*",
    "/timetable/:path*",
    "/attendance/:path*",
    "/markbook/:path*",
    "/student-alerts/:path*",
  ],
};
