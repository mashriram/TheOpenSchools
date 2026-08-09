import { randomUUID } from "node:crypto";
import { IdMap } from "./id-map";
import { stripZerofill } from "./transforms/zerofill";
import { mapSchoolYear, type MappedSchoolYear } from "./transforms/map-school-year";
import { mapYearGroup } from "./transforms/map-year-group";
import { mapHouse, type MappedHouse } from "./transforms/map-house";
import { expandFormGroupStaff, mapFormGroup } from "./transforms/map-form-group";
import { mapRole, type MappedRole } from "./transforms/map-role";
import { mapPerson } from "./transforms/map-person";
import { mapPersonCredential } from "./transforms/map-person-credential";
import { expandPersonRoles } from "./transforms/map-person-roles";
import { mapStaff, type MappedStaff } from "./transforms/map-staff";
import { mapStudentEnrolment } from "./transforms/map-student-enrolment";
import { mapFamily, type MappedFamily } from "./transforms/map-family";
import { mapFamilyAdult } from "./transforms/map-family-adult";
import { mapFamilyChild } from "./transforms/map-family-child";
import { mapSetting, type MappedSetting } from "./transforms/map-setting";
import { mapDepartment, type MappedDepartment } from "./transforms/map-department";
import { mapCourse } from "./transforms/map-course";
import { mapCourseClass } from "./transforms/map-course-class";
import { mapCourseClassPerson, type MappedCourseClassPersonRole } from "./transforms/map-course-class-person";
import { mapScale, type MappedScale } from "./transforms/map-scale";
import { mapScaleGrade } from "./transforms/map-scale-grade";
import { mapAttendanceCode, type MappedAttendanceCode } from "./transforms/map-attendance-code";
import { mapFinanceFeeCategory, type MappedFinanceFeeCategory } from "./transforms/map-finance-fee-category";
import { mapFinanceFee } from "./transforms/map-finance-fee";
import { mapCalendar } from "./transforms/map-calendar";
import type { FoundationExtract } from "./extract";

export interface MigrationAnomaly {
  /** Which target table the dropped/nulled reference belongs to. */
  entity: string;
  /** The Gibbon row's own (zerofill-stripped) id, for tracing back to the source. */
  recordId: number;
  /** The Gibbon column that referenced a missing row. */
  field: string;
  /** The missing Gibbon id it pointed at. */
  missingGibbonId: number;
  /** Whether the row was dropped entirely (required ref) or just nulled (optional ref). */
  severity: "dropped-row" | "nulled-reference";
}

export interface ResolvedYearGroup {
  id: string;
  schoolId: string;
  name: string;
  shortName: string;
  sequenceNumber: number;
  headOfYearPersonId: string | null;
}

export interface ResolvedFormGroup {
  id: string;
  schoolYearId: string;
  name: string;
  shortName: string;
  attendance: boolean;
  website: string | null;
}

export interface ResolvedFormGroupStaff {
  id: string;
  formGroupId: string;
  personId: string;
  role: "Tutor" | "LearningAssistant";
  priority: number;
}

export interface ResolvedPerson {
  id: string;
  schoolId: string;
  title: string | null;
  surname: string;
  firstName: string;
  preferredName: string | null;
  gender: "M" | "F" | "Other" | "Unspecified";
  status: "Full" | "Expected" | "Left" | "PendingApproval";
  dateOfBirth: string | null;
  email: string | null;
  emailAlternate: string | null;
  studentIdNumber: string | null;
  dateStart: string | null;
  dateEnd: string | null;
  houseId: string | null;
  classOfSchoolYearId: string | null;
}

export interface ResolvedPersonCredential {
  id: string;
  personId: string;
  schoolId: string;
  username: string;
  passwordHash: string;
  passwordForceReset: boolean;
  canLogin: boolean;
}

export interface ResolvedPersonRole {
  id: string;
  personId: string;
  roleId: string;
  isPrimary: boolean;
}

export interface ResolvedStaff extends Omit<MappedStaff, "id" | "personId"> {
  id: string;
  personId: string;
}

export interface ResolvedStudentEnrolment {
  id: string;
  personId: string;
  schoolYearId: string;
  yearGroupId: string;
  formGroupId: string;
  rollOrder: number | null;
}

export interface ResolvedFamilyAdult {
  id: string;
  familyId: string;
  personId: string;
  comment: string | null;
  childDataAccess: boolean;
  contactPriority: number;
  contactCall: boolean;
  contactSms: boolean;
  contactEmail: boolean;
  contactMail: boolean;
}

export interface ResolvedFamilyChild {
  id: string;
  familyId: string;
  personId: string;
  comment: string | null;
}

