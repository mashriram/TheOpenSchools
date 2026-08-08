import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignupPage from "./page";

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("School name"), "Greenwood High");
  await user.type(screen.getByLabelText("Subdomain"), "greenwood-high");
  await user.type(screen.getByLabelText("Your first name"), "Ada");
  await user.type(screen.getByLabelText("Your surname"), "Admin");
  await user.type(screen.getByLabelText("Your email"), "ada@example.com");
  await user.type(
    screen.getByLabelText("Password"),
    "correct-horse-battery-staple",
  );
  await user.click(screen.getByRole("button", { name: /create school/i }));
}

describe("SignupPage", () => {
  beforeEach(() => {
    pushMock.mockClear();
    refreshMock.mockClear();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders every signup field plus a submit button", () => {
    render(<SignupPage />);

    for (const label of [
      "School name",
      "Subdomain",
      "Your first name",
      "Your surname",
      "Your email",
      "Password",
    ]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: /create school/i })).toBeInTheDocument();
  });

  it("marks every field as required", () => {
    render(<SignupPage />);

    for (const label of [
      "School name",
      "Subdomain",
      "Your first name",
      "Your surname",
      "Your email",
      "Password",
    ]) {
      expect(screen.getByLabelText(label)).toBeRequired();
    }
  });

  it("enforces the shared minimum password length on the client", () => {
    render(<SignupPage />);

    expect(screen.getByLabelText("Password")).toHaveAttribute("minlength", "10");
  });

  it("posts to the BFF route and redirects to /people on success", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ accessToken: "token" }), { status: 201 }),
    );
    render(<SignupPage />);

    await fillAndSubmit(user);

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/people"));
    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/signup",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("shows the server's error message and does not redirect on a failed signup (e.g. duplicate subdomain)", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ message: "That subdomain is already taken" }),
        { status: 409 },
      ),
    );
    render(<SignupPage />);

    await fillAndSubmit(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "That subdomain is already taken",
    );
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("disables the submit button and shows a loading label while submitting", async () => {
    const user = userEvent.setup();
    let resolveFetch!: (value: Response) => void;
    vi.mocked(fetch).mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      }),
    );
    render(<SignupPage />);

    await user.type(screen.getByLabelText("School name"), "Greenwood High");
    await user.type(screen.getByLabelText("Subdomain"), "greenwood-high");
    await user.type(screen.getByLabelText("Your first name"), "Ada");
    await user.type(screen.getByLabelText("Your surname"), "Admin");
    await user.type(screen.getByLabelText("Your email"), "ada@example.com");
    await user.type(
      screen.getByLabelText("Password"),
      "correct-horse-battery-staple",
    );
    await user.click(screen.getByRole("button", { name: /create school/i }));

    expect(
      screen.getByRole("button", { name: /creating your school/i }),
    ).toBeDisabled();

    resolveFetch(new Response(JSON.stringify({ accessToken: "token" }), { status: 201 }));
  });
});
