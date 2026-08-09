import mysql from "mysql2/promise";
import type {
  GibbonAttendanceCodeRow,
  GibbonCalendarRow,
  GibbonCourseClassPersonRow,
  GibbonCourseClassRow,
  GibbonCourseRow,
  GibbonDepartmentRow,
  GibbonFamilyAdultRow,
  GibbonFamilyChildRow,
  GibbonFamilyRow,
  GibbonFinanceFeeCategoryRow,
  GibbonFinanceFeeRow,
  GibbonFormGroupRow,
  GibbonHouseRow,
  GibbonPersonRow,
  GibbonRoleRow,
  GibbonScaleGradeRow,
  GibbonScaleRow,
  GibbonSchoolYearRow,
  GibbonSettingRow,
  GibbonStaffRow,
  GibbonStudentEnrolmentRow,
  GibbonYearGroupRow,
} from "./gibbon-types";

export interface GibbonConnectionConfig {
  host: string;
  port?: number;
  user: string;
  password: string;
  database: string;
}

export interface FoundationExtract {
  schoolYears: GibbonSchoolYearRow[];
  yearGroups: GibbonYearGroupRow[];
  houses: GibbonHouseRow[];
  formGroups: GibbonFormGroupRow[];
  roles: GibbonRoleRow[];
  people: GibbonPersonRow[];
  staff: GibbonStaffRow[];
  studentEnrolments: GibbonStudentEnrolmentRow[];
  families: GibbonFamilyRow[];
  familyAdults: GibbonFamilyAdultRow[];
  familyChildren: GibbonFamilyChildRow[];
  settings: GibbonSettingRow[];

  // Tier 2 (M24) - a first-pass subset of table sets, one representative
  // cluster per module; see transform.ts's Tier 2 doc comment for the full
  // list of what's covered vs. deliberately deferred.
  departments: GibbonDepartmentRow[];
  courses: GibbonCourseRow[];
  courseClasses: GibbonCourseClassRow[];
  courseClassPeople: GibbonCourseClassPersonRow[];
  scales: GibbonScaleRow[];
  scaleGrades: GibbonScaleGradeRow[];
  attendanceCodes: GibbonAttendanceCodeRow[];
  financeFeeCategories: GibbonFinanceFeeCategoryRow[];
  financeFees: GibbonFinanceFeeRow[];
  calendars: GibbonCalendarRow[];
}

/**
 * Connects read-only to a source Gibbon MySQL database and dumps exactly
 * the Foundation tables this migrator knows how to transform. Deliberately
 * does NOT extract gibbonModule/gibbonAction/gibbonPermission - those map
 * to PurpleSchools' GLOBAL platform catalog (seeded once via
 * RbacCatalogSeeder, not per-school data), not something a per-school
 * import creates rows for. A migrated school's roles get Foundation's
 * default permission grants instead (the same defaults a real Gibbon
 * install seeds), and any Additional/custom Gibbon role gets no
 * permissions until an admin sets them - see migrate.ts for why.
 */
export async function extractFoundationData(
  config: GibbonConnectionConfig,
): Promise<FoundationExtract> {
  const connection = await mysql.createConnection({
    host: config.host,
    port: config.port ?? 3306,
    user: config.user,
    password: config.password,
    database: config.database,
  });

  try {
    const [
      schoolYears,
      yearGroups,
      houses,
      formGroups,
      roles,
      people,
      staff,
      studentEnrolments,
      families,
      familyAdults,
      familyChildren,
      settings,
      departments,
      courses,
      courseClasses,
      courseClassPeople,
      scales,
      scaleGrades,
      attendanceCodes,
      financeFeeCategories,
      financeFees,
      calendars,
    ] = await Promise.all([
      selectAll<GibbonSchoolYearRow>(connection, "gibbonSchoolYear"),
      selectAll<GibbonYearGroupRow>(connection, "gibbonYearGroup"),
      selectAll<GibbonHouseRow>(connection, "gibbonHouse"),
      selectAll<GibbonFormGroupRow>(connection, "gibbonFormGroup"),
      selectAll<GibbonRoleRow>(connection, "gibbonRole"),
      selectAll<GibbonPersonRow>(connection, "gibbonPerson"),
      selectAll<GibbonStaffRow>(connection, "gibbonStaff"),
      selectAll<GibbonStudentEnrolmentRow>(connection, "gibbonStudentEnrolment"),
      selectAll<GibbonFamilyRow>(connection, "gibbonFamily"),
      selectAll<GibbonFamilyAdultRow>(connection, "gibbonFamilyAdult"),
      selectAll<GibbonFamilyChildRow>(connection, "gibbonFamilyChild"),
      selectAll<GibbonSettingRow>(connection, "gibbonSetting"),
      selectAll<GibbonDepartmentRow>(connection, "gibbonDepartment"),
      selectAll<GibbonCourseRow>(connection, "gibbonCourse"),
      selectAll<GibbonCourseClassRow>(connection, "gibbonCourseClass"),
      selectAll<GibbonCourseClassPersonRow>(connection, "gibbonCourseClassPerson"),
      selectAll<GibbonScaleRow>(connection, "gibbonScale"),
      selectAll<GibbonScaleGradeRow>(connection, "gibbonScaleGrade"),
      selectAll<GibbonAttendanceCodeRow>(connection, "gibbonAttendanceCode"),
      selectAll<GibbonFinanceFeeCategoryRow>(connection, "gibbonFinanceFeeCategory"),
      selectAll<GibbonFinanceFeeRow>(connection, "gibbonFinanceFee"),
      selectAll<GibbonCalendarRow>(connection, "gibbonCalendar"),
    ]);

    return {
      schoolYears,
      yearGroups,
      houses,
      formGroups,
      roles,
      people,
      staff,
      studentEnrolments,
      families,
      familyAdults,
      familyChildren,
      settings,
      departments,
      courses,
      courseClasses,
      courseClassPeople,
      scales,
      scaleGrades,
      attendanceCodes,
      financeFeeCategories,
      financeFees,
      calendars,
    };
  } finally {
    await connection.end();
  }
}

async function selectAll<T>(connection: mysql.Connection, table: string): Promise<T[]> {
  // `table` is always one of the fixed literal names passed above, never
  // user/CLI input, so string interpolation here doesn't carry the usual
  // SQL-injection risk of building a query from untrusted data.
  const [rows] = await connection.query(`SELECT * FROM \`${table}\``);
  return rows as T[];
}