export interface ResolvedCourse {
  id: string;
  schoolId: string;
  schoolYearId: string;
  departmentId: string | null;
  name: string;
  shortName: string;
  description: string | null;
  includeInCurriculumMaps: boolean;
  sequenceNumber: number;
}

export interface ResolvedCourseClass {
  id: string;
  courseId: string;
  name: string;
  shortName: string;
  reportable: boolean;
  takesAttendance: boolean;
  enrolmentMin: number | null;
  enrolmentMax: number | null;
}

export interface ResolvedCourseClassPerson {
  id: string;
  courseClassId: string;
  personId: string;
  role: MappedCourseClassPersonRole;
  dateEnrolled: string | null;
  dateUnenrolled: string | null;
  reportable: boolean;
}

export interface ResolvedScaleGrade {
  id: string;
  scaleId: string;
  name: string;
  shortName: string;
  value: number;
  sequenceNumber: number;
  lowestAcceptable: boolean;
}

export interface ResolvedFinanceFee {
  id: string;
  schoolYearId: string;
  feeCategoryId: string;
  name: string;
  shortName: string;
  description: string | null;
  active: boolean;
  amount: number;
}

export interface ResolvedCalendar {
  id: string;
  schoolYearId: string;
  name: string;
  description: string | null;
  summary: string | null;
  color: string | null;
  public: boolean;
  viewableStaff: boolean;
  viewableStudents: boolean;
  viewableParents: boolean;
  viewableOther: boolean;
  viewableParticipants: boolean;
  editableStaff: boolean;
  sequenceNumber: number;
}

export interface TransformedFoundationData {
  schoolYears: MappedSchoolYear[];
  yearGroups: ResolvedYearGroup[];
  houses: MappedHouse[];
  formGroups: ResolvedFormGroup[];
  formGroupStaff: ResolvedFormGroupStaff[];
  roles: MappedRole[];
  people: ResolvedPerson[];
  personCredentials: ResolvedPersonCredential[];
  personRoles: ResolvedPersonRole[];
  staff: ResolvedStaff[];
  studentEnrolments: ResolvedStudentEnrolment[];
  families: MappedFamily[];
  familyAdults: ResolvedFamilyAdult[];
  familyChildren: ResolvedFamilyChild[];
  settings: MappedSetting[];

  // Tier 2 (M24) - see this file's Tier 2 doc comment (above
  // transformTier2Data) for what's covered vs. deliberately deferred.
  departments: MappedDepartment[];
  courses: ResolvedCourse[];
  courseClasses: ResolvedCourseClass[];
  courseClassPeople: ResolvedCourseClassPerson[];
  scales: MappedScale[];
  scaleGrades: ResolvedScaleGrade[];
  attendanceCodes: MappedAttendanceCode[];
  financeFeeCategories: MappedFinanceFeeCategory[];
  financeFees: ResolvedFinanceFee[];
  calendars: ResolvedCalendar[];
}

export interface TransformResult {
  data: TransformedFoundationData;
  anomalies: MigrationAnomaly[];
}

/**
 * Transforms a raw Gibbon extract into insertable PurpleSchools rows for
 * one school. Every cross-reference is resolved against the ids assigned
 * in this same extract: a required reference that's missing drops the
 * whole row (it would violate a NOT NULL FK on load); an optional
 * reference that's missing is nulled instead - either way it's reported
 * as an anomaly, never silently dropped from the report.
 */
