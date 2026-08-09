import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { DatabaseModule } from '../../database/database.module';
import { SchoolModule } from '../school/school.module';
import { PeopleModule } from '../people/people.module';
import { RbacModule } from '../rbac/rbac.module';
import { FinanceModule } from './finance.module';
import { SchoolsRepository } from '../school/repositories/schools.repository';
import { SchoolYearsRepository } from '../school/repositories/school-years.repository';
import { PeopleRepository } from '../people/repositories/people.repository';
import { FinanceInvoiceesService } from './finance-invoicees.service';
import { FinanceInvoicesService } from './finance-invoices.service';
import { PaymentsRepository } from './repositories/payments.repository';
import { StripeCheckoutService } from './stripe-checkout.service';

/**
 * Signature verification is a pure local HMAC computation - Stripe's own
 * `generateTestHeaderString` helper is exactly designed to make this
 * testable without a network call to Stripe at all (see
 * StripeCheckoutService.handleWebhookEvent()'s doc comment).
 */
function signPayload(payload: string, secret: string): string {
  const stripeForSigning = new Stripe('sk_test_unused_for_signing');
  return stripeForSigning.webhooks.generateTestHeaderString({
    payload,
    secret,
  });
}

describe('StripeCheckoutService.handleWebhookEvent (integration)', () => {
  let module: TestingModule;
  let schools: SchoolsRepository;
  let schoolYears: SchoolYearsRepository;
  let people: PeopleRepository;
  let invoicees: FinanceInvoiceesService;
  let invoices: FinanceInvoicesService;
  let payments: PaymentsRepository;
  let service: StripeCheckoutService;
  let webhookSecret: string;
  let createdSchoolIds: string[];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        SchoolModule,
        PeopleModule,
        RbacModule,
        FinanceModule,
      ],
    }).compile();

    schools = module.get(SchoolsRepository);
    schoolYears = module.get(SchoolYearsRepository);
    people = module.get(PeopleRepository);
    invoicees = module.get(FinanceInvoiceesService);
    invoices = module.get(FinanceInvoicesService);
    payments = module.get(PaymentsRepository);
    service = module.get(StripeCheckoutService);
    webhookSecret = module
      .get(ConfigService)
      .get<string>('STRIPE_WEBHOOK_SECRET')!;
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(() => {
    createdSchoolIds = [];
  });

  afterEach(async () => {
    if (createdSchoolIds.length > 0) {
      await schools.delete(createdSchoolIds);
    }
  });

  async function setUp() {
    const school = await schools.save(
      schools.create({ name: 'Test School', subdomainSlug: randomUUID() }),
    );
    createdSchoolIds.push(school.id);
    const schoolYear = await schoolYears.save(
      schoolYears.create({
        schoolId: school.id,
        name: '2024-25',
        sequenceNumber: 1,
      }),
    );
    const student = await people.save(
      people.create({
        schoolId: school.id,
        surname: 'Student',
        firstName: 'Sam',
      }),
    );
    const invoicee = await invoicees.create(school.id, {
      studentPersonId: student.id,
      invoiceTo: 'Family',
    });
    const invoice = await invoices.create(school.id, {
      schoolYearId: schoolYear.id,
      invoiceeId: invoicee.id,
    });
    return { school, invoice };
  }

  function buildCompletedSessionEvent(
    schoolId: string,
    invoiceId: string,
    sessionId: string,
  ): string {
    return JSON.stringify({
      id: `evt_${randomUUID()}`,
      object: 'event',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: sessionId,
          object: 'checkout.session',
          amount_total: 50000,
          payment_intent: 'pi_test_123',
          metadata: { schoolId, invoiceId },
        },
      },
    });
  }

  it('records a Payment and marks the invoice Paid on a validly-signed completed session', async () => {
    const { school, invoice } = await setUp();
    const sessionId = `cs_test_${randomUUID()}`;
    const payload = buildCompletedSessionEvent(
      school.id,
      invoice.id,
      sessionId,
    );
    const signature = signPayload(payload, webhookSecret);

    await service.handleWebhookEvent(Buffer.from(payload), signature);

    const recorded = await payments.findByPaymentToken(sessionId);
    expect(recorded).not.toBeNull();
    expect(recorded!.amount).toBe(500);
    expect(recorded!.gateway).toBe('stripe');

    const updatedInvoice = await invoices.getOwned(school.id, invoice.id);
    expect(Number(updatedInvoice.paidAmount)).toBe(500);
  });

  it('rejects a payload with an invalid signature', async () => {
    const { school, invoice } = await setUp();
    const payload = buildCompletedSessionEvent(
      school.id,
      invoice.id,
      `cs_test_${randomUUID()}`,
    );

    await expect(
      service.handleWebhookEvent(Buffer.from(payload), 'not-a-real-signature'),
    ).rejects.toThrow();
  });

  it('is idempotent - a session already recorded is never recorded twice', async () => {
    const { school, invoice } = await setUp();
    const sessionId = `cs_test_${randomUUID()}`;
    const payload = buildCompletedSessionEvent(
      school.id,
      invoice.id,
      sessionId,
    );
    const signature = signPayload(payload, webhookSecret);
    await service.handleWebhookEvent(Buffer.from(payload), signature);

    await service.handleWebhookEvent(
      Buffer.from(payload),
      signPayload(payload, webhookSecret),
    );

    const list = await payments.findByInvoice(invoice.id);
    expect(list).toHaveLength(1);
  });
});
