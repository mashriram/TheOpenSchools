import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MarkbookRoster } from "./markbook-roster";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

const ENTRIES = [
  {
    personId: "person-1",
    attainmentScaleGradeId: "grade-a",
    attainmentScaleGrade: { shortName: "A" },
    effortScaleGradeId: null,
    effortScaleGrade: null,
    comment: "Doing well",
  },
];

describe("MarkbookRoster", () => {
  beforeEach(() => {
    refreshMock.mockClear();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders one row per entry with its current values", () => {
    render(<MarkbookRoster columnId="col-1" entries={ENTRIES} />);

    expect(screen.getByText("person-1")).toBeInTheDocument();
    expect(screen.getByLabelText("Attainment grade for person-1")).toHaveValue("grade-a");
    expect(screen.getByLabelText("Comment for person-1")).toHaveValue("Doing well");
  });

  it("saves a row independently via the entries endpoint", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({}), { status: 201 }));
    render(<MarkbookRoster columnId="col-1" entries={ENTRIES} />);

    await user.clear(screen.getByLabelText("Effort grade for person-1"));
    await user.type(screen.getByLabelText("Effort grade for person-1"), "grade-e");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(fetch).toHaveBeenCalledWith(
      "/api/markbook/columns/col-1/entries",
      expect.objectContaining({ method: "POST" }),
    );
    const [, init] = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(init!.body as string);
    expect(body).toEqual({
      personId: "person-1",
      attainmentScaleGradeId: "grade-a",
      effortScaleGradeId: "grade-e",
      comment: "Doing well",
    });
  });

  it("shows the server's error message on failure", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ message: "Not permitted" }), { status: 403 }),
    );
    render(<MarkbookRoster columnId="col-1" entries={ENTRIES} />);

    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Not permitted");
  });
});