export function transformFoundationData(
  extract: FoundationExtract,
  schoolId: string,
): TransformResult {
  const idMap = new IdMap();
  const anomalies: MigrationAnomaly[] = [];

  assignIds(idMap, extract);

  const schoolYears = extract.schoolYears.map((row) =>
    mapSchoolYear(row, idMap.resolve("schoolYear", requireId(row.gibbonSchoolYearID))!, schoolId),
  );
  const houses = extract.houses.map((row) =>
    mapHouse(row, idMap.resolve("house", requireId(row.gibbonHouseID))!, schoolId),
  );
  const roles = extract.roles.map((row) =>
    mapRole(row, idMap.resolve("role", requireId(row.gibbonRoleID))!, schoolId),
  );
  const families = extract.families.map((row) =>
    mapFamily(row, idMap.resolve("family", requireId(row.gibbonFamilyID))!, schoolId),
  );
  const settings = extract.settings.map((row) =>
    mapSetting(row, idMap.resolve("setting", requireId(row.gibbonSettingID))!, schoolId),
  );

  const yearGroups = resolveYearGroups(extract, idMap, schoolId, anomalies);
  const { formGroups, formGroupStaff } = resolveFormGroups(extract, idMap, anomalies);
  const { people, personCredentials, personRoles } = resolvePeople(
    extract,
    idMap,
    schoolId,
    anomalies,
  );
  const staff = resolveStaff(extract, idMap, anomalies);
  const studentEnrolments = resolveStudentEnrolments(extract, idMap, anomalies);
  const familyAdults = resolveFamilyAdults(extract, idMap, anomalies);
  const familyChildren = resolveFamilyChildren(extract, idMap, anomalies);

  const departments = extract.departments.map((row) =>
    mapDepartment(row, idMap.resolve("department", requireId(row.gibbonDepartmentID))!, schoolId),
  );
  const scales = extract.scales.map((row) =>
    mapScale(row, idMap.resolve("scale", requireId(row.gibbonScaleID))!, schoolId),
  );
  const attendanceCodes = extract.attendanceCodes.map((row) =>
    mapAttendanceCode(
      row,
      idMap.resolve("attendanceCode", requireId(row.gibbonAttendanceCodeID))!,
      schoolId,
    ),
  );
  const financeFeeCategories = extract.financeFeeCategories.map((row) =>
    mapFinanceFeeCategory(
      row,
      idMap.resolve("financeFeeCategory", requireId(row.gibbonFinanceFeeCategoryID))!,
      schoolId,
    ),
  );

  const courses = resolveCourses(extract, idMap, schoolId, anomalies);
  const courseClasses = resolveCourseClasses(extract, idMap, courses, anomalies);
  const courseClassPeople = resolveCourseClassPeople(extract, idMap, courseClasses, anomalies);
  const scaleGrades = resolveScaleGrades(extract, idMap, anomalies);
  const financeFees = resolveFinanceFees(extract, idMap, anomalies);
  const calendars = resolveCalendars(extract, idMap, anomalies);

  return {
    data: {
      schoolYears,
      yearGroups,
      houses,
      formGroups,
      formGroupStaff,
      roles,
      people,
      personCredentials,
      personRoles,
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
    },
    anomalies,
  };
}

function requireId(rawGibbonId: string): number {
  const id = stripZerofill(rawGibbonId);
  if (id === null) {
    throw new Error(`Expected a Gibbon id, got "${rawGibbonId}"`);
  }
  return id;
}

function assignIds(idMap: IdMap, extract: FoundationExtract): void {
  for (const row of extract.schoolYears) {
    idMap.assign("schoolYear", requireId(row.gibbonSchoolYearID), randomUUID());
  }
  for (const row of extract.yearGroups) {
    idMap.assign("yearGroup", requireId(row.gibbonYearGroupID), randomUUID());
  }
  for (const row of extract.houses) {
    idMap.assign("house", requireId(row.gibbonHouseID), randomUUID());
  }
  for (const row of extract.formGroups) {
    idMap.assign("formGroup", requireId(row.gibbonFormGroupID), randomUUID());
  }
  for (const row of extract.roles) {
    idMap.assign("role", requireId(row.gibbonRoleID), randomUUID());
  }
  for (const row of extract.people) {
    const gibbonId = requireId(row.gibbonPersonID);
    idMap.assign("person", gibbonId, randomUUID());
    idMap.assign("personCredential", gibbonId, randomUUID());
  }
  for (const row of extract.staff) {
    idMap.assign("staff", requireId(row.gibbonStaffID), randomUUID());
  }
  for (const row of extract.studentEnrolments) {
    idMap.assign("studentEnrolment", requireId(row.gibbonStudentEnrolmentID), randomUUID());
  }
  for (const row of extract.families) {
    idMap.assign("family", requireId(row.gibbonFamilyID), randomUUID());
  }
  for (const row of extract.familyAdults) {
    idMap.assign("familyAdult", requireId(row.gibbonFamilyAdultID), randomUUID());
  }
  for (const row of extract.familyChildren) {
    idMap.assign("familyChild", requireId(row.gibbonFamilyChildID), randomUUID());
  }
  for (const row of extract.settings) {
    idMap.assign("setting", requireId(row.gibbonSettingID), randomUUID());
  }
  for (const row of extract.departments) {
    idMap.assign("department", requireId(row.gibbonDepartmentID), randomUUID());
  }
  for (const row of extract.courses) {
    idMap.assign("course", requireId(row.gibbonCourseID), randomUUID());
  }
  for (const row of extract.courseClasses) {
    idMap.assign("courseClass", requireId(row.gibbonCourseClassID), randomUUID());
  }
  for (const row of extract.courseClassPeople) {
    idMap.assign(
      "courseClassPerson",
      requireId(row.gibbonCourseClassPersonID),
      randomUUID(),
    );
  }
  for (const row of extract.scales) {
    idMap.assign("scale", requireId(row.gibbonScaleID), randomUUID());
  }
  for (const row of extract.scaleGrades) {
    idMap.assign("scaleGrade", requireId(row.gibbonScaleGradeID), randomUUID());
  }
  for (const row of extract.attendanceCodes) {
    idMap.assign("attendanceCode", requireId(row.gibbonAttendanceCodeID), randomUUID());
  }
  for (const row of extract.financeFeeCategories) {
    idMap.assign(
      "financeFeeCategory",
      requireId(row.gibbonFinanceFeeCategoryID),
      randomUUID(),
    );
  }
  for (const row of extract.financeFees) {
    idMap.assign("financeFee", requireId(row.gibbonFinanceFeeID), randomUUID());
  }
  for (const row of extract.calendars) {
    idMap.assign("calendar", requireId(row.gibbonCalendarID), randomUUID());
  }
}

