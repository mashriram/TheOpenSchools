import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { proxyAuthRequest } from "./auth-proxy";

describe("proxyAuthRequest", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards the response status and JSON body", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ accessToken: "abc" }), {
        status: 201,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await proxyAuthRequest("/auth/login", { email: "a@b.com" });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ accessToken: "abc" });
  });

  it("sends the request body as JSON with a Content-Type header", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("{}", { status: 201 }));

    await proxyAuthRequest("/auth/login", { email: "a@b.com" });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/auth/login"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "a@b.com" }),
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      }),
    );
  });

  it("forwards an incoming cookie header to the upstream request when given", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }));

    await proxyAuthRequest("/auth/logout", undefined, "refreshToken=xyz");

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ cookie: "refreshToken=xyz" }),
      }),
    );
  });

  it("omits the cookie header entirely when none is given", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("{}", { status: 201 }));

    await proxyAuthRequest("/auth/login", { email: "a@b.com" }, null);

    const [, options] = vi.mocked(fetch).mock.calls[0];
    expect(options).not.toHaveProperty("headers.cookie");
  });

  it("does not attempt to parse a non-JSON response body", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response("", { status: 200, headers: { "content-type": "text/plain" } }),
    );

    const response = await proxyAuthRequest("/auth/logout", undefined, "refreshToken=xyz");

    expect(await response.json()).toBeNull();
  });

  it("returns a bodiless response for a 204 upstream status (e.g. real /auth/logout), rather than throwing", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));

    const response = await proxyAuthRequest("/auth/logout", undefined, "refreshToken=xyz");

    expect(response.status).toBe(204);
  });

  it("forwards every Set-Cookie header from the upstream response", async () => {
    const headers = new Headers();
    headers.append("set-cookie", "refreshToken=new; HttpOnly");
    headers.set("content-type", "application/json");
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ accessToken: "abc" }), { status: 201, headers }),
    );

    const response = await proxyAuthRequest("/auth/login", { email: "a@b.com" });

    expect(response.headers.getSetCookie()).toEqual(["refreshToken=new; HttpOnly"]);
  });
});
