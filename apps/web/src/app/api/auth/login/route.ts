import type { NextRequest } from "next/server";
import { proxyAuthRequest } from "@/lib/auth-proxy";

export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyAuthRequest("/auth/login", body);
}