function resolveYearGroups(
  extract: FoundationExtract,
  idMap: IdMap,
  schoolId: string,
  anomalies: MigrationAnomaly[],
): ResolvedYearGroup[] {
  return extract.yearGroups.map((row) => {
    const gibbonId = requireId(row.gibbonYearGroupID);
    const mapped = mapYearGroup(row, idMap.resolve("yearGroup", gibbonId)!, schoolId);

    let headOfYearPersonId: string | null = null;
    if (mapped.headOfYearGibbonPersonId !== null) {
      const resolved = idMap.resolve("person", mapped.headOfYearGibbonPersonId);
      if (resolved) {
        headOfYearPersonId = resolved;
      } else {
        anomalies.push({
          entity: "YearGroup",
          recordId: gibbonId,
          field: "gibbonPersonIDHOY",
          missingGibbonId: mapped.headOfYearGibbonPersonId,
          severity: "nulled-reference",
        });
      }
    }

    return {
      id: mapped.id,
      schoolId: mapped.schoolId,
      name: mapped.name,
      shortName: mapped.shortName,
      sequenceNumber: mapped.sequenceNumber,
      headOfYearPersonId,
    };
  });
}

function resolveFormGroups(
  extract: FoundationExtract,
  idMap: IdMap,
  anomalies: MigrationAnomaly[],
): { formGroups: ResolvedFormGroup[]; formGroupStaff: ResolvedFormGroupStaff[] } {
  const formGroups: ResolvedFormGroup[] = [];
  const formGroupStaff: ResolvedFormGroupStaff[] = [];

  for (const row of extract.formGroups) {
    const gibbonId = requireId(row.gibbonFormGroupID);
    const formGroupId = idMap.resolve("formGroup", gibbonId)!;
    const mapped = mapFormGroup(row, formGroupId);

    const schoolYearId = idMap.resolve("schoolYear", mapped.gibbonSchoolYearId);
    if (!schoolYearId) {
      anomalies.push({
        entity: "FormGroup",
        recordId: gibbonId,
        field: "gibbonSchoolYearID",
        missingGibbonId: mapped.gibbonSchoolYearId,
        severity: "dropped-row",
      });
      continue;
    }

    formGroups.push({
      id: mapped.id,
      schoolYearId,
      name: mapped.name,
      shortName: mapped.shortName,
      attendance: mapped.attendance,
      website: mapped.website,
    });

    for (const assignment of expandFormGroupStaff(row, gibbonId)) {
      const personId = idMap.resolve("person", assignment.gibbonPersonId);
      if (!personId) {
        anomalies.push({
          entity: "FormGroupStaff",
          recordId: gibbonId,
          field: "gibbonPersonIDTutor/EA",
          missingGibbonId: assignment.gibbonPersonId,
          severity: "dropped-row",
        });
        continue;
      }
      formGroupStaff.push({
        id: randomUUID(),
        formGroupId,
        personId,
        role: assignment.role,
        priority: assignment.priority,
      });
    }
  }

  return { formGroups, formGroupStaff };
}

