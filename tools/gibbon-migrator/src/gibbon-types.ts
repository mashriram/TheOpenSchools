/**
 * Raw row shapes as they actually appear in a Gibbon MySQL database
 * (confirmed against the real `gibbon.sql` schema and `gibbon_demo.sql`
 * fixture data, not inferred from documentation). Only the columns this
 * migrator actually maps are typed - the same "core fields now, grow
 * incrementally" scoping used throughout the rest of this project, not an
 * exhaustive 1:1 of every Gibbon column.
 *
 * All id-shaped fields are typed `string` even though MySQL returns them
 * as zerofilled integers rendered as strings by mysql2 for
 * `int UNSIGNED ZEROFILL` columns - `stripZerofill` normalizes them.
 */

export interface GibbonSchoolYearRow {
  gibbonSchoolYearID: string;
  name: string;
  status: 'Past' | 'Current' | 'Upcoming';
  sequenceNumber: number;
  firstDay: string | null;
  lastDay: string | null;
}

export interface GibbonYearGroupRow {
  gibbonYearGroupID: string;
  name: string;
  nameShort: string;
  sequenceNumber: number;
  gibbonPersonIDHOY: string | null;
}

export interface GibbonHouseRow {
  gibbonHouseID: string;
  name: string;
  nameShort: string;
  logo: string;
}

export interface GibbonFormGroupRow {
  gibbonFormGroupID: string;
  gibbonSchoolYearID: string;
  name: string;
  nameShort: string;
  gibbonPersonIDTutor: string | null;
  gibbonPersonIDTutor2: string | null;
  gibbonPersonIDTutor3: string | null;
  gibbonPersonIDEA: string | null;
  gibbonPersonIDEA2: string | null;
  gibbonPersonIDEA3: string | null;
  attendance: 'Y' | 'N';
  website: string;
}

export interface GibbonRoleRow {
  gibbonRoleID: string;
  category: 'Staff' | 'Student' | 'Parent' | 'Other';
  name: string;
  nameShort: string;
  description: string;
  type: 'Core' | 'Additional';
  canLoginRole: 'Y' | 'N';
  futureYearsLogin: 'Y' | 'N';
  pastYearsLogin: 'Y' | 'N';
  restriction: 'None' | 'Same Role' | 'Admin Only';
}

export interface GibbonPersonRow {
  gibbonPersonID: string;
  title: string;
  surname: string;
  firstName: string;
  preferredName: string;
  gender: 'M' | 'F' | 'Other' | 'Unspecified';
  username: string | null;
  status: 'Full' | 'Expected' | 'Left' | 'Pending Approval';
  canLogin: 'Y' | 'N';
  gibbonRoleIDPrimary: string;
  gibbonRoleIDAll: string;
  dob: string | null;
  email: string | null;
  emailAlternate: string | null;
  gibbonHouseID: string | null;
  studentID: string;
  dateStart: string | null;
  dateEnd: string | null;
  gibbonSchoolYearIDClassOf: string | null;
}

export interface GibbonStaffRow {
  gibbonStaffID: string;
  gibbonPersonID: string;
  type: string;
  initials: string | null;
  jobTitle: string;
  firstAidQualified: '' | 'N' | 'Y';
  firstAidQualification: string | null;
  firstAidExpiry: string | null;
  countryOfOrigin: string;
  qualifications: string;
  biography: string;
  biographicalGrouping: string;
  biographicalGroupingPriority: number;
  coverageExclude: 'N' | 'Y';
  coveragePriority: number | null;
}

export interface GibbonStudentEnrolmentRow {
  gibbonStudentEnrolmentID: string;
  gibbonPersonID: string;
  gibbonSchoolYearID: string;
  gibbonYearGroupID: string;
  gibbonFormGroupID: string;
  rollOrder: number | null;
}

export interface GibbonFamilyRow {
  gibbonFamilyID: string;
  name: string;
  nameAddress: string;
  homeAddress: string;
  homeAddressDistrict: string;
  homeAddressCountry: string;
  status: 'Married' | 'Separated' | 'Divorced' | 'De Facto' | 'Other' | 'Single';
  languageHomePrimary: string;
  languageHomeSecondary: string | null;
}

export interface GibbonFamilyAdultRow {
  gibbonFamilyAdultID: string;
  gibbonFamilyID: string;
  gibbonPersonID: string;
  comment: string;
  childDataAccess: 'Y' | 'N';
  contactPriority: number;
  contactCall: 'Y' | 'N';
  contactSMS: 'Y' | 'N';
  contactEmail: 'Y' | 'N';
  contactMail: 'Y' | 'N';
}

export interface GibbonFamilyChildRow {
  gibbonFamilyChildID: string;
  gibbonFamilyID: string;
  gibbonPersonID: string;
  comment: string;
}

export interface GibbonSettingRow {
  gibbonSettingID: string;
  scope: string;
  name: string;
  nameDisplay: string;
  description: string;
  value: string;
}

