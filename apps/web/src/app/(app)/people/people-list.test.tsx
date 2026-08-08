import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PeopleList } from "./people-list";

describe("PeopleList", () => {
  it("shows an empty-state message when there are no people", () => {
    render(<PeopleList people={[]} />);

    expect(screen.getByText("No one has been added yet.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("renders one list item per person, with their name", () => {
    render(
      <PeopleList
        people={[
          { id: "1", firstName: "Ada", surname: "Admin", email: null },
          { id: "2", firstName: "Jo", surname: "Smith", email: null },
        ]}
      />,
    );

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Ada Admin");
    expect(items[1]).toHaveTextContent("Jo Smith");
  });

  it("includes the email when present, and omits it when null", () => {
    render(
      <PeopleList
        people={[
          { id: "1", firstName: "Ada", surname: "Admin", email: "ada@example.com" },
          { id: "2", firstName: "Jo", surname: "Smith", email: null },
        ]}
      />,
    );

    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("ada@example.com");
    expect(items[1]).not.toHaveTextContent("@");
  });
});