function resolvePeople(
  extract: FoundationExtract,
  idMap: IdMap,
  schoolId: string,
  anomalies: MigrationAnomaly[],
): {
  people: ResolvedPerson[];
  personCredentials: ResolvedPersonCredential[];
  personRoles: ResolvedPersonRole[];
} {
  const people: ResolvedPerson[] = [];
  const personCredentials: ResolvedPersonCredential[] = [];
  const personRoles: ResolvedPersonRole[] = [];

  for (const row of extract.people) {
    const gibbonId = requireId(row.gibbonPersonID);
    const personId = idMap.resolve("person", gibbonId)!;
    const mapped = mapPerson(row, personId, schoolId);

    let houseId: string | null = null;
    if (mapped.gibbonHouseId !== null) {
      const resolved = idMap.resolve("house", mapped.gibbonHouseId);
      if (resolved) {
        houseId = resolved;
      } else {
        anomalies.push({
          entity: "Person",
          recordId: gibbonId,
          field: "gibbonHouseID",
          missingGibbonId: mapped.gibbonHouseId,
          severity: "nulled-reference",
        });
      }
    }

    let classOfSchoolYearId: string | null = null;
    if (mapped.gibbonClassOfSchoolYearId !== null) {
      const resolved = idMap.resolve("schoolYear", mapped.gibbonClassOfSchoolYearId);
      if (resolved) {
        classOfSchoolYearId = resolved;
      } else {
        anomalies.push({
          entity: "Person",
          recordId: gibbonId,
          field: "gibbonSchoolYearIDClassOf",
          missingGibbonId: mapped.gibbonClassOfSchoolYearId,
          severity: "nulled-reference",
        });
      }
    }

    people.push({
      id: mapped.id,
      schoolId: mapped.schoolId,
      title: mapped.title,
      surname: mapped.surname,
      firstName: mapped.firstName,
      preferredName: mapped.preferredName,
      gender: mapped.gender,
      status: mapped.status,
      dateOfBirth: mapped.dateOfBirth,
      email: mapped.email,
      emailAlternate: mapped.emailAlternate,
      studentIdNumber: mapped.studentIdNumber,
      dateStart: mapped.dateStart,
      dateEnd: mapped.dateEnd,
      houseId,
      classOfSchoolYearId,
    });

    personCredentials.push(
      mapPersonCredential(row, idMap.resolve("personCredential", gibbonId)!, personId, schoolId),
    );

    for (const assignment of expandPersonRoles(row)) {
      const roleId = idMap.resolve("role", assignment.gibbonRoleId);
      if (!roleId) {
        anomalies.push({
          entity: "PersonRole",
          recordId: gibbonId,
          field: "gibbonRoleIDAll",
          missingGibbonId: assignment.gibbonRoleId,
          severity: "dropped-row",
        });
        continue;
      }
      personRoles.push({
        id: randomUUID(),
        personId,
        roleId,
        isPrimary: assignment.isPrimary,
      });
    }
  }

  return { people, personCredentials, personRoles };
}

function resolveStaff(
  extract: FoundationExtract,
  idMap: IdMap,
  anomalies: MigrationAnomaly[],
): ResolvedStaff[] {
  const result: ResolvedStaff[] = [];

  for (const row of extract.staff) {
    const gibbonId = requireId(row.gibbonStaffID);
    const gibbonPersonId = requireId(row.gibbonPersonID);
    const personId = idMap.resolve("person", gibbonPersonId);
    if (!personId) {
      anomalies.push({
        entity: "Staff",
        recordId: gibbonId,
        field: "gibbonPersonID",
        missingGibbonId: gibbonPersonId,
        severity: "dropped-row",
      });
      continue;
    }
    result.push(mapStaff(row, idMap.resolve("staff", gibbonId)!, personId));
  }

  return result;
}

function resolveStudentEnrolments(
  extract: FoundationExtract,
  idMap: IdMap,
  anomalies: MigrationAnomaly[],
): ResolvedStudentEnrolment[] {
  const result: ResolvedStudentEnrolment[] = [];

  for (const row of extract.studentEnrolments) {
    const gibbonId = requireId(row.gibbonStudentEnrolmentID);
    const mapped = mapStudentEnrolment(row, idMap.resolve("studentEnrolment", gibbonId)!);

    const refs: Array<[string, string, number]> = [
      ["person", "gibbonPersonID", mapped.gibbonPersonId],
      ["schoolYear", "gibbonSchoolYearID", mapped.gibbonSchoolYearId],
      ["yearGroup", "gibbonYearGroupID", mapped.gibbonYearGroupId],
      ["formGroup", "gibbonFormGroupID", mapped.gibbonFormGroupId],
    ];

    let personId: string | undefined;
    let schoolYearId: string | undefined;
    let yearGroupId: string | undefined;
    let formGroupId: string | undefined;
    let dropped = false;

    for (const [kind, field, gibbonRefId] of refs) {
      const resolved = idMap.resolve(kind, gibbonRefId);
      if (!resolved) {
        anomalies.push({
          entity: "StudentEnrolment",
          recordId: gibbonId,
          field,
          missingGibbonId: gibbonRefId,
          severity: "dropped-row",
        });
        dropped = true;
        continue;
      }
      if (kind === "person") personId = resolved;
      if (kind === "schoolYear") schoolYearId = resolved;
      if (kind === "yearGroup") yearGroupId = resolved;
      if (kind === "formGroup") formGroupId = resolved;
    }

    if (dropped || !personId || !schoolYearId || !yearGroupId || !formGroupId) {
      continue;
    }

    result.push({
      id: mapped.id,
      personId,
      schoolYearId,
      yearGroupId,
      formGroupId,
      rollOrder: mapped.rollOrder,
    });
  }

  return result;
}

