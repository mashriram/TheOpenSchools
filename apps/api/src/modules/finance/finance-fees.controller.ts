import {
  Body,
  Controller,
  Delete,
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
import { FinanceFeesService } from './finance-fees.service';
import { CreateFeeDto } from './dto/create-fee.dto';
import { UpdateFeeDto } from './dto/update-fee.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller()
export class FinanceFeesController {
  constructor(private readonly fees: FinanceFeesService) {}

  @Get('finance/school-years/:schoolYearId/fees')
  @CheckPolicies((ability) => ability.can('manage', 'FinanceFee'))
  list(
    @CurrentUser() user: AccessTokenPayload,
    @Param('schoolYearId', ParseUUIDPipe) schoolYearId: string,
  ) {
    return this.fees.list(user.schoolId, schoolYearId);
  }

  @Post('finance/school-years/:schoolYearId/fees')
  @CheckPolicies((ability) => ability.can('manage', 'FinanceFee'))
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Param('schoolYearId', ParseUUIDPipe) schoolYearId: string,
    @Body() dto: CreateFeeDto,
  ) {
    return this.fees.create(user.schoolId, schoolYearId, dto);
  }

  @Patch('finance/fees/:id')
  @CheckPolicies((ability) => ability.can('manage', 'FinanceFee'))
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFeeDto,
  ) {
    return this.fees.update(user.schoolId, id, dto);
  }

  @Delete('finance/fees/:id')
  @CheckPolicies((ability) => ability.can('manage', 'FinanceFee'))
  remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.fees.remove(user.schoolId, id);
  }
}
