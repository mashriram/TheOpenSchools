import {
  canViewCalendar,
  type CalendarVisibilityFlags,
} from './calendar-visibility';

const ALL_HIDDEN: CalendarVisibilityFlags = {
  public: false,
  viewableStaff: false,
  viewableStudents: false,
  viewableParents: false,
  viewableOther: false,
  viewableParticipants: false,
};

describe('canViewCalendar', () => {
  it('grants everyone access when public is true, regardless of role', () => {
    const calendar = { ...ALL_HIDDEN, public: true };

    expect(canViewCalendar(calendar, 'Staff', false)).toBe(true);
    expect(canViewCalendar(calendar, 'Student', false)).toBe(true);
    expect(canViewCalendar(calendar, 'Parent', false)).toBe(true);
    expect(canViewCalendar(calendar, 'Other', false)).toBe(true);
  });

  describe('a fully private calendar (all flags false)', () => {
    it.each(['Staff', 'Student', 'Parent', 'Other'] as const)(
      'denies a non-participant %s viewer',
      (role) => {
        expect(canViewCalendar(ALL_HIDDEN, role, false)).toBe(false);
      },
    );

    it.each(['Staff', 'Student', 'Parent', 'Other'] as const)(
      'denies even a participant %s viewer when viewableParticipants is false',
      (role) => {
        expect(canViewCalendar(ALL_HIDDEN, role, true)).toBe(false);
      },
    );
  });

  describe('participant-only visibility', () => {
    const participantOnly = { ...ALL_HIDDEN, viewableParticipants: true };

    it.each(['Staff', 'Student', 'Parent', 'Other'] as const)(
      'grants a participant %s viewer even though the broad flag is false',
      (role) => {
        expect(canViewCalendar(participantOnly, role, true)).toBe(true);
      },
    );

    it.each(['Staff', 'Student', 'Parent', 'Other'] as const)(
      'denies a non-participant %s viewer',
      (role) => {
        expect(canViewCalendar(participantOnly, role, false)).toBe(false);
      },
    );
  });

  describe('per-role broad visibility flags', () => {
    it('grants Staff only when viewableStaff is true', () => {
      expect(
        canViewCalendar({ ...ALL_HIDDEN, viewableStaff: true }, 'Staff', false),
      ).toBe(true);
      expect(
        canViewCalendar(
          { ...ALL_HIDDEN, viewableStaff: true },
          'Student',
          false,
        ),
      ).toBe(false);
    });

    it('grants Student only when viewableStudents is true', () => {
      expect(
        canViewCalendar(
          { ...ALL_HIDDEN, viewableStudents: true },
          'Student',
          false,
        ),
      ).toBe(true);
      expect(
        canViewCalendar(
          { ...ALL_HIDDEN, viewableStudents: true },
          'Parent',
          false,
        ),
      ).toBe(false);
    });

    it('grants Parent only when viewableParents is true', () => {
      expect(
        canViewCalendar(
          { ...ALL_HIDDEN, viewableParents: true },
          'Parent',
          false,
        ),
      ).toBe(true);
      expect(
        canViewCalendar(
          { ...ALL_HIDDEN, viewableParents: true },
          'Other',
          false,
        ),
      ).toBe(false);
    });

    it('grants Other only when viewableOther is true', () => {
      expect(
        canViewCalendar({ ...ALL_HIDDEN, viewableOther: true }, 'Other', false),
      ).toBe(true);
      expect(
        canViewCalendar({ ...ALL_HIDDEN, viewableOther: true }, 'Staff', false),
      ).toBe(false);
    });
  });
});