function resolveFamilyAdults(
  extract: FoundationExtract,
  idMap: IdMap,
  anomalies: MigrationAnomaly[],
): ResolvedFamilyAdult[] {
  const result: ResolvedFamilyAdult[] = [];

  for (const row of extract.familyAdults) {
    const gibbonId = requireId(row.gibbonFamilyAdultID);
    const mapped = mapFamilyAdult(row, idMap.resolve("familyAdult", gibbonId)!);

    const familyId = idMap.resolve("family", mapped.gibbonFamilyId);
    const personId = idMap.resolve("person", mapped.gibbonPersonId);
    if (!familyId || !personId) {
      anomalies.push({
        entity: "FamilyAdult",
        recordId: gibbonId,
        field: !familyId ? "gibbonFamilyID" : "gibbonPersonID",
        missingGibbonId: !familyId ? mapped.gibbonFamilyId : mapped.gibbonPersonId,
        severity: "dropped-row",
      });
      continue;
    }

    result.push({
      id: mapped.id,
      familyId,
      personId,
      comment: mapped.comment,
      childDataAccess: mapped.childDataAccess,
      contactPriority: mapped.contactPriority,
      contactCall: mapped.contactCall,
      contactSms: mapped.contactSms,
      contactEmail: mapped.contactEmail,
      contactMail: mapped.contactMail,
    });
  }

  return result;
}

function resolveFamilyChildren(
  extract: FoundationExtract,
  idMap: IdMap,
  anomalies: MigrationAnomaly[],
): ResolvedFamilyChild[] {
  const result: ResolvedFamilyChild[] = [];

  for (const row of extract.familyChildren) {
    const gibbonId = requireId(row.gibbonFamilyChildID);
    const mapped = mapFamilyChild(row, idMap.resolve("familyChild", gibbonId)!);

    const familyId = idMap.resolve("family", mapped.gibbonFamilyId);
    const personId = idMap.resolve("person", mapped.gibbonPersonId);
    if (!familyId || !personId) {
      anomalies.push({
        entity: "FamilyChild",
        recordId: gibbonId,
        field: !familyId ? "gibbonFamilyID" : "gibbonPersonID",
        missingGibbonId: !familyId ? mapped.gibbonFamilyId : mapped.gibbonPersonId,
        severity: "dropped-row",
      });
      continue;
    }

    result.push({
      id: mapped.id,
      familyId,
      personId,
      comment: mapped.comment,
    });
  }

  return result;
}

/**
 * Tier 2 (M24): a first-pass subset of Tier 2 table sets, one
 * representative cluster per module (per the plan's "table-set by
 * table-set, not rewritten per module" design) - Course/CourseClass/
 * CourseClassPerson (Curriculum), Scale/ScaleGrade (Markbook),
 * AttendanceCode (Attendance), FinanceFeeCategory/FinanceFee (Finance),
 * Calendar. Plus Department (M3), a genuine pre-existing Foundation gap
 * this extension surfaced and fixed directly (Course.departmentId needed
 * it, and it had never been wired into the migrator at all).
 *
 * Deliberately deferred to a documented fast-follow, not an oversight:
 *  - Behaviour, Student Alerts (AlertType/Alert), Individual Needs (IN/
 *    INDescriptor/INPersonDescriptor): their target entities have Tier C
 *    encrypted columns that only get encrypted through TypeORM's
 *    transformer, which this raw-SQL-based migrator never goes through -
 *    see gibbon-types.ts's Tier C doc comment for the full reasoning.
 *  - Timetable (TT*): genuine multi-table complexity the plan's own Risks
 *    section already flagged (Column -> Day -> DayRowClass with Gibbon's
 *    real "Layers" composition) - a bigger, standalone effort.
 *  - Messenger: real gibbon_demo.sql has zero rows in any Messenger table,
 *    and the target schema deliberately restructures the audience/
 *    receipt model (fixing the orphan-row bug) rather than mirroring
 *    Gibbon's - low migration value for the complexity of getting an
 *    audience-resolution migration right a second time (Messenger's
 *    targets are Gibbon's own CSV/multi-column soft references, same
 *    normalization work CourseClassPerson/FormGroupStaff already did).
 *  - AttendanceLogPerson, FinanceInvoice/FinanceInvoiceFee/Payment/
 *    FinanceInvoicee, CalendarEvent/CalendarEditor/CalendarEventType:
 *    longer FK chains layered on top of the clusters above - real,
 *    valuable, but sequenced after the base reference data they depend on
 *    lands first.
 */
