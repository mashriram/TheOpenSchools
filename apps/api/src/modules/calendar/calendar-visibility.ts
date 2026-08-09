import type { RoleCategory } from '@purpleschools/shared-types';

export interface CalendarVisibilityFlags {
  public: boolean;
  viewableStaff: boolean;
  viewableStudents: boolean;
  viewableParents: boolean;
  viewableOther: boolean;
  viewableParticipants: boolean;
}

/**
 * Pure resolution of Gibbon's real container-level visibility model (plan
 * §M22): a calendar's five `viewable*`/`public` flags, plus one
 * per-person override - a specific event's participant sees it via
 * `viewableParticipants` regardless of whether their role's broad flag is
 * set. Directly unit-tested (no DB) across every
 * role-category x flag-combination the plan calls for.
 */
export function canViewCalendar(
  calendar: CalendarVisibilityFlags,
  viewerRoleCategory: RoleCategory,
  isParticipant: boolean,
): boolean {
  if (calendar.public) {
    return true;
  }
  if (isParticipant && calendar.viewableParticipants) {
    return true;
  }
  switch (viewerRoleCategory) {
    case 'Staff':
      return calendar.viewableStaff;
    case 'Student':
      return calendar.viewableStudents;
    case 'Parent':
      return calendar.viewableParents;
    case 'Other':
      return calendar.viewableOther;
    default:
      return false;
  }
}
