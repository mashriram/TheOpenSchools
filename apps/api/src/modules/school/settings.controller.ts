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
import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('school-admin/settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  @CheckPolicies((ability) => ability.can('manage', 'Setting'))
  list(@CurrentUser() user: AccessTokenPayload) {
    return this.settings.list(user.schoolId);
  }

  @Post()
  @CheckPolicies((ability) => ability.can('manage', 'Setting'))
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateSettingDto,
  ) {
    return this.settings.create(user.schoolId, dto);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can('manage', 'Setting'))
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSettingDto,
  ) {
    return this.settings.update(user.schoolId, id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can('manage', 'Setting'))
  remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.settings.remove(user.schoolId, id);
  }
}
