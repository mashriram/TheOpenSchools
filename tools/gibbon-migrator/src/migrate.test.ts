import { describe, expect, it } from "vitest";
import { formatReport } from "./migrate";
import type { LoadReport } from "./load";

describe("formatReport", () => {
  it("reports a dry run clearly", () => {
    const report: LoadReport = {
      committed: false,
      counts: { people: 3 },
      anomalies: [],
    };

    const text = formatReport(report);

    expect(text).toContain("Dry run only");
    expect(text).toContain("people: 3");
    expect(text).toContain("Anomalies: none.");
  });

  it("reports a committed migration clearly", () => {
    const report: LoadReport = {
      committed: true,
      counts: { people: 3 },
      anomalies: [],
    };

    expect(formatReport(report)).toContain("Migration COMMITTED.");
  });

  it("lists every anomaly with its entity, field, and missing id", () => {
    const report: LoadReport = {
      committed: false,
      counts: {},
      anomalies: [
        {
          entity: "YearGroup",
          recordId: 1,
          field: "gibbonPersonIDHOY",
          missingGibbonId: 999,
          severity: "nulled-reference",
        },
      ],
    };

    const text = formatReport(report);

    expect(text).toContain("Anomalies: 1");
    expect(text).toContain("YearGroup 1");
    expect(text).toContain("gibbonPersonIDHOY");
    expect(text).toContain("999");
  });
});
