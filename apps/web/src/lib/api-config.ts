/**
 * Server-only: the NestJS API's origin. Never exposed to the browser
 * (no NEXT_PUBLIC_ prefix) - the browser only ever talks to this Next.js
 * app's own /api/* routes, which proxy to the real API server-side. This
 * avoids needing CORS on the NestJS side entirely.
 */
export const API_BASE_URL = process.env.API_URL ?? "http://localhost:3000";
