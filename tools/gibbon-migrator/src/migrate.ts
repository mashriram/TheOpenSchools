import { randomUUID } from "node:crypto";
import { extractFoundationData, type GibbonConnectionConfig } from "./extract";
import { transformFoundationData } from "./transform";
import { loadFoundationData, type LoadReport, type TargetConnectionConfig } from "./load";

export interface MigrateOptions {
  source: GibbonConnectionConfig;
  target: TargetConnectionConfig;
  schoolName: string;
  subdomainSlug: string;
  /** Dry-run by default - only true actually commits the transaction. */
  commit?: boolean;
}

/**
 * The full extract -> transform -> load pipeline for one school, per the
 * plan's M10 spec. Kept as one function (rather than 3 separate CLI
 * commands) because extract/transform output would otherwise need to be
 * persisted to disk between separate invocations for no real benefit -
 * each phase is still independently unit/integration-tested via
 * extractFoundationData/transformFoundationData/loadFoundationData.
 */
export async function runMigration(options: MigrateOptions): Promise<LoadReport> {
  const extract = await extractFoundationData(options.source);
  const schoolId = randomUUID();
  const { data, anomalies } = transformFoundationData(extract, schoolId);

  return loadFoundationData(
    options.target,
    { id: schoolId, name: options.schoolName, subdomainSlug: options.subdomainSlug },
    data,
    anomalies,
    { commit: options.commit ?? false },
  );
}

export function formatReport(report: LoadReport): string {
  const lines: string[] = [];
  lines.push(report.committed ? "Migration COMMITTED." : "Dry run only - nothing was written.");
  lines.push("");
  lines.push("Row counts:");
  for (const [table, count] of Object.entries(report.counts)) {
    lines.push(`  ${table}: ${count}`);
  }
  lines.push("");
  if (report.anomalies.length === 0) {
    lines.push("Anomalies: none.");
  } else {
    lines.push(`Anomalies: ${report.anomalies.length}`);
    for (const anomaly of report.anomalies) {
      lines.push(
        `  [${anomaly.severity}] ${anomaly.entity} ${anomaly.recordId}: ` +
          `${anomaly.field} -> missing id ${anomaly.missingGibbonId}`,
      );
    }
  }
  return lines.join("\n");
}
