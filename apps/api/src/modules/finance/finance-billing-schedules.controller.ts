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
import { FinanceBillingSchedulesService } from './finance-billing-schedules.service';
import { CreateBillingScheduleDto } from './dto/create-billing-schedule.dto';
import { UpdateBillingScheduleDto } from './dto/update-billing-schedule.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller()
export class FinanceBillingSchedulesController {
  constructor(private readonly schedules: FinanceBillingSchedulesService) {}

  @Get('finance/school-years/:schoolYearId/billing-schedules')
  @CheckPolicies((ability) => ability.can('manage', 'FinanceBillingSchedule'))
  list(
    @CurrentUser() user: AccessTokenPayload,
    @Param('schoolYearId', ParseUUIDPipe) schoolYearId: string,
  ) {
    return this.schedules.list(user.schoolId, schoolYearId);
  }

  @Post('finance/school-years/:schoolYearId/billing-schedules')
  @CheckPolicies((ability) => ability.can('manage', 'FinanceBillingSchedule'))
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Param('schoolYearId', ParseUUIDPipe) schoolYearId: string,
    @Body() dto: CreateBillingScheduleDto,
  ) {
    return this.schedules.create(user.schoolId, schoolYearId, dto);
  }

  @Patch('finance/billing-schedules/:id')
  @CheckPolicies((ability) => ability.can('manage', 'FinanceBillingSchedule'))
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBillingScheduleDto,
  ) {
    return this.schedules.update(user.schoolId, id, dto);
  }

  @Delete('finance/billing-schedules/:id')
  @CheckPolicies((ability) => ability.can('manage', 'FinanceBillingSchedule'))
  remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.schedules.remove(user.schoolId, id);
  }
}
