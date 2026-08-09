import {
  Body,
  Controller,
  Get,
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
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('finance/invoices/:invoiceId/payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get()
  @CheckPolicies((ability) => ability.can('manage', 'Payment'))
  list(
    @CurrentUser() user: AccessTokenPayload,
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
  ) {
    return this.payments.list(user.schoolId, invoiceId);
  }

  @Post()
  @CheckPolicies((ability) => ability.can('manage', 'Payment'))
  record(
    @CurrentUser() user: AccessTokenPayload,
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.payments.record(user.schoolId, invoiceId, user.sub, dto);
  }
}
