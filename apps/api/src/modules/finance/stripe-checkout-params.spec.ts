import { buildCheckoutSessionParams } from './stripe-checkout-params';

describe('buildCheckoutSessionParams', () => {
  it('builds a hosted Checkout session request with no card fields, only gateway-facing amounts', () => {
    const params = buildCheckoutSessionParams({
      schoolId: 'school-1',
      invoiceId: 'invoice-1',
      amount: 125.5,
      currency: 'usd',
      description: 'Invoice invoice-1',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
      customerEmail: 'parent@example.com',
    });

    expect(params.mode).toBe('payment');
    expect(params.success_url).toBe('https://example.com/success');
    expect(params.cancel_url).toBe('https://example.com/cancel');
    expect(params.customer_email).toBe('parent@example.com');
    expect(params.metadata).toEqual({
      schoolId: 'school-1',
      invoiceId: 'invoice-1',
    });
  });

  it('converts a decimal major-currency amount to integer minor units', () => {
    const params = buildCheckoutSessionParams({
      schoolId: 'school-1',
      invoiceId: 'invoice-1',
      amount: 125.5,
      currency: 'usd',
      description: 'Invoice',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });

    const lineItem = params.line_items?.[0];
    expect(lineItem?.price_data?.unit_amount).toBe(12550);
  });

  it('rounds fractional-cent amounts rather than truncating', () => {
    const params = buildCheckoutSessionParams({
      schoolId: 'school-1',
      invoiceId: 'invoice-1',
      amount: 10.005,
      currency: 'usd',
      description: 'Invoice',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });

    expect(params.line_items?.[0]?.price_data?.unit_amount).toBe(1001);
  });
});
