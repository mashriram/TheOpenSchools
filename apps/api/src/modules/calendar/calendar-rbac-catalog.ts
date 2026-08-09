import type { FoundationModuleSeed } from '../rbac/seed/foundation-rbac-catalog';

/**
 * Tier 2, M22: calendars, event types, and events. Module name/category
 * match Gibbon's real gibbonModule row (gibbon.sql line 3480ish: 'Calendar',
 * category 'Other'). `calendar.events.view` is broadly granted by default
 * (Admin/Teacher/Student/Parent), matching Gibbon's real broad 'View
 * Calendar' action - the actual per-viewer filtering is done by
 * `canViewCalendar()`/`CalendarEventsService.listVisibleEventsInRange()`,
 * not by narrower RBAC actions (same "coarse action gate + fine-grained
 * service-level filtering" split already used by Behaviour/Student Alerts).
 * `calendar.calendars.manage`/`calendar.eventTypes.manage` collapse
 * Gibbon's real 'Manage Calendars_all' into Admin-only (there is no
 * `_my`-tier calendar-container management in Gibbon); `calendar.events.manage`
 * collapses 'Manage Events_all'/'_my' into Admin+Teacher, matching the same
 * collapsing-scope-tiers precedent used by Finance/Behaviour.
 */
export const CALENDAR_RBAC_CATALOG: FoundationModuleSeed[] = [
  {
    name: 'Calendar',
    description: 'School calendars and events.',
    category: 'Other',
    actions: [
      {
        name: 'calendar.calendars.manage',
        category: 'Calendars',
        description: 'Create, edit, and manage calendar containers.',
        verb: 'manage',
        subject: 'Calendar',
        defaultPermissionAdmin: true,
      },
      {
        name: 'calendar.eventTypes.manage',
        category: 'Calendars',
        description: 'Create and edit calendar event types.',
        verb: 'manage',
        subject: 'CalendarEventType',
        defaultPermissionAdmin: true,
      },
      {
        name: 'calendar.events.manage',
        category: 'Events',
        description: 'Create, edit, and delete calendar events.',
        verb: 'manage',
        subject: 'CalendarEvent',
        defaultPermissionAdmin: true,
        defaultPermissionTeacher: true,
      },
      {
        name: 'calendar.events.view',
        category: 'Events',
        description: 'View calendars and events.',
        verb: 'view',
        subject: 'CalendarEvent',
        defaultPermissionAdmin: true,
        defaultPermissionTeacher: true,
        defaultPermissionStudent: true,
        defaultPermissionParent: true,
      },
    ],
  },
];