function resolveCourses(
  extract: FoundationExtract,
  idMap: IdMap,
  schoolId: string,
  anomalies: MigrationAnomaly[],
): ResolvedCourse[] {
  const result: ResolvedCourse[] = [];

  for (const row of extract.courses) {
    const gibbonId = requireId(row.gibbonCourseID);
    const mapped = mapCourse(row, idMap.resolve("course", gibbonId)!);

    const schoolYearId = idMap.resolve("schoolYear", mapped.gibbonSchoolYearId);
    if (!schoolYearId) {
      anomalies.push({
        entity: "Course",
        recordId: gibbonId,
        field: "gibbonSchoolYearID",
        missingGibbonId: mapped.gibbonSchoolYearId,
        severity: "dropped-row",
      });
      continue;
    }

    let departmentId: string | null = null;
    if (mapped.gibbonDepartmentId !== null) {
      const resolved = idMap.resolve("department", mapped.gibbonDepartmentId);
      if (resolved) {
        departmentId = resolved;
      } else {
        anomalies.push({
          entity: "Course",
          recordId: gibbonId,
          field: "gibbonDepartmentID",
          missingGibbonId: mapped.gibbonDepartmentId,
          severity: "nulled-reference",
        });
      }
    }

    result.push({
      id: mapped.id,
      schoolId,
      schoolYearId,
      departmentId,
      name: mapped.name,
      shortName: mapped.shortName,
      description: mapped.description,
      includeInCurriculumMaps: mapped.includeInCurriculumMaps,
      sequenceNumber: mapped.sequenceNumber,
    });
  }

  return result;
}

function resolveCourseClasses(
  extract: FoundationExtract,
  idMap: IdMap,
  resolvedCourses: ResolvedCourse[],
  anomalies: MigrationAnomaly[],
): ResolvedCourseClass[] {
  const result: ResolvedCourseClass[] = [];
  // Same "id assigned before resolution" chain-drop risk as
  // resolveCourseClassPeople's doc comment describes, one level up: a
  // Course can itself be dropped (missing gibbonSchoolYearID), so
  // idMap.resolve("course", ...) alone isn't sufficient here either.
  const survivingCourseIds = new Set(resolvedCourses.map((c) => c.id));

  for (const row of extract.courseClasses) {
    const gibbonId = requireId(row.gibbonCourseClassID);
    const mapped = mapCourseClass(row, idMap.resolve("courseClass", gibbonId)!);

    let courseId = idMap.resolve("course", mapped.gibbonCourseId);
    if (courseId && !survivingCourseIds.has(courseId)) {
      courseId = undefined;
    }
    if (!courseId) {
      anomalies.push({
        entity: "CourseClass",
        recordId: gibbonId,
        field: "gibbonCourseID",
        missingGibbonId: mapped.gibbonCourseId,
        severity: "dropped-row",
      });
      continue;
    }

    result.push({
      id: mapped.id,
      courseId,
      name: mapped.name,
      shortName: mapped.shortName,
      reportable: mapped.reportable,
      takesAttendance: mapped.takesAttendance,
      enrolmentMin: mapped.enrolmentMin,
      enrolmentMax: mapped.enrolmentMax,
    });
  }

  return result;
}

function resolveCourseClassPeople(
  extract: FoundationExtract,
  idMap: IdMap,
  resolvedCourseClasses: ResolvedCourseClass[],
  anomalies: MigrationAnomaly[],
): ResolvedCourseClassPerson[] {
  const result: ResolvedCourseClassPerson[] = [];
  // `idMap.resolve("courseClass", ...)` alone isn't enough: ids are
  // assigned to every row in extract.courseClasses up front (assignIds()),
  // *before* resolveCourseClasses() has a chance to drop a row whose own
  // gibbonCourseID doesn't exist. Without this extra check, a
  // CourseClassPerson referencing an already-dropped CourseClass would
  // resolve to a UUID that was never actually inserted, and load.ts's real
  // FK constraint would fail with a raw MySQL error instead of a clean,
  // reported anomaly - confirmed against real gibbon_demo.sql data, not a
  // hypothetical.
  const survivingCourseClassIds = new Set(resolvedCourseClasses.map((c) => c.id));

  for (const row of extract.courseClassPeople) {
    const gibbonId = requireId(row.gibbonCourseClassPersonID);
    const mapped = mapCourseClassPerson(row, idMap.resolve("courseClassPerson", gibbonId)!);

    let courseClassId = idMap.resolve("courseClass", mapped.gibbonCourseClassId);
    if (courseClassId && !survivingCourseClassIds.has(courseClassId)) {
      courseClassId = undefined;
    }
    const personId = idMap.resolve("person", mapped.gibbonPersonId);
    if (!courseClassId || !personId) {
      anomalies.push({
        entity: "CourseClassPerson",
        recordId: gibbonId,
        field: !courseClassId ? "gibbonCourseClassID" : "gibbonPersonID",
        missingGibbonId: !courseClassId ? mapped.gibbonCourseClassId : mapped.gibbonPersonId,
        severity: "dropped-row",
      });
      continue;
    }

    result.push({
      id: mapped.id,
      courseClassId,
      personId,
      role: mapped.role,
      dateEnrolled: mapped.dateEnrolled,
      dateUnenrolled: mapped.dateUnenrolled,
      reportable: mapped.reportable,
    });
  }

  return result;
}

