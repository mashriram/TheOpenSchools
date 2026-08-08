import { buildErasureFields } from './build-erasure-fields';

describe('buildErasureFields', () => {
  it('nulls every PII field it targets', () => {
    const fields = buildErasureFields();

    expect(fields.surname).toBe('[ERASED]');
    expect(fields.firstName).toBe('[ERASED]');
    expect(fields.email).toBeNull();
    expect(fields.dateOfBirth).toBeNull();
    expect(fields.address1).toBeNull();
  });

  it('does not touch fields outside its target list (e.g. schoolId, houseId)', () => {
    const fields = buildErasureFields();

    expect(fields).not.toHaveProperty('schoolId');
    expect(fields).not.toHaveProperty('houseId');
    expect(fields).not.toHaveProperty('id');
  });

  // Every free-text/demographic PII column on Person that isn't already
  // covered by a structural relation (schoolId, houseId, classOfSchoolYearId)
  // or an operational flag (status, dateStart/End, viewCalendar*,
  // receiveNotificationEmails, cookieConsent, erasedAt) must be nulled here.
  // This list is maintained by hand, not derived from the entity, so that
  // adding a new PII field to Person forces a conscious decision about
  // erasure rather than silently shipping unerased - a real gap (missing
  // customFields/calendarFeedPersonal/transportNotes/language fields/
  // countryOfBirth/lastSchool/nextSchool/departureReason/transport/privacy/
  // preferences) was found and fixed via exactly this kind of check.
  it('covers every known PII field on Person', () => {
    const expectedFields = [
      'surname',
      'firstName',
      'preferredName',
      'officialName',
      'nameInCharacters',
      'email',
      'emailAlternate',
      'photoUrl',
      'dateOfBirth',
      'address1',
      'address1District',
      'address1Country',
      'address2',
      'address2District',
      'address2Country',
      'website',
      'languageFirst',
      'languageSecond',
      'languageThird',
      'countryOfBirth',
      'ethnicity',
      'religion',
      'profession',
      'employer',
      'jobTitle',
      'studentIdNumber',
      'lastSchool',
      'nextSchool',
      'departureReason',
      'transport',
      'transportNotes',
      'lockerNumber',
      'vehicleRegistration',
      'personalBackground',
      'calendarFeedPersonal',
      'privacy',
      'preferences',
      'customFields',
    ].sort();

    expect(Object.keys(buildErasureFields()).sort()).toEqual(expectedFields);
  });
});
