import { randomUUID } from "node:crypto";
import mysql from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { extractFoundationData } from "./extract";
import { transformFoundationData } from "./transform";
import { loadFoundationData } from "./load";

/**
 * Runs the real extract -> transform -> load pipeline against:
 *  - a scratch `gibbon_source` database, loaded from Gibbon's own real
 *    `core/gibbon.sql` (schema) + `core/gibbon_demo.sql` (fixture data) -
 *    per the plan's verification approach ("Import Gibbon's own
 *    gibbon_demo.sql through the migrator as the primary integration test
 *    fixture"). This is real, non-synthetic Gibbon data: 1178 people, 165
 *    staff, 391 enrolments, 738 families.
 *  - the actual local `purpleschools` target database.
 *
 * Requires both databases to already exist locally (see the M10 commit
 * message / README for the one-time `mysql < gibbon.sql && mysql --force
 * < gibbon_demo.sql` setup). Not run as part of `pnpm test` - see
 * `pnpm test:integration`.
 */
const SOURCE_CONFIG = {
  host: process.env.GIBBON_SOURCE_HOST ?? "localhost",
  user: process.env.GIBBON_SOURCE_USER ?? "shri",
  password: process.env.GIBBON_SOURCE_PASSWORD ?? "Shriram200$",
  database: process.env.GIBBON_SOURCE_DATABASE ?? "gibbon_source",
};

const TARGET_CONFIG = {
  host: process.env.TARGET_HOST ?? "localhost",
  user: process.env.TARGET_USER ?? "shri",
  password: process.env.TARGET_PASSWORD ?? "Shriram200$",
  database: process.env.TARGET_DATABASE ?? "purpleschools",
};

