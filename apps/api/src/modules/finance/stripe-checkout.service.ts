import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { getRequiredEnv } from '../../common/get-required-env';
import { FinanceInvoiceFeesRepository } from './repositories/finance-invoice-fees.repository';
import { PaymentsRepository } from './repositories/payments.repository';
import { FinanceInvoicesService } from './finance-invoices.service';
import { buildCheckoutSessionParams } from './stripe-checkout-params';

export interface CreateCheckoutSessionResult {
  sessionId: string;
  url: string | null;
}

/**
 * Gateway credentials come from `getRequiredEnv()`, never the generic
 * Setting table Gibbon uses for this today (plan §Data Safety Design G) -
 * matching the JWT-secret pattern already established in Foundation.
 */
@Injectable()
export class StripeCheckoutService {
  private readonly stripe: Stripe;

  constructor(
    private readonly config: ConfigService,
    private readonly invoiceFees: FinanceInvoiceFeesRepository,
    private readonly payments: PaymentsRepository,
    private readonly invoices: FinanceInvoicesService,
  ) {
    this.stripe = new Stripe(getRequiredEnv(this.config, 'STRIPE_SECRET_KEY'));
  }

  async createCheckoutSession(
    schoolId: string,
    invoiceId: string,
    successUrl: string,
    cancelUrl: string,
    customerEmail?: string,
  ): Promise<CreateCheckoutSessionResult> {
    await this.invoices.getOwned(schoolId, invoiceId);
    const lines = await this.invoiceFees.findByInvoice(invoiceId);
    const amount = lines.reduce((sum, line) => sum + Number(line.amount), 0);

    const params = buildCheckoutSessionParams({
      schoolId,
      invoiceId,
      amount,
      currency: 'usd',
      description: `Invoice ${invoiceId}`,
      successUrl,
      cancelUrl,
      customerEmail,
    });
    const session = await this.stripe.checkout.sessions.create(params);
    return { sessionId: session.id, url: session.url };
  }

  /**
   * Verifies the webhook signature locally (a pure HMAC check - no network
   * call to Stripe) before trusting anything in the payload. On a
   * completed Checkout session, records a Payment row directly (there is
   * no acting staff member, so `recorderPersonId` stays null - the
   * gateway itself recorded this, not a person) and recalculates the
   * invoice. Idempotent: a session id Stripe has already reported is
   * never recorded twice, since Stripe retries webhook delivery.
   */
  async handleWebhookEvent(rawBody: Buffer, signature: string): Promise<void> {
    const webhookSecret = getRequiredEnv(this.config, 'STRIPE_WEBHOOK_SECRET');
    const event = this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );

    if (event.type !== 'checkout.session.completed') {
      return;
    }
    const session = event.data.object;
    const { schoolId, invoiceId } = session.metadata ?? {};
    if (!schoolId || !invoiceId) {
      return;
    }

    const existing = await this.payments.findByPaymentToken(session.id);
    if (existing) {
      return;
    }

    await this.invoices.getOwned(schoolId, invoiceId);
    await this.payments.save(
      this.payments.create({
        invoiceId,
        recorderPersonId: null,
        type: 'Online',
        status: 'Complete',
        amount: (session.amount_total ?? 0) / 100,
        gateway: 'stripe',
        paymentToken: session.id,
        paymentTransactionId:
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : null,
        occurredAt: new Date(),
      }),
    );
    await this.invoices.recalculatePaidAmount(schoolId, invoiceId);
  }
}
