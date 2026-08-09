import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';
import { StripeCheckoutService } from './stripe-checkout.service';

interface RawBodyRequest {
  rawBody?: Buffer;
}

/**
 * Deliberately unguarded (no JwtAuthGuard/PoliciesGuard) - Stripe calls
 * this directly, with no PurpleSchools session of any kind. Trust comes
 * entirely from StripeCheckoutService.handleWebhookEvent()'s local
 * signature verification against STRIPE_WEBHOOK_SECRET, not from any
 * application-level auth.
 */
@Controller('finance/webhooks/stripe')
export class StripeWebhookController {
  constructor(private readonly checkout: StripeCheckoutService) {}

  @Post()
  @HttpCode(200)
  async handle(
    @Req() request: RawBodyRequest,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: true }> {
    if (!request.rawBody || !signature) {
      throw new BadRequestException('Missing Stripe webhook signature or body');
    }
    await this.checkout.handleWebhookEvent(request.rawBody, signature);
    return { received: true };
  }
}
