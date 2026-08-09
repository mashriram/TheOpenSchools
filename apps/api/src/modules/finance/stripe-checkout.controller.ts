import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AccessTokenPayload } from '../auth/access-token-payload';
import { PoliciesGuard } from '../rbac/policies.guard';
import { CheckPolicies } from '../rbac/check-policies.decorator';
import { StripeCheckoutService } from './stripe-checkout.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('finance/invoices/:invoiceId/checkout-session')
export class StripeCheckoutController {
  constructor(private readonly checkout: StripeCheckoutService) {}

  @Post()
  @CheckPolicies((ability) => ability.can('manage', 'FinanceInvoice'))
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    return this.checkout.createCheckoutSession(
      user.schoolId,
      invoiceId,
      dto.successUrl,
      dto.cancelUrl,
      dto.customerEmail,
    );
  }
}