/**
 * Tier 2 (M24) row shapes, confirmed the same way as Foundation's above -
 * against the real `gibbon.sql` schema. Only a first-pass subset of Tier 2
 * table sets is covered here (one representative cluster per module); see
 * transform.ts's Tier 2 doc comment for the full list of what's covered vs.
 * deliberately deferred to a fast-follow.
 */

/**
 * A genuine pre-existing Foundation gap this Tier 2 extension surfaced and
 * fixes directly: Department (M3) was never wired into the migrator at
 * all, even though Course.departmentId needs it. Migrated here rather than
 * left as another dropped/nulled-reference anomaly.
 */
export interface GibbonDepartmentRow {
  gibbonDepartmentID: string;
  type: 'Learning Area' | 'Administration';
  name: string;
  nameShort: string;
  subjectListing: string;
  blurb: string;
  logo: string;
}

export interface GibbonCourseRow {
  gibbonCourseID: string;
  gibbonSchoolYearID: string;
  gibbonDepartmentID: string | null;
  name: string;
  nameShort: string;
  description: string;
  map: 'Y' | 'N';
  orderBy: number;
}

export interface GibbonCourseClassRow {
  gibbonCourseClassID: string;
  gibbonCourseID: string;
  name: string;
  nameShort: string;
  reportable: 'Y' | 'N';
  attendance: 'Y' | 'N';
  enrolmentMin: number | null;
  enrolmentMax: number | null;
}

export interface GibbonCourseClassPersonRow {
  gibbonCourseClassPersonID: string;
  gibbonCourseClassID: string;
  gibbonPersonID: string;
  role:
    | 'Student'
    | 'Teacher'
    | 'Assistant'
    | 'Technician'
    | 'Parent'
    | 'Student - Left'
    | 'Teacher - Left';
  dateEnrolled: string | null;
  dateUnenrolled: string | null;
  reportable: 'Y' | 'N';
}

export interface GibbonScaleRow {
  gibbonScaleID: string;
  name: string;
  nameShort: string;
  /** The sequence number of the lowest acceptable grade in this scale - used to resolve ScaleGrade.lowestAcceptable during transform. */
  lowestAcceptable: string | null;
  active: 'Y' | 'N';
}

export interface GibbonScaleGradeRow {
  gibbonScaleGradeID: string;
  gibbonScaleID: string;
  value: string;
  descriptor: string;
  sequenceNumber: number;
}

export interface GibbonAttendanceCodeRow {
  gibbonAttendanceCodeID: string;
  name: string;
  nameShort: string;
  type: 'Core' | 'Additional';
  direction: 'In' | 'Out';
  scope: 'Onsite' | 'Onsite - Late' | 'Offsite' | 'Offsite - Left' | 'Offsite - Late';
  active: 'Y' | 'N';
  reportable: 'Y' | 'N';
  future: 'Y' | 'N';
  prefill: 'Y' | 'N';
  sequenceNumber: number;
}

// Behaviour, Student Alerts (AlertType/Alert), and Individual Needs
// (IN/INDescriptor/INPersonDescriptor) are a DELIBERATE fast-follow, not an
// oversight: their target entities have Tier C columns
// (Behaviour.comment/followup, Alert.comment/notesStatus,
// IndividualNeed.strategies/targets/notes) that TypeORM's
// `encryptedColumnTransformer` encrypts transparently at the entity layer.
// This migrator writes through raw parameterized SQL (see load.ts's doc
// comment for why - avoiding a cross-package dependency on apps/api's
// TypeORM entities), which never goes through that transformer. Migrating
// these fields here would mean either (a) inserting them as unencrypted
// plaintext into a column the live application expects to always be
// encrypted, or (b) duplicating AES-256-GCM encryption logic into this
// separate package, risking silent desync from the real implementation on
// a future key-rotation or algorithm change. Given this project's explicit
// "be very safe with data" brief, neither option is acceptable to ship
// casually - these three modules wait for a follow-up that either shares
// the encryption module properly (e.g. via @purpleschools/shared-types) or
// re-encrypts through a real application-layer import step instead of a
// raw-SQL bulk insert.

export interface GibbonFinanceFeeCategoryRow {
  gibbonFinanceFeeCategoryID: string;
  name: string;
  nameShort: string;
  description: string;
  active: 'Y' | 'N';
}

export interface GibbonFinanceFeeRow {
  gibbonFinanceFeeID: string;
  gibbonSchoolYearID: string;
  name: string;
  nameShort: string;
  description: string;
  active: 'Y' | 'N';
  gibbonFinanceFeeCategoryID: string;
  fee: string;
}

export interface GibbonCalendarRow {
  gibbonCalendarID: string;
  gibbonSchoolYearID: string;
  name: string;
  description: string | null;
  summary: string | null;
  color: string | null;
  public: 'Y' | 'N';
  viewableStaff: 'Y' | 'N';
  viewableStudents: 'Y' | 'N';
  viewableParents: 'Y' | 'N';
  viewableOther: 'Y' | 'N';
  viewableParticipants: 'Y' | 'N' | null;
  editableStaff: 'Y' | 'N' | null;
  sequenceNumber: number;
}
