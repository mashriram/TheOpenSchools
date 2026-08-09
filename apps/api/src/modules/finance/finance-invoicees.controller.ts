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
import { FinanceInvoiceesService } from './finance-invoicees.service';
import { CreateInvoiceeDto } from './dto/create-invoicee.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('finance/invoicees')
export class FinanceInvoiceesController {
  constructor(private readonly invoicees: FinanceInvoiceesService) {}

  @Post()
  @CheckPolicies((ability) => ability.can('manage', 'FinanceInvoicee'))
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateInvoiceeDto,
  ) {
    return this.invoicees.create(user.schoolId, dto);
  }

  @Get('people/:studentPersonId')
  @CheckPolicies((ability) => ability.can('manage', 'FinanceInvoicee'))
  listForStudent(
    @CurrentUser() user: AccessTokenPayload,
    @Param('studentPersonId', ParseUUIDPipe) studentPersonId: string,
  ) {
    return this.invoicees.listForStudent(user.schoolId, studentPersonId);
  }
}
