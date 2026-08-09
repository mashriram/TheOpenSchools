import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TimetableGrid } from "./timetable-grid";

describe("TimetableGrid", () => {
  it("shows an empty-state message when there are no periods", () => {
    render(<TimetableGrid periods={[]} />);

    expect(screen.getByText("No lessons scheduled this week.")).toBeInTheDocument();
  });

  it("groups periods by date and renders each one", () => {
    render(
      <TimetableGrid
        periods={[
          {
            date: "2026-09-07",
            timeStart: "09:00",
            timeEnd: "09:50",
            courseClassId: "1",
            courseClassName: "Maths 7A",
            spaceId: "s1",
            spaceName: "Room 12",
          },
          {
            date: "2026-09-07",
            timeStart: "10:00",
            timeEnd: "10:50",
            courseClassId: "2",
            courseClassName: "English 7A",
            spaceId: null,
            spaceName: null,
          },
        ]}
      />,
    );

    expect(screen.getByText("2026-09-07")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText(/Maths 7A/)).toHaveTextContent("Room 12");
    expect(screen.getByText(/English 7A/)).not.toHaveTextContent("(");
  });
});
