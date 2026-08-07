import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "./page";

describe("Home page", () => {
  it("renders the PurpleSchools heading", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: "PurpleSchools" }),
    ).toBeInTheDocument();
  });

  it("renders the scaffold confirmation copy", () => {
    render(<Home />);

    expect(
      screen.getByText("Next.js + HeroUI frontend scaffold is wired up."),
    ).toBeInTheDocument();
  });

  it("renders an enabled HeroUI button the user can click", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const button = screen.getByRole("button", { name: "It works" });
    expect(button).toBeEnabled();

    const onClick = vi.fn();
    button.addEventListener("click", onClick);
    await user.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is reachable by Tab, so keyboard users can focus it", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const button = screen.getByRole("button", { name: "It works" });

    await user.tab();

    expect(button).toHaveFocus();
  });

  it("renders a native <button type=\"button\"> rather than a non-semantic clickable div, so real browsers give it Enter/Space activation for free", () => {
    // jsdom does not implement the browser's native keydown-activates-button
    // behavior (a documented jsdom gap), so keyboard activation itself can't
    // be asserted end-to-end here - this checks the one thing we control:
    // that HeroUI is rendering the correct semantic element for it.
    render(<Home />);

    const button = screen.getByRole("button", { name: "It works" });

    expect(button.tagName).toBe("BUTTON");
    expect(button).toHaveAttribute("type", "button");
  });

  it("renders exactly one heading and one button, so the smoke test stays unambiguous as the page grows", () => {
    render(<Home />);

    expect(screen.getAllByRole("heading")).toHaveLength(1);
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("does not render any button in a disabled state", () => {
    render(<Home />);

    for (const button of screen.getAllByRole("button")) {
      expect(button).toBeEnabled();
    }
  });
});
