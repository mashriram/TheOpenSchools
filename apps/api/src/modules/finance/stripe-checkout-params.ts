import type Stripe from 'stripe';

export interface CheckoutSessionRequest {
  schoolId: string;
  invoiceId: string;
  amount: number;
  currency: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
}

/**
 * Pure and Stripe-client-free so the exact request shape is directly
 * unit-testable without a network call or a fake Stripe client (see plan
 * §M21/Data Safety Design G: Stripe Checkout redirect/hosted pattern -
 * PurpleSchools never collects card details itself). `schoolId` is
 * stashed in metadata alongside `invoiceId` because Stripe's webhook
 * callback has no other way to recover which tenant a session belongs to
 * - see StripeCheckoutService.handleWebhookEvent().
 */
export function buildCheckoutSessionParams(
  request: CheckoutSessionRequest,
): Stripe.Checkout.SessionCreateParams {
  return {
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: request.currency,
          unit_amount: Math.round(request.amount * 100),
          product_data: { name: request.description },
        },
        quantity: 1,
      },
    ],
    success_url: request.successUrl,
    cancel_url: request.cancelUrl,
    customer_email: request.customerEmail,
    metadata: {
      schoolId: request.schoolId,
      invoiceId: request.invoiceId,
    },
  };
}
