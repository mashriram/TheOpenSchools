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
