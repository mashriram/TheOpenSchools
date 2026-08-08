import { Person } from '../people/entities/person.entity';
import { AttendanceLogPerson } from '../attendance/entities/attendance-log-person.entity';

/**
 * The fixed-up version of Gibbon's ScrubbableGateway pattern (per the
 * plan's Compliance design): nulls PII while leaving statutorily-required,
 * non-personal records alone (StudentEnrolment/PersonRole/FamilyAdult/
 * FamilyChild rows are NOT touched by this - only the Person's own PII
 * columns are). Pure and DB-free so the exact field list is directly
 * unit-testable without seeding a real Person.
 */
export function buildErasureFields(): Partial<Person> {
  return {
    surname: '[ERASED]',
    firstName: '[ERASED]',
    preferredName: null,
    officialName: null,
    nameInCharacters: null,
    email: null,
    emailAlternate: null,
    photoUrl: null,
    dateOfBirth: null,
    address1: null,
    address1District: null,
    address1Country: null,
    address2: null,
    address2District: null,
    address2Country: null,
    website: null,
    languageFirst: null,
    languageSecond: null,
    languageThird: null,
    countryOfBirth: null,
    ethnicity: null,
    religion: null,
    profession: null,
    employer: null,
    jobTitle: null,
    studentIdNumber: null,
    lastSchool: null,
    nextSchool: null,
    departureReason: null,
    transport: null,
    transportNotes: null,
    lockerNumber: null,
    vehicleRegistration: null,
    personalBackground: null,
    calendarFeedPersonal: null,
    privacy: null,
    preferences: null,
    customFields: null,
  };
}

/**
 * Tier 2, M17: Attendance is the first Tier 2 entity to close a real
 * Gibbon gap directly (plan §Data Safety Design F) - Gibbon's
 * gibbonAttendanceLogPerson has zero retention/erasure coverage of any
 * kind, ever, for any person. This nulls the Tier B free-text fields that
 * can reveal health/religious information (`reason`, e.g. "Medical";
 * `comment`) while deliberately keeping the structural attendance fact
 * (attendanceCodeId/direction/date/personId) intact - a school's statutory
 * presence/absence record is not itself sensitive the way the free-text
 * reason can be, and several jurisdictions require schools to retain
 * attendance registers regardless of an individual erasure request.
 */
export function buildAttendanceLogPersonErasureFields(): Pick<
  AttendanceLogPerson,
  'reason' | 'comment'
> {
  return {
    reason: null,
    comment: null,
  };
}
