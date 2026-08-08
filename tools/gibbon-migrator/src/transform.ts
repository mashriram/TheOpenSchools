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
