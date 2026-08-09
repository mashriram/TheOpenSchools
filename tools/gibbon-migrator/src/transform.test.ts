import { describe, expect, it } from "vitest";
import { transformFoundationData } from "./transform";
import type { FoundationExtract } from "./extract";

function emptyExtract(): FoundationExtract {
  return {
    schoolYears: [],
    yearGroups: [],
    houses: [],
    formGroups: [],
    roles: [],
    people: [],
    staff: [],
    studentEnrolments: [],
    families: [],
    familyAdults: [],
    familyChildren: [],
    settings: [],
    departments: [],
    courses: [],
    courseClasses: [],
    courseClassPeople: [],
    scales: [],
    scaleGrades: [],
    attendanceCodes: [],
    financeFeeCategories: [],
    financeFees: [],
    calendars: [],
  };
}

describe("transformFoundationData", () => {
  it("returns empty data and no anomalies for an empty extract", () => {
    const { data, anomalies } = transformFoundationData(emptyExtract(), "school-uuid");

    expect(data.schoolYears).toEqual([]);
    expect(anomalies).toEqual([]);
  });

  it("resolves a YearGroup's head-of-year reference to the migrated Person's new id", () => {
    const extract = emptyExtract();
    extract.roles = [
      {
        gibbonRoleID: "002",
        category: "Staff",
        name: "Teacher",
        nameShort: "Tchr",
        description: "Regular, classroom teacher",
        type: "Core",
        canLoginRole: "Y",
        futureYearsLogin: "Y",
        pastYearsLogin: "Y",
        restriction: "None",
      },
    ];
    extract.people = [
      {
        gibbonPersonID: "0000000119",
        title: "",
        surname: "Schultz",
        firstName: "Nathan",
        preferredName: "",
        gender: "M",
        username: "119",
        status: "Full",
        canLogin: "Y",
        gibbonRoleIDPrimary: "002",
        gibbonRoleIDAll: "002",
        dob: null,
        email: null,
        emailAlternate: null,
        gibbonHouseID: null,
        studentID: "",
        dateStart: null,
        dateEnd: null,
        gibbonSchoolYearIDClassOf: null,
      },
    ];
    extract.yearGroups = [
      {
        gibbonYearGroupID: "001",
        name: "Year 7",
        nameShort: "Y7",
        sequenceNumber: 7,
        gibbonPersonIDHOY: "0000000119",
      },
    ];

    const { data, anomalies } = transformFoundationData(extract, "school-uuid");

    const person = data.people[0];
    const yearGroup = data.yearGroups[0];
    expect(yearGroup.headOfYearPersonId).toBe(person.id);
    expect(anomalies).toEqual([]);
  });

  it("nulls a YearGroup's head-of-year reference and reports an anomaly when the person isn't in the extract", () => {
    const extract = emptyExtract();
    extract.yearGroups = [
      {
        gibbonYearGroupID: "001",
        name: "Year 7",
        nameShort: "Y7",
        sequenceNumber: 7,
        gibbonPersonIDHOY: "0000000999",
      },
    ];

    const { data, anomalies } = transformFoundationData(extract, "school-uuid");

    expect(data.yearGroups[0].headOfYearPersonId).toBeNull();
    expect(anomalies).toEqual([
      {
        entity: "YearGroup",
        recordId: 1,
        field: "gibbonPersonIDHOY",
        missingGibbonId: 999,
        severity: "nulled-reference",
      },
    ]);
  });

  it("drops a FormGroup entirely and reports an anomaly when its school year isn't in the extract", () => {
    const extract = emptyExtract();
    extract.formGroups = [
      {
        gibbonFormGroupID: "00001",
        gibbonSchoolYearID: "999",
        name: "7A",
        nameShort: "7A",
        gibbonPersonIDTutor: null,
        gibbonPersonIDTutor2: null,
        gibbonPersonIDTutor3: null,
        gibbonPersonIDEA: null,
        gibbonPersonIDEA2: null,
        gibbonPersonIDEA3: null,
        attendance: "Y",
        website: "",
      },
    ];

    const { data, anomalies } = transformFoundationData(extract, "school-uuid");

    expect(data.formGroups).toEqual([]);
    expect(anomalies).toEqual([
      {
        entity: "FormGroup",
        recordId: 1,
        field: "gibbonSchoolYearID",
        missingGibbonId: 999,
        severity: "dropped-row",
      },
    ]);
  });

  it("drops a StudentEnrolment and reports an anomaly when any of its 4 required references is missing", () => {
    const extract = emptyExtract();
    extract.schoolYears = [
      {
        gibbonSchoolYearID: "025",
        name: "2023/2024",
        status: "Current",
        sequenceNumber: 1,
        firstDay: null,
        lastDay: null,
      },
    ];
    extract.yearGroups = [
      {
        gibbonYearGroupID: "001",
        name: "Year 7",
        nameShort: "Y7",
        sequenceNumber: 7,
        gibbonPersonIDHOY: null,
      },
    ];
    extract.formGroups = [
      {
        gibbonFormGroupID: "00001",
        gibbonSchoolYearID: "025",
        name: "7A",
        nameShort: "7A",
        gibbonPersonIDTutor: null,
        gibbonPersonIDTutor2: null,
        gibbonPersonIDTutor3: null,
        gibbonPersonIDEA: null,
        gibbonPersonIDEA2: null,
        gibbonPersonIDEA3: null,
        attendance: "Y",
        website: "",
      },
    ];
    extract.studentEnrolments = [
      {
        gibbonStudentEnrolmentID: "00000001",
        gibbonPersonID: "0000000999",
        gibbonSchoolYearID: "025",
        gibbonYearGroupID: "001",
        gibbonFormGroupID: "00001",
        rollOrder: null,
      },
    ];

    const { data, anomalies } = transformFoundationData(extract, "school-uuid");

    expect(data.studentEnrolments).toEqual([]);
    expect(anomalies).toEqual([
      {
        entity: "StudentEnrolment",
        recordId: 1,
        field: "gibbonPersonID",
        missingGibbonId: 999,
        severity: "dropped-row",
      },
    ]);
  });

  it("resolves a full, consistent enrolment chain end-to-end", () => {
    const extract = emptyExtract();
    extract.roles = [
      {
        gibbonRoleID: "003",
        category: "Student",
        name: "Student",
        nameShort: "Std",
        description: "Person studying in the school",
        type: "Core",
        canLoginRole: "Y",
        futureYearsLogin: "Y",
        pastYearsLogin: "Y",
        restriction: "None",
      },
    ];
    extract.schoolYears = [
      {
        gibbonSchoolYearID: "025",
        name: "2023/2024",
        status: "Current",
        sequenceNumber: 1,
        firstDay: null,
        lastDay: null,
      },
    ];
    extract.yearGroups = [
      { gibbonYearGroupID: "001", name: "Year 7", nameShort: "Y7", sequenceNumber: 7, gibbonPersonIDHOY: null },
    ];
    extract.formGroups = [
      {
        gibbonFormGroupID: "00001",
        gibbonSchoolYearID: "025",
        name: "7A",
        nameShort: "7A",
        gibbonPersonIDTutor: null,
        gibbonPersonIDTutor2: null,
        gibbonPersonIDTutor3: null,
        gibbonPersonIDEA: null,
        gibbonPersonIDEA2: null,
        gibbonPersonIDEA3: null,
        attendance: "Y",
        website: "",
      },
    ];
    extract.people = [
      {
        gibbonPersonID: "0000000200",
        title: "",
        surname: "Doe",
        firstName: "Jane",
        preferredName: "",
        gender: "F",
        username: "200",
        status: "Full",
        canLogin: "Y",
        gibbonRoleIDPrimary: "003",
        gibbonRoleIDAll: "003",
        dob: null,
        email: null,
        emailAlternate: null,
        gibbonHouseID: null,
        studentID: "",
        dateStart: null,
        dateEnd: null,
        gibbonSchoolYearIDClassOf: null,
      },
    ];
    extract.studentEnrolments = [
      {
        gibbonStudentEnrolmentID: "00000001",
        gibbonPersonID: "0000000200",
        gibbonSchoolYearID: "025",
        gibbonYearGroupID: "001",
        gibbonFormGroupID: "00001",
        rollOrder: 1,
      },
    ];

    const { data, anomalies } = transformFoundationData(extract, "school-uuid");

    expect(anomalies).toEqual([]);
    expect(data.studentEnrolments).toHaveLength(1);
    const enrolment = data.studentEnrolments[0];
    expect(enrolment.personId).toBe(data.people[0].id);
    expect(enrolment.schoolYearId).toBe(data.schoolYears[0].id);
    expect(enrolment.yearGroupId).toBe(data.yearGroups[0].id);
    expect(enrolment.formGroupId).toBe(data.formGroups[0].id);
  });

  it("every migrated PersonCredential forces canLogin: false regardless of Gibbon's own canLogin value", () => {
    const extract = emptyExtract();
    extract.people = [
      {
        gibbonPersonID: "0000000119",
        title: "",
        surname: "Schultz",
        firstName: "Nathan",
        preferredName: "",
        gender: "M",
        username: "119",
        status: "Full",
        canLogin: "Y",
        gibbonRoleIDPrimary: "002",
        gibbonRoleIDAll: "002",
        dob: null,
        email: null,
        emailAlternate: null,
        gibbonHouseID: null,
        studentID: "",
        dateStart: null,
        dateEnd: null,
        gibbonSchoolYearIDClassOf: null,
      },
    ];

    const { data } = transformFoundationData(extract, "school-uuid");

    expect(data.personCredentials).toHaveLength(1);
    expect(data.personCredentials[0].canLogin).toBe(false);
    expect(data.personCredentials[0].passwordForceReset).toBe(true);
  });

  it("drops a PersonRole assignment and reports an anomaly when the role isn't in the extract", () => {
    const extract = emptyExtract();
    extract.people = [
      {
        gibbonPersonID: "0000000119",
        title: "",
        surname: "Schultz",
        firstName: "Nathan",
        preferredName: "",
        gender: "M",
        username: "119",
        status: "Full",
        canLogin: "Y",
        gibbonRoleIDPrimary: "999",
        gibbonRoleIDAll: "999",
        dob: null,
        email: null,
        emailAlternate: null,
        gibbonHouseID: null,
        studentID: "",
        dateStart: null,
        dateEnd: null,
        gibbonSchoolYearIDClassOf: null,
      },
    ];

    const { data, anomalies } = transformFoundationData(extract, "school-uuid");

    expect(data.personRoles).toEqual([]);
    expect(anomalies).toEqual([
      {
        entity: "PersonRole",
        recordId: 119,
        field: "gibbonRoleIDAll",
        missingGibbonId: 999,
        severity: "dropped-row",
      },
    ]);
  });

  describe("Tier 2 (M24)", () => {
    it("resolves the full Course -> CourseClass -> CourseClassPerson chain", () => {
      const extract = emptyExtract();
      extract.schoolYears = [
        { gibbonSchoolYearID: "001", name: "2026-27", status: "Current", sequenceNumber: 1, firstDay: null, lastDay: null },
      ];
      extract.roles = [
        {
          gibbonRoleID: "002", category: "Staff", name: "Teacher", nameShort: "Tchr",
          description: "Regular, classroom teacher", type: "Core", canLoginRole: "Y",
          futureYearsLogin: "Y", pastYearsLogin: "Y", restriction: "None",
        },
      ];
      extract.people = [
        {
          gibbonPersonID: "0000000119",
          title: "", surname: "Schultz", firstName: "Nathan", preferredName: "",
          gender: "M", username: "119", status: "Full", canLogin: "Y",
          gibbonRoleIDPrimary: "002", gibbonRoleIDAll: "002", dob: null, email: null,
          emailAlternate: null, gibbonHouseID: null, studentID: "", dateStart: null,
          dateEnd: null, gibbonSchoolYearIDClassOf: null,
        },
      ];
      extract.courses = [
        {
          gibbonCourseID: "00000001", gibbonSchoolYearID: "001", gibbonDepartmentID: null,
          name: "Mathematics", nameShort: "MATH", description: "", map: "Y", orderBy: 1,
        },
      ];
      extract.courseClasses = [
        {
          gibbonCourseClassID: "00000001", gibbonCourseID: "00000001", name: "Maths 7A",
          nameShort: "M7A", reportable: "Y", attendance: "Y", enrolmentMin: null, enrolmentMax: null,
        },
      ];
      extract.courseClassPeople = [
        {
          gibbonCourseClassPersonID: "0000000001", gibbonCourseClassID: "00000001",
          gibbonPersonID: "0000000119", role: "Teacher", dateEnrolled: "2026-09-01",
          dateUnenrolled: null, reportable: "Y",
        },
      ];

      const { data, anomalies } = transformFoundationData(extract, "school-uuid");

      expect(anomalies).toEqual([]);
      expect(data.courses).toEqual([
        expect.objectContaining({ schoolId: "school-uuid", schoolYearId: data.schoolYears[0].id, name: "Mathematics" }),
      ]);
      expect(data.courseClasses).toEqual([
        expect.objectContaining({ courseId: data.courses[0].id, name: "Maths 7A" }),
      ]);
      expect(data.courseClassPeople).toEqual([
        expect.objectContaining({
          courseClassId: data.courseClasses[0].id,
          personId: data.people[0].id,
          role: "Teacher",
        }),
      ]);
    });

    it("drops a Course whose school year is missing, reporting an anomaly", () => {
      const extract = emptyExtract();
      extract.courses = [
        {
          gibbonCourseID: "00000001", gibbonSchoolYearID: "999", gibbonDepartmentID: null,
          name: "Mathematics", nameShort: "MATH", description: "", map: "Y", orderBy: 1,
        },
      ];

      const { data, anomalies } = transformFoundationData(extract, "school-uuid");

      expect(data.courses).toEqual([]);
      expect(anomalies).toEqual([
        { entity: "Course", recordId: 1, field: "gibbonSchoolYearID", missingGibbonId: 999, severity: "dropped-row" },
      ]);
    });

    it("marks the ScaleGrade whose sequenceNumber matches the parent Scale's lowestAcceptable pointer", () => {
      const extract = emptyExtract();
      extract.scales = [
        { gibbonScaleID: "00001", name: "IB MYP 1-7", nameShort: "MYP", lowestAcceptable: "2", active: "Y" },
      ];
      extract.scaleGrades = [
        { gibbonScaleGradeID: "0000001", gibbonScaleID: "00001", value: "7", descriptor: "7", sequenceNumber: 1 },
        { gibbonScaleGradeID: "0000002", gibbonScaleID: "00001", value: "6", descriptor: "6", sequenceNumber: 2 },
        { gibbonScaleGradeID: "0000003", gibbonScaleID: "00001", value: "5", descriptor: "5", sequenceNumber: 3 },
      ];

      const { data, anomalies } = transformFoundationData(extract, "school-uuid");

      expect(anomalies).toEqual([]);
      const flags = data.scaleGrades.map((g) => g.lowestAcceptable);
      expect(flags).toEqual([false, true, false]);
    });

    it("resolves a Calendar's school year reference", () => {
      const extract = emptyExtract();
      extract.schoolYears = [
        { gibbonSchoolYearID: "001", name: "2026-27", status: "Current", sequenceNumber: 1, firstDay: null, lastDay: null },
      ];
      extract.calendars = [
        {
          gibbonCalendarID: "000001", gibbonSchoolYearID: "001", name: "Whole School",
          description: null, summary: null, color: null, public: "Y", viewableStaff: "N",
          viewableStudents: "N", viewableParents: "N", viewableOther: "N",
          viewableParticipants: null, editableStaff: null, sequenceNumber: 1,
        },
      ];

      const { data, anomalies } = transformFoundationData(extract, "school-uuid");

      expect(anomalies).toEqual([]);
      expect(data.calendars).toEqual([
        expect.objectContaining({ schoolYearId: data.schoolYears[0].id, name: "Whole School", public: true }),
      ]);
    });
  });
});
