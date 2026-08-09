import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateAlertForm } from "./create-alert-form";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

const ALERT_TYPES = [
  { id: "type-1", name: "Academic" },
  { id: "type-2", name: "Medical" },
];

describe("CreateAlertForm", () => {
  beforeEach(() => {
    refreshMock.mockClear();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders an option per alert type and a submit button", () => {
    render(
      <CreateAlertForm personId="person-1" schoolYearId="year-1" alertTypes={ALERT_TYPES} />,
    );

    expect(screen.getByRole("option", { name: "Academic" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Medical" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add alert/i })).toBeInTheDocument();
  });

  it("posts the form and refreshes the page on success", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ id: "1" }), { status: 201 }));
    render(
      <CreateAlertForm personId="person-1" schoolYearId="year-1" alertTypes={ALERT_TYPES} />,
    );

    await user.selectOptions(screen.getByRole("combobox"), "type-2");
    await user.click(screen.getByRole("button", { name: /add alert/i }));

    expect(fetch).toHaveBeenCalledWith(
      "/api/student-alerts",
      expect.objectContaining({ method: "POST" }),
    );
    expect(await screen.findByRole("button", { name: /add alert/i })).toBeEnabled();
    expect(refreshMock).toHaveBeenCalled();
  });

  it("shows the server's error message on failure", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ message: "Your role is not permitted" }), { status: 403 }),
    );
    render(
      <CreateAlertForm personId="person-1" schoolYearId="year-1" alertTypes={ALERT_TYPES} />,
    );

    await user.click(screen.getByRole("button", { name: /add alert/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Your role is not permitted");
  });
});