/**
 * Resolves `lowestAcceptable` against the PARENT Scale's own
 * `lowestAcceptable` sequence-number pointer (a cross-row lookup only
 * possible at this orchestration layer, not inside the pure
 * mapScaleGrade() function - see ScaleGrade's doc comment for the
 * semantics this reproduces).
 */
function resolveScaleGrades(
  extract: FoundationExtract,
  idMap: IdMap,
  anomalies: MigrationAnomaly[],
): ResolvedScaleGrade[] {
  const result: ResolvedScaleGrade[] = [];
  const lowestAcceptableByGibbonScaleId = new Map<number, number | null>();
  for (const row of extract.scales) {
    const parsed = row.lowestAcceptable === null ? null : Number.parseInt(row.lowestAcceptable, 10);
    lowestAcceptableByGibbonScaleId.set(
      requireId(row.gibbonScaleID),
      Number.isNaN(parsed) ? null : parsed,
    );
  }

  for (const row of extract.scaleGrades) {
    const gibbonId = requireId(row.gibbonScaleGradeID);
    const mapped = mapScaleGrade(row, idMap.resolve("scaleGrade", gibbonId)!);

    const scaleId = idMap.resolve("scale", mapped.gibbonScaleId);
    if (!scaleId) {
      anomalies.push({
        entity: "ScaleGrade",
        recordId: gibbonId,
        field: "gibbonScaleID",
        missingGibbonId: mapped.gibbonScaleId,
        severity: "dropped-row",
      });
      continue;
    }

    const lowestAcceptableSequence = lowestAcceptableByGibbonScaleId.get(mapped.gibbonScaleId);

    result.push({
      id: mapped.id,
      scaleId,
      name: mapped.name,
      shortName: mapped.shortName,
      value: mapped.value,
      sequenceNumber: mapped.sequenceNumber,
      lowestAcceptable: lowestAcceptableSequence === mapped.sequenceNumber,
    });
  }

  return result;
}

function resolveFinanceFees(
  extract: FoundationExtract,
  idMap: IdMap,
  anomalies: MigrationAnomaly[],
): ResolvedFinanceFee[] {
  const result: ResolvedFinanceFee[] = [];

  for (const row of extract.financeFees) {
    const gibbonId = requireId(row.gibbonFinanceFeeID);
    const mapped = mapFinanceFee(row, idMap.resolve("financeFee", gibbonId)!);

    const schoolYearId = idMap.resolve("schoolYear", mapped.gibbonSchoolYearId);
    const feeCategoryId = idMap.resolve("financeFeeCategory", mapped.gibbonFeeCategoryId);
    if (!schoolYearId || !feeCategoryId) {
      anomalies.push({
        entity: "FinanceFee",
        recordId: gibbonId,
        field: !schoolYearId ? "gibbonSchoolYearID" : "gibbonFinanceFeeCategoryID",
        missingGibbonId: !schoolYearId ? mapped.gibbonSchoolYearId : mapped.gibbonFeeCategoryId,
        severity: "dropped-row",
      });
      continue;
    }

    result.push({
      id: mapped.id,
      schoolYearId,
      feeCategoryId,
      name: mapped.name,
      shortName: mapped.shortName,
      description: mapped.description,
      active: mapped.active,
      amount: mapped.amount,
    });
  }

  return result;
}

function resolveCalendars(
  extract: FoundationExtract,
  idMap: IdMap,
  anomalies: MigrationAnomaly[],
): ResolvedCalendar[] {
  const result: ResolvedCalendar[] = [];

  for (const row of extract.calendars) {
    const gibbonId = requireId(row.gibbonCalendarID);
    const mapped = mapCalendar(row, idMap.resolve("calendar", gibbonId)!);

    const schoolYearId = idMap.resolve("schoolYear", mapped.gibbonSchoolYearId);
    if (!schoolYearId) {
      anomalies.push({
        entity: "Calendar",
        recordId: gibbonId,
        field: "gibbonSchoolYearID",
        missingGibbonId: mapped.gibbonSchoolYearId,
        severity: "dropped-row",
      });
      continue;
    }

    result.push({
      id: mapped.id,
      schoolYearId,
      name: mapped.name,
      description: mapped.description,
      summary: mapped.summary,
      color: mapped.color,
      public: mapped.public,
      viewableStaff: mapped.viewableStaff,
      viewableStudents: mapped.viewableStudents,
      viewableParents: mapped.viewableParents,
      viewableOther: mapped.viewableOther,
      viewableParticipants: mapped.viewableParticipants,
      editableStaff: mapped.editableStaff,
      sequenceNumber: mapped.sequenceNumber,
    });
  }

  return result;
}
