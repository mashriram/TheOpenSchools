import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AlertsList } from "./alerts-list";

describe("AlertsList", () => {
  it("shows an empty-state message when there are no alerts", () => {
    render(<AlertsList alerts={[]} />);

    expect(
      screen.getByText("No alerts recorded for this person."),
    ).toBeInTheDocument();
  });

  it("renders the alert type, level, and comment", () => {
    render(
      <AlertsList
        alerts={[
          {
            id: "1",
            level: "High",
            dateStart: "2026-09-01",
            comment: "Confidential detail",
            alertType: { name: "Medical", adminOnly: true },
          },
        ]}
      />,
    );

    expect(screen.getByText("Medical")).toBeInTheDocument();
    expect(screen.getByText("(High)")).toBeInTheDocument();
    expect(screen.getByText("Confidential detail")).toBeInTheDocument();
    expect(screen.getByText("Admin only")).toBeInTheDocument();
  });

  it("does not show the 'Admin only' badge for a non-restricted type", () => {
    render(
      <AlertsList
        alerts={[
          {
            id: "1",
            level: null,
            dateStart: null,
            comment: null,
            alertType: { name: "Academic", adminOnly: false },
          },
        ]}
      />,
    );

    expect(screen.queryByText("Admin only")).not.toBeInTheDocument();
  });
});
