import type { FoundationModuleSeed } from '../rbac/seed/foundation-rbac-catalog';

/**
 * Tier 2, M23: broadcast messages, mailing lists, and canned responses.
 * Module name/category match Gibbon's real gibbonModule row ('Messenger',
 * category 'Communication'). `messenger.messages.manage` collapses
 * Gibbon's real per-audience "Send To" actions into Admin+Teacher
 * (Gibbon's own default: teachers send to their own classes/form groups,
 * admins send broadly - the actual audience-resolution restriction is
 * enforced by MessengerService.resolveTargetPersonIds() validating every
 * target belongs to the caller's school, not by narrower RBAC actions).
 * Confirming a receipt has no dedicated action - it's inherently
 * self-scoped, see MessengerController.confirmReceipt()'s doc comment.
 */
export const MESSENGER_RBAC_CATALOG: FoundationModuleSeed[] = [
  {
    name: 'Messenger',
    description: 'Broadcast messages to staff, students, and parents.',
    category: 'Communication',
    actions: [
      {
        name: 'messenger.messages.manage',
        category: 'Messages',
        description: 'Send, view, and delete messages.',
        verb: 'manage',
        subject: 'Messenger',
        defaultPermissionAdmin: true,
        defaultPermissionTeacher: true,
      },
      {
        name: 'messenger.mailingLists.manage',
        category: 'Mailing Lists',
        description: 'Create and manage reusable mailing lists.',
        verb: 'manage',
        subject: 'MessengerMailingList',
        defaultPermissionAdmin: true,
        defaultPermissionTeacher: true,
      },
      {
        name: 'messenger.cannedResponses.manage',
        category: 'Canned Responses',
        description: 'Create and manage reusable message templates.',
        verb: 'manage',
        subject: 'MessengerCannedResponse',
        defaultPermissionAdmin: true,
        defaultPermissionTeacher: true,
      },
    ],
  },
];