describe("gibbon-migrator (integration, real data)", () => {
  let targetConnection: mysql.Connection;
  const createdSchoolIds: string[] = [];

  beforeAll(async () => {
    targetConnection = await mysql.createConnection(TARGET_CONFIG);
  });

  afterAll(async () => {
    if (createdSchoolIds.length > 0) {
      await targetConnection.query("DELETE FROM `schools` WHERE `id` IN (?)", [
        createdSchoolIds,
      ]);
    }
    await targetConnection.end();
  });

  it("extracts the real Gibbon demo dataset with the expected shape", async () => {
    const extract = await extractFoundationData(SOURCE_CONFIG);

    // Exact counts confirmed by direct SQL against the loaded fixture -
    // asserting a lower bound rather than the literal number keeps this
    // test resilient if the upstream demo dataset is ever regenerated with
    // a handful more/fewer rows, while still proving real data was read.
    expect(extract.schoolYears.length).toBeGreaterThanOrEqual(2);
    expect(extract.yearGroups.length).toBeGreaterThanOrEqual(7);
    expect(extract.houses.length).toBeGreaterThanOrEqual(3);
    expect(extract.roles.length).toBe(5);
    expect(extract.people.length).toBeGreaterThan(1000);
    expect(extract.staff.length).toBeGreaterThan(100);
    expect(extract.studentEnrolments.length).toBeGreaterThan(300);
    expect(extract.families.length).toBeGreaterThan(500);
  });

  it("transforms the real dataset, surfacing Gibbon's own genuine data-quality gaps rather than crashing", async () => {
    const extract = await extractFoundationData(SOURCE_CONFIG);
    const { data, anomalies } = transformFoundationData(extract, randomUUID());

    // Confirmed independently via direct SQL (not this migrator's own
    // code): gibbon_demo.sql's gibbonFamilyAdult/gibbonFamilyChild/
    // gibbonStaff tables reference gibbonPersonID values that a large
    // fraction of the time don't exist in gibbonPerson at all (e.g. only
    // 701 of 1448 gibbonFamilyAdult rows and 59 of 165 gibbonStaff rows
    // have a matching person). This is exactly the "zero declared FKs ->
    // expect real orphan findings" risk the plan calls out, not a bug in
    // this migrator - the assertions below are about the SHAPE of the
    // anomaly report being trustworthy, not about the count being small.
    expect(anomalies.length).toBeGreaterThan(0);

    // Every anomaly must be one of the specific fields this migrator
    // actually validates - if an unexpected field ever shows up here, that
    // means a new kind of inconsistency exists that isn't being reported
    // correctly.
    const knownFields = new Set([
      "gibbonPersonIDHOY",
      "gibbonSchoolYearID",
      "gibbonPersonIDTutor/EA",
      "gibbonHouseID",
      "gibbonSchoolYearIDClassOf",
      "gibbonRoleIDAll",
      "gibbonPersonID",
      "gibbonYearGroupID",
      "gibbonFormGroupID",
      "gibbonFamilyID",
    ]);
    for (const anomaly of anomalies) {
      expect(knownFields.has(anomaly.field)).toBe(true);
    }

    // Every Person is still migrated even though some of their
    // relationships (family, staff profile) may be dropped - erring
    // towards "import what's consistent, report what isn't" rather than
    // refusing the whole school over a few bad rows.
    expect(data.people.length).toBe(extract.people.length);
    expect(data.personCredentials.length).toBe(extract.people.length);
    // Every migrated credential is unusable until a real reset flow exists.
    expect(data.personCredentials.every((c) => !c.canLogin)).toBe(true);

    // The genuinely orphaned Staff/FamilyAdult/FamilyChild rows are
    // dropped, not silently kept with a dangling reference.
    const staffAnomalies = anomalies.filter((a) => a.entity === "Staff");
    expect(data.staff.length).toBe(extract.staff.length - staffAnomalies.length);
  });

  it("dry-run load reports counts and writes nothing to the target database", async () => {
    const extract = await extractFoundationData(SOURCE_CONFIG);
    const schoolId = randomUUID();
    const { data, anomalies } = transformFoundationData(extract, schoolId);
    const subdomainSlug = randomUUID().replace(/-/g, "").slice(0, 20);

    const report = await loadFoundationData(
      TARGET_CONFIG,
      { id: schoolId, name: "Gibbon Demo School", subdomainSlug },
      data,
      anomalies,
      { commit: false },
    );

    expect(report.committed).toBe(false);
    expect(report.counts.people).toBe(data.people.length);

    const [rows] = await targetConnection.query(
      "SELECT COUNT(*) as count FROM `schools` WHERE `id` = ?",
      [schoolId],
    );
    expect((rows as Array<{ count: number }>)[0].count).toBe(0);
  });

  it("--commit actually writes a real, queryable school with its people and enrolments", async () => {
    const extract = await extractFoundationData(SOURCE_CONFIG);
    const schoolId = randomUUID();
    const { data, anomalies } = transformFoundationData(extract, schoolId);
    const subdomainSlug = randomUUID().replace(/-/g, "").slice(0, 20);

    const report = await loadFoundationData(
      TARGET_CONFIG,
      { id: schoolId, name: "Gibbon Demo School", subdomainSlug },
      data,
      anomalies,
      { commit: true },
    );
    createdSchoolIds.push(schoolId);

    expect(report.committed).toBe(true);

    const [schoolRows] = await targetConnection.query(
      "SELECT name, subdomainSlug, status FROM `schools` WHERE `id` = ?",
      [schoolId],
    );
    expect(schoolRows).toEqual([
      { name: "Gibbon Demo School", subdomainSlug, status: "Active" },
    ]);

    const [peopleCountRows] = await targetConnection.query(
      "SELECT COUNT(*) as count FROM `people` WHERE `schoolId` = ?",
      [schoolId],
    );
    expect((peopleCountRows as Array<{ count: number }>)[0].count).toBe(
      data.people.length,
    );

    const [enrolmentCountRows] = await targetConnection.query(
      `SELECT COUNT(*) as count FROM \`student_enrolments\` se
       INNER JOIN \`people\` p ON p.id = se.personId
       WHERE p.schoolId = ?`,
      [schoolId],
    );
    expect((enrolmentCountRows as Array<{ count: number }>)[0].count).toBe(
      data.studentEnrolments.length,
    );

    // A migrated account can never log in with its placeholder credential.
    const [credentialRows] = await targetConnection.query(
      `SELECT COUNT(*) as count FROM \`person_credentials\` pc
       INNER JOIN \`people\` p ON p.id = pc.personId
       WHERE p.schoolId = ? AND pc.canLogin = 1`,
      [schoolId],
    );
    expect((credentialRows as Array<{ count: number }>)[0].count).toBe(0);
  });
});
