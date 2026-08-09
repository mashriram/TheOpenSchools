import { describe, expect, it } from "vitest";
import { currentWeekRange } from "./date-range";

describe("currentWeekRange", () => {
  it("returns Monday..Sunday for a mid-week date", () => {
    const wednesday = new Date(2026, 8, 2); // 2026-09-02 is a Wednesday
    expect(currentWeekRange(wednesday)).toEqual({
      dateStart: "2026-08-31",
      dateEnd: "2026-09-06",
    });
  });

  it("returns the same week when given the Monday itself", () => {
    const monday = new Date(2026, 8, 7); // 2026-09-07 is a Monday
    expect(currentWeekRange(monday)).toEqual({
      dateStart: "2026-09-07",
      dateEnd: "2026-09-13",
    });
  });

  it("returns the same week when given the Sunday itself", () => {
    const sunday = new Date(2026, 8, 13); // 2026-09-13 is a Sunday
    expect(currentWeekRange(sunday)).toEqual({
      dateStart: "2026-09-07",
      dateEnd: "2026-09-13",
    });
  });
});
