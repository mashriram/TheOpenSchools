import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AccessTokenPayload } from '../auth/access-token-payload';
import { PoliciesGuard } from '../rbac/policies.guard';
import { CheckPolicies } from '../rbac/check-policies.decorator';
import { FinanceInvoicesService } from './finance-invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('finance/invoices')
export class FinanceInvoicesController {
  constructor(private readonly invoices: FinanceInvoicesService) {}

  @Post()
  @CheckPolicies((ability) => ability.can('manage', 'FinanceInvoice'))
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateInvoiceDto,
  ) {
    return this.invoices.create(user.schoolId, dto);
  }

  @Get('invoicees/:invoiceeId')
  @CheckPolicies((ability) => ability.can('manage', 'FinanceInvoice'))
  listForInvoicee(
    @CurrentUser() user: AccessTokenPayload,
    @Param('invoiceeId', ParseUUIDPipe) invoiceeId: string,
  ) {
    return this.invoices.listForInvoicee(user.schoolId, invoiceeId);
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.can('manage', 'FinanceInvoice'))
  getOne(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.invoices.getOwned(user.schoolId, id);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can('manage', 'FinanceInvoice'))
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.invoices.update(user.schoolId, id, dto);
  }
}
