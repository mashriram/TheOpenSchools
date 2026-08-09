import mysql from "mysql2/promise";
import type { MigrationAnomaly, TransformedFoundationData } from "./transform";

export interface TargetConnectionConfig {
  host: string;
  port?: number;
  user: string;
  password: string;
  database: string;
}

export interface NewSchool {
  id: string;
  name: string;
  subdomainSlug: string;
}

export interface LoadOptions {
  /** Dry-run by default (per the plan) - only --commit actually writes. */
  commit?: boolean;
}

export interface LoadReport {
  committed: boolean;
  counts: Record<string, number>;
  anomalies: MigrationAnomaly[];
}

/**
 * Inserts one school's transformed Foundation data into the target
 * PurpleSchools database inside a single transaction. Dry-run by default
 * (BEGIN ... ROLLBACK): the row counts and anomaly report this produces
 * are meant to be reviewed before ever passing `commit: true` - no cutover
 * proceeds with unresolved anomalies, per the plan's verification approach.
 *
 * Uses raw parameterized mysql2 queries rather than importing apps/api's
 * TypeORM entities directly: this tool is a standalone CLI in its own
 * package, and reaching into another package's internal entity classes via
 * relative path (there's no published `@purpleschools/api` library target)
 * would couple it to apps/api's file layout in a way a simple rename could
 * silently break. The target table/column shapes are still followed
 * exactly - this is a deliberate, documented deviation from "via TypeORM"
 * in service of keeping the tool's dependency graph clean.
 */
