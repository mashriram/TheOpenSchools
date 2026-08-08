import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "./page";

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("School"), "greenwood-high");
  await user.type(screen.getByLabelText("Email"), "admin@example.com");
  await user.type(screen.getByLabelText("Password"), "correct-horse-battery-staple");
  await user.click(screen.getByRole("button", { name: /log in/i }));
}

describe("LoginPage", () => {
  beforeEach(() => {
    pushMock.mockClear();
    refreshMock.mockClear();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the school, email, and password fields plus a submit button", () => {
    render(<LoginPage />);

    expect(screen.getByLabelText("School")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
  });

  it("marks all three fields as required", () => {
    render(<LoginPage />);

    expect(screen.getByLabelText("School")).toBeRequired();
    expect(screen.getByLabelText("Email")).toBeRequired();
    expect(screen.getByLabelText("Password")).toBeRequired();
  });

  it("posts to the BFF route and redirects to /people on success", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ accessToken: "token" }), { status: 201 }),
    );
    render(<LoginPage />);

    await fillAndSubmit(user);

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/people"));
    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/login",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("shows the server's error message and does not redirect on a failed login", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ message: "Invalid credentials" }), {
        status: 401,
      }),
    );
    render(<LoginPage />);

    await fillAndSubmit(user);

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid credentials");
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("shows a generic error when the server is unreachable", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockRejectedValue(new Error("network down"));
    render(<LoginPage />);

    await fillAndSubmit(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not reach the server",
    );
  });

  it("disables the submit button and shows a loading label while submitting", async () => {
    const user = userEvent.setup();
    let resolveFetch!: (value: Response) => void;
    vi.mocked(fetch).mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      }),
    );
    render(<LoginPage />);

    await user.type(screen.getByLabelText("School"), "greenwood-high");
    await user.type(screen.getByLabelText("Email"), "admin@example.com");
    await user.type(screen.getByLabelText("Password"), "correct-horse-battery-staple");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(screen.getByRole("button", { name: /logging in/i })).toBeDisabled();

    resolveFetch(new Response(JSON.stringify({ accessToken: "token" }), { status: 201 }));
  });
});
