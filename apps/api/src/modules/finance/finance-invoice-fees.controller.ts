import {
  Body,
  Controller,
  Delete,
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
import { FinanceInvoiceFeesService } from './finance-invoice-fees.service';
import { CreateInvoiceFeeDto } from './dto/create-invoice-fee.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('finance/invoices/:invoiceId/fees')
export class FinanceInvoiceFeesController {
  constructor(private readonly invoiceFees: FinanceInvoiceFeesService) {}

  @Get()
  @CheckPolicies((ability) => ability.can('manage', 'FinanceInvoice'))
  list(
    @CurrentUser() user: AccessTokenPayload,
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
  ) {
    return this.invoiceFees.list(user.schoolId, invoiceId);
  }

  @Post()
  @CheckPolicies((ability) => ability.can('manage', 'FinanceInvoice'))
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
    @Body() dto: CreateInvoiceFeeDto,
  ) {
    return this.invoiceFees.create(user.schoolId, invoiceId, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can('manage', 'FinanceInvoice'))
  remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.invoiceFees.remove(user.schoolId, id);
  }
}
