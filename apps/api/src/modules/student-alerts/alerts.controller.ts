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
import { CurrentAbility } from '../rbac/current-ability.decorator';
import type { AppAbility } from '../rbac/casl-ability.factory';
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('student-alerts')
export class AlertsController {
  constructor(private readonly alerts: AlertsService) {}

  @Post()
  @CheckPolicies((ability) => ability.can('manage', 'Alert'))
  create(
    @CurrentUser() user: AccessTokenPayload,
    @CurrentAbility() ability: AppAbility,
    @Body() dto: CreateAlertDto,
  ) {
    return this.alerts.create(user.schoolId, user.sub, ability, dto);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can('manage', 'Alert'))
  update(
    @CurrentUser() user: AccessTokenPayload,
    @CurrentAbility() ability: AppAbility,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAlertDto,
  ) {
    return this.alerts.update(user.schoolId, id, user.sub, ability, dto);
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.can('view', 'Alert'))
  getOne(
    @CurrentUser() user: AccessTokenPayload,
    @CurrentAbility() ability: AppAbility,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.alerts.getVisibleAlert(user.schoolId, id, ability);
  }

  @Get('people/:personId')
  @CheckPolicies((ability) => ability.can('view', 'Alert'))
  listForPerson(
    @CurrentUser() user: AccessTokenPayload,
    @CurrentAbility() ability: AppAbility,
    @Param('personId', ParseUUIDPipe) personId: string,
  ) {
    return this.alerts.listForPerson(user.schoolId, personId, ability);
  }

  @Get('people/:personId/badges')
  @CheckPolicies((ability) => ability.can('view', 'Alert'))
  getBadgesForPerson(
    @CurrentUser() user: AccessTokenPayload,
    @CurrentAbility() ability: AppAbility,
    @Param('personId', ParseUUIDPipe) personId: string,
  ) {
    return this.alerts.getBadgesForPerson(user.schoolId, personId, ability);
  }
}
