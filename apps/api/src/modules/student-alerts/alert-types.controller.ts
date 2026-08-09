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
import { AlertTypesService } from './alert-types.service';
import { CreateAlertTypeDto } from './dto/create-alert-type.dto';
import { UpdateAlertTypeDto } from './dto/update-alert-type.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('student-alerts/types')
export class AlertTypesController {
  constructor(private readonly alertTypes: AlertTypesService) {}

  @Get()
  @CheckPolicies((ability) => ability.can('manage', 'AlertType'))
  list(@CurrentUser() user: AccessTokenPayload) {
    return this.alertTypes.list(user.schoolId);
  }

  @Post()
  @CheckPolicies((ability) => ability.can('manage', 'AlertType'))
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateAlertTypeDto,
  ) {
    return this.alertTypes.create(user.schoolId, dto);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can('manage', 'AlertType'))
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAlertTypeDto,
  ) {
    return this.alertTypes.update(user.schoolId, id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can('manage', 'AlertType'))
  remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.alertTypes.remove(user.schoolId, id);
  }
}
