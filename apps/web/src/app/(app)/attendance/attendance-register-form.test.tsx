import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AttendanceRegisterForm } from "./attendance-register-form";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

const ROSTER = [
  { id: "person-1", firstName: "Ada", surname: "Student" },
  { id: "person-2", firstName: "Jo", surname: "Learner" },
];
const CODES = [
  { id: "code-present", name: "Present" },
  { id: "code-absent", name: "Absent" },
];

describe("AttendanceRegisterForm", () => {
  beforeEach(() => {
    refreshMock.mockClear();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows an empty-state message when the form group has no students", () => {
    render(
      <AttendanceRegisterForm formGroupId="fg-1" date="2026-09-01" roster={[]} codes={CODES} />,
    );

    expect(screen.getByText("This form group has no students.")).toBeInTheDocument();
  });

  it("renders one row per roster student, defaulting to the first code", () => {
    render(
      <AttendanceRegisterForm
        formGroupId="fg-1"
        date="2026-09-01"
        roster={ROSTER}
        codes={CODES}
      />,
    );

    expect(screen.getByText("Ada Student")).toBeInTheDocument();
    expect(screen.getByText("Jo Learner")).toBeInTheDocument();
    const selects = screen.getAllByRole("combobox");
    expect(selects).toHaveLength(2);
    expect(selects[0]).toHaveValue("code-present");
  });

  it("submits one entry per student to the register endpoint", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify([]), { status: 201 }));
    render(
      <AttendanceRegisterForm
        formGroupId="fg-1"
        date="2026-09-01"
        roster={ROSTER}
        codes={CODES}
      />,
    );

    const selects = screen.getAllByRole("combobox");
    await user.selectOptions(selects[1], "code-absent");
    await user.click(screen.getByRole("button", { name: /save register/i }));

    expect(fetch).toHaveBeenCalledWith(
      "/api/attendance/form-groups/fg-1/registers",
      expect.objectContaining({ method: "POST" }),
    );
    const [, init] = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(init!.body as string);
    expect(body).toEqual({
      date: "2026-09-01",
      entries: [
        { personId: "person-1", attendanceCodeId: "code-present" },
        { personId: "person-2", attendanceCodeId: "code-absent" },
      ],
    });
    expect(await screen.findByText("Register saved.")).toBeInTheDocument();
  });

  it("shows the server's error message on failure", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ message: "Not permitted" }), { status: 403 }),
    );
    render(
      <AttendanceRegisterForm
        formGroupId="fg-1"
        date="2026-09-01"
        roster={ROSTER}
        codes={CODES}
      />,
    );

    await user.click(screen.getByRole("button", { name: /save register/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Not permitted");
  });
});
