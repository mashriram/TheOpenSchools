import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchApiForCurrentUser } from "./authenticated-fetch";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("fetchApiForCurrentUser", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetAllMocks();
  });

  async function mockCookieStore(refreshToken: string | undefined) {
    const { cookies } = await import("next/headers");
    vi.mocked(cookies).mockResolvedValue({
      get: (name: string) =>
        name === "refreshToken" && refreshToken ? { value: refreshToken } : undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  }

  it("returns null when there is no refreshToken cookie at all", async () => {
    await mockCookieStore(undefined);

    const result = await fetchApiForCurrentUser("/student-alerts");

    expect(result).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns null when the refresh call itself fails", async () => {
    await mockCookieStore("stale-token");
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 401 }));

    const result = await fetchApiForCurrentUser("/student-alerts");

    expect(result).toBeNull();
  });

  // Regression test: a real bug found via manual dev-server testing - the
  // rotated refresh token this call consumes from /auth/refresh must be
  // forwarded to the caller so it can, in turn, forward it to the browser.
  // Without this, every write action through a Route Handler silently
  // breaks the user's session on its very next request.
  it("forwards the refresh call's Set-Cookie header(s) to the caller", async () => {
    await mockCookieStore("valid-token");
    const refreshResponse = new Response(JSON.stringify({ accessToken: "fresh-token" }), {
      status: 200,
      headers: { "set-cookie": "refreshToken=rotated-token; HttpOnly; Path=/" },
    });
    const apiResponse = new Response(JSON.stringify({ id: "alert-1" }), { status: 201 });
    vi.mocked(fetch).mockResolvedValueOnce(refreshResponse).mockResolvedValueOnce(apiResponse);

    const result = await fetchApiForCurrentUser("/student-alerts", { method: "POST" });

    expect(result).not.toBeNull();
    expect(result!.refreshSetCookies).toEqual([
      "refreshToken=rotated-token; HttpOnly; Path=/",
    ]);
    expect(await result!.response.json()).toEqual({ id: "alert-1" });
  });

  it("sends the fresh access token as a Bearer header on the forwarded call", async () => {
    await mockCookieStore("valid-token");
    const refreshResponse = new Response(JSON.stringify({ accessToken: "fresh-token" }), {
      status: 200,
    });
    vi.mocked(fetch)
      .mockResolvedValueOnce(refreshResponse)
      .mockResolvedValueOnce(new Response(null, { status: 200 }));

    await fetchApiForCurrentUser("/student-alerts", { method: "POST" });

    const [, secondCallInit] = vi.mocked(fetch).mock.calls[1];
    const headers = new Headers(secondCallInit!.headers);
    expect(headers.get("Authorization")).toBe("Bearer fresh-token");
  });
});
