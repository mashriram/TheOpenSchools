import type { NextRequest } from "next/server";
import { proxyAuthRequest } from "@/lib/auth-proxy";

/**
 * NestJS's /auth/logout reads the refresh token from the incoming
 * request's own cookie (via cookie-parser) - there's no request body, so
 * the browser's `cookie` header must be forwarded explicitly since a
 * server-to-server fetch never inherits the original request's cookies.
 */
export async function POST(request: NextRequest) {
  return proxyAuthRequest(
    "/auth/logout",
    undefined,
    request.headers.get("cookie"),
  );
}