export async function loadFoundationData(
  config: TargetConnectionConfig,
  school: NewSchool,
  data: TransformedFoundationData,
  anomalies: MigrationAnomaly[],
  options: LoadOptions = {},
): Promise<LoadReport> {
  const commit = options.commit ?? false;
  const connection = await mysql.createConnection({
    host: config.host,
    port: config.port ?? 3306,
    user: config.user,
    password: config.password,
    database: config.database,
  });

  const counts: Record<string, number> = {
    schools: 1,
    schoolYears: data.schoolYears.length,
    houses: data.houses.length,
    people: data.people.length,
    yearGroups: data.yearGroups.length,
    formGroups: data.formGroups.length,
    formGroupStaff: data.formGroupStaff.length,
    roles: data.roles.length,
    personCredentials: data.personCredentials.length,
    personRoles: data.personRoles.length,
    staff: data.staff.length,
    studentEnrolments: data.studentEnrolments.length,
    families: data.families.length,
    familyAdults: data.familyAdults.length,
    familyChildren: data.familyChildren.length,
    settings: data.settings.length,
    departments: data.departments.length,
    courses: data.courses.length,
    courseClasses: data.courseClasses.length,
    courseClassPeople: data.courseClassPeople.length,
    scales: data.scales.length,
    scaleGrades: data.scaleGrades.length,
    attendanceCodes: data.attendanceCodes.length,
    financeFeeCategories: data.financeFeeCategories.length,
    financeFees: data.financeFees.length,
    calendars: data.calendars.length,
  };

  try {
    await connection.beginTransaction();

    await bulkInsert(connection, "schools", ["id", "name", "subdomainSlug", "status"], [
      [school.id, school.name, school.subdomainSlug, "Active"],
    ]);

    await bulkInsert(
      connection,
      "school_years",
      ["id", "schoolId", "name", "status", "sequenceNumber", "firstDay", "lastDay"],
      data.schoolYears.map((r) => [r.id, r.schoolId, r.name, r.status, r.sequenceNumber, r.firstDay, r.lastDay]),
    );

    await bulkInsert(
      connection,
      "houses",
      ["id", "schoolId", "name", "shortName", "logoUrl"],
      data.houses.map((r) => [r.id, r.schoolId, r.name, r.shortName, r.logoUrl]),
    );

    await bulkInsert(
      connection,
      "people",
      [
        "id",
        "schoolId",
        "title",
        "surname",
        "firstName",
        "preferredName",
        "gender",
        "status",
        "dateOfBirth",
        "email",
        "emailAlternate",
        "studentIdNumber",
        "dateStart",
        "dateEnd",
        "houseId",
        "classOfSchoolYearId",
      ],
      data.people.map((r) => [
        r.id,
        r.schoolId,
        r.title,
        r.surname,
        r.firstName,
        r.preferredName,
        r.gender,
        r.status,
        r.dateOfBirth,
        r.email,
        r.emailAlternate,
        r.studentIdNumber,
        r.dateStart,
        r.dateEnd,
        r.houseId,
        r.classOfSchoolYearId,
      ]),
    );

    await bulkInsert(
      connection,
      "year_groups",
      ["id", "schoolId", "name", "shortName", "sequenceNumber", "headOfYearPersonId"],
      data.yearGroups.map((r) => [
        r.id,
        r.schoolId,
        r.name,
        r.shortName,
        r.sequenceNumber,
        r.headOfYearPersonId,
      ]),
    );

    await bulkInsert(
      connection,
      "form_groups",
      ["id", "schoolYearId", "name", "shortName", "attendance", "website"],
      data.formGroups.map((r) => [r.id, r.schoolYearId, r.name, r.shortName, r.attendance, r.website]),
    );

    await bulkInsert(
      connection,
      "form_group_staff",
      ["id", "formGroupId", "personId", "role", "priority"],
      data.formGroupStaff.map((r) => [r.id, r.formGroupId, r.personId, r.role, r.priority]),
    );

    await bulkInsert(
      connection,
      "rbac_roles",
      [
        "id",
        "schoolId",
        "category",
        "name",
        "shortName",
        "description",
        "type",
        "canLogin",
        "futureYearsLogin",
        "pastYearsLogin",
        "restriction",
      ],
      data.roles.map((r) => [
        r.id,
        r.schoolId,
        r.category,
        r.name,
        r.shortName,
        r.description,
        r.type,
        r.canLogin,
        r.futureYearsLogin,
        r.pastYearsLogin,
        r.restriction,
      ]),
    );

    await bulkInsert(
      connection,
      "person_credentials",
      [
        "id",
        "personId",
        "schoolId",
        "username",
        "passwordHash",
        "passwordForceReset",
        "canLogin",
      ],
      data.personCredentials.map((r) => [
        r.id,
        r.personId,
        r.schoolId,
        r.username,
        r.passwordHash,
        r.passwordForceReset,
        r.canLogin,
      ]),
    );

    await bulkInsert(
      connection,
      "person_roles",
      ["id", "personId", "roleId", "isPrimary"],
      data.personRoles.map((r) => [r.id, r.personId, r.roleId, r.isPrimary]),
    );

    await bulkInsert(
      connection,
      "staff",
      [
        "id",
        "personId",
        "type",
        "initials",
        "jobTitle",
        "firstAidQualified",
        "firstAidQualification",
        "firstAidExpiry",
        "countryOfOrigin",
        "qualifications",
        "biography",
        "biographicalGrouping",
        "biographicalGroupingPriority",
        "coverageExclude",
        "coveragePriority",
      ],
      data.staff.map((r) => [
        r.id,
        r.personId,
        r.type,
        r.initials,
        r.jobTitle,
        r.firstAidQualified,
        r.firstAidQualification,
        r.firstAidExpiry,
        r.countryOfOrigin,
        r.qualifications,
        r.biography,
        r.biographicalGrouping,
        r.biographicalGroupingPriority,
        r.coverageExclude,
        r.coveragePriority,
      ]),
    );

    await bulkInsert(
      connection,
      "student_enrolments",
      ["id", "personId", "schoolYearId", "yearGroupId", "formGroupId", "rollOrder"],
      data.studentEnrolments.map((r) => [
        r.id,
        r.personId,
        r.schoolYearId,
        r.yearGroupId,
        r.formGroupId,
        r.rollOrder,
      ]),
    );

    await bulkInsert(
      connection,
      "families",
      [
        "id",
        "schoolId",
        "name",
        "nameAddress",
        "homeAddress",
        "homeAddressDistrict",
        "homeAddressCountry",
        "status",
        "languageHomePrimary",
        "languageHomeSecondary",
      ],
      data.families.map((r) => [
        r.id,
        r.schoolId,
        r.name,
        r.nameAddress,
        r.homeAddress,
        r.homeAddressDistrict,
        r.homeAddressCountry,
        r.status,
        r.languageHomePrimary,
        r.languageHomeSecondary,
      ]),
    );

    await bulkInsert(
      connection,
      "family_adults",
      [
        "id",
        "familyId",
        "personId",
        "comment",
        "childDataAccess",
        "contactPriority",
        "contactCall",
        "contactSms",
        "contactEmail",
        "contactMail",
      ],
      data.familyAdults.map((r) => [
        r.id,
        r.familyId,
        r.personId,
        r.comment,
        r.childDataAccess,
        r.contactPriority,
        r.contactCall,
        r.contactSms,
        r.contactEmail,
        r.contactMail,
      ]),
    );

    await bulkInsert(
      connection,
      "family_children",
      ["id", "familyId", "personId", "comment"],
      data.familyChildren.map((r) => [r.id, r.familyId, r.personId, r.comment]),
    );

    await bulkInsert(
      connection,
      "settings",
      ["id", "schoolId", "scope", "name", "nameDisplay", "description", "value"],
      data.settings.map((r) => [r.id, r.schoolId, r.scope, r.name, r.nameDisplay, r.description, r.value]),
    );

    // Tier 2 (M24) - see transform.ts's Tier 2 doc comment for what's
    // covered vs. deliberately deferred to a fast-follow. Insertion order
    // matches each cluster's FK dependency chain (parent before child).
    await bulkInsert(
      connection,
      "departments",
      ["id", "schoolId", "type", "name", "shortName", "subjectListing", "blurb", "logoUrl"],
      data.departments.map((r) => [
        r.id,
        r.schoolId,
        r.type,
        r.name,
        r.shortName,
        r.subjectListing,
        r.blurb,
        r.logoUrl,
      ]),
    );

    await bulkInsert(
      connection,
      "courses",
      [
        "id",
        "schoolId",
        "schoolYearId",
        "departmentId",
        "name",
        "shortName",
        "description",
        "includeInCurriculumMaps",
        "sequenceNumber",
      ],
      data.courses.map((r) => [
        r.id,
        r.schoolId,
        r.schoolYearId,
        r.departmentId,
        r.name,
        r.shortName,
        r.description,
        r.includeInCurriculumMaps,
        r.sequenceNumber,
      ]),
    );

    await bulkInsert(
      connection,
      "course_classes",
      [
        "id",
        "courseId",
        "name",
        "shortName",
        "reportable",
        "takesAttendance",
        "enrolmentMin",
        "enrolmentMax",
      ],
      data.courseClasses.map((r) => [
        r.id,
        r.courseId,
        r.name,
        r.shortName,
        r.reportable,
        r.takesAttendance,
        r.enrolmentMin,
        r.enrolmentMax,
      ]),
    );

    await bulkInsert(
      connection,
      "course_class_people",
      ["id", "courseClassId", "personId", "role", "dateEnrolled", "dateUnenrolled", "reportable"],
      data.courseClassPeople.map((r) => [
        r.id,
        r.courseClassId,
        r.personId,
        r.role,
        r.dateEnrolled,
        r.dateUnenrolled,
        r.reportable,
      ]),
    );

    await bulkInsert(
      connection,
      "markbook_scales",
      ["id", "schoolId", "name", "shortName", "description", "active"],
      // `description` is always null - real Gibbon's gibbonScale has no
      // equivalent free-text field to migrate.
      data.scales.map((r) => [r.id, r.schoolId, r.name, r.shortName, null, r.active]),
    );

    await bulkInsert(
      connection,
      "markbook_scale_grades",
      ["id", "scaleId", "name", "shortName", "value", "sequenceNumber", "lowestAcceptable"],
      data.scaleGrades.map((r) => [
        r.id,
        r.scaleId,
        r.name,
        r.shortName,
        r.value,
        r.sequenceNumber,
        r.lowestAcceptable,
      ]),
    );

    await bulkInsert(
      connection,
      "attendance_codes",
      [
        "id",
        "schoolId",
        "name",
        "shortName",
        "type",
        "direction",
        "scope",
        "active",
        "reportable",
        "allowFutureDate",
        "prefill",
        "sequenceNumber",
      ],
      data.attendanceCodes.map((r) => [
        r.id,
        r.schoolId,
        r.name,
        r.shortName,
        r.type,
        r.direction,
        r.scope,
        r.active,
        r.reportable,
        r.allowFutureDate,
        r.prefill,
        r.sequenceNumber,
      ]),
    );

    await bulkInsert(
      connection,
      "finance_fee_categories",
      ["id", "schoolId", "name", "shortName", "description", "active"],
      data.financeFeeCategories.map((r) => [
        r.id,
        r.schoolId,
        r.name,
        r.shortName,
        r.description,
        r.active,
      ]),
    );

    await bulkInsert(
      connection,
      "finance_fees",
      [
        "id",
        "schoolYearId",
        "name",
        "shortName",
        "description",
        "active",
        "feeCategoryId",
        "amount",
      ],
      data.financeFees.map((r) => [
        r.id,
        r.schoolYearId,
        r.name,
        r.shortName,
        r.description,
        r.active,
        r.feeCategoryId,
        r.amount,
      ]),
    );

    await bulkInsert(
      connection,
      "calendars",
      [
        "id",
        "schoolYearId",
        "name",
        "description",
        "summary",
        "color",
        "public",
        "viewableStaff",
        "viewableStudents",
        "viewableParents",
        "viewableOther",
        "viewableParticipants",
        "editableStaff",
        "sequenceNumber",
      ],
      data.calendars.map((r) => [
        r.id,
        r.schoolYearId,
        r.name,
        r.description,
        r.summary,
        r.color,
        r.public,
        r.viewableStaff,
        r.viewableStudents,
        r.viewableParents,
        r.viewableOther,
        r.viewableParticipants,
        r.editableStaff,
        r.sequenceNumber,
      ]),
    );

    if (commit) {
      await connection.commit();
    } else {
      await connection.rollback();
    }

    return { committed: commit, counts, anomalies };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}

async function bulkInsert(
  connection: mysql.Connection,
  table: string,
  columns: string[],
  rows: unknown[][],
): Promise<void> {
  if (rows.length === 0) {
    return;
  }
  // `table`/`columns` are always fixed literals from the call sites above,
  // never derived from CLI/user input - only `rows` (bound as query
  // parameters, never interpolated) comes from migrated data.
  const columnList = columns.map((c) => `\`${c}\``).join(", ");
  await connection.query(`INSERT INTO \`${table}\` (${columnList}) VALUES ?`, [rows]);
}
