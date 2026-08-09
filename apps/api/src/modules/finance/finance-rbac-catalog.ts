import type { FoundationModuleSeed } from '../rbac/seed/foundation-rbac-catalog';

/**
 * Tier 2, M21: fee categories, fees, billing schedules, invoicees,
 * invoices, and payments. Module name/category match Gibbon's real
 * gibbonModule row (gibbon.sql line 3510: 'Finance', category 'Other').
 * Admin-only by default across the board, matching Gibbon's real Finance
 * permissions (bursar/admin-facing, not broadly granted) - a parent-facing
 * "view/pay my own invoice" self-service action is a documented Tier 2 MVP
 * deferral, consistent with the plan's "ship the vertical slice" scoping
 * for this milestone.
 */
export const FINANCE_RBAC_CATALOG: FoundationModuleSeed[] = [
  {
    name: 'Finance',
    description: 'Issue invoices and track payments.',
    category: 'Other',
    actions: [
      {
        name: 'finance.feeCategories.manage',
        category: 'Fees',
        description: 'Create and edit fee categories.',
        verb: 'manage',
        subject: 'FinanceFeeCategory',
        defaultPermissionAdmin: true,
      },
      {
        name: 'finance.fees.manage',
        category: 'Fees',
        description: 'Create and edit standard fees.',
        verb: 'manage',
        subject: 'FinanceFee',
        defaultPermissionAdmin: true,
      },
      {
        name: 'finance.billingSchedules.manage',
        category: 'Billing',
        description: 'Create and edit billing schedules.',
        verb: 'manage',
        subject: 'FinanceBillingSchedule',
        defaultPermissionAdmin: true,
      },
      {
        name: 'finance.invoicees.manage',
        category: 'Invoicing',
        description: 'Create and edit who is billed for a student.',
        verb: 'manage',
        subject: 'FinanceInvoicee',
        defaultPermissionAdmin: true,
      },
      {
        name: 'finance.invoices.manage',
        category: 'Invoicing',
        description: 'Create, edit, and issue invoices.',
        verb: 'manage',
        subject: 'FinanceInvoice',
        defaultPermissionAdmin: true,
      },
      {
        name: 'finance.payments.manage',
        category: 'Payments',
        description:
          'Record payments and refunds, and create checkout sessions.',
        verb: 'manage',
        subject: 'Payment',
        defaultPermissionAdmin: true,
      },
    ],
  },
];
