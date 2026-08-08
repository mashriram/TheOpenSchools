import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AccessTokenPayload } from '../auth/access-token-payload';
import { PoliciesGuard } from '../rbac/policies.guard';
import { CheckPolicies } from '../rbac/check-policies.decorator';
import { AttendanceCodesService } from './attendance-codes.service';
import { CreateAttendanceCodeDto } from './dto/create-attendance-code.dto';
import { UpdateAttendanceCodeDto } from './dto/update-attendance-code.dto';
import { SetAttendanceCodeRolesDto } from './dto/set-attendance-code-roles.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('attendance/codes')
export class AttendanceCodesController {
  constructor(private readonly codes: AttendanceCodesService) {}

  @Get()
  @CheckPolicies((ability) => ability.can('manage', 'AttendanceCode'))
  list(@CurrentUser() user: AccessTokenPayload) {
    return this.codes.list(user.schoolId);
  }

  @Post()
  @CheckPolicies((ability) => ability.can('manage', 'AttendanceCode'))
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateAttendanceCodeDto,
  ) {
    return this.codes.create(user.schoolId, dto);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can('manage', 'AttendanceCode'))
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAttendanceCodeDto,
  ) {
    return this.codes.update(user.schoolId, id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can('manage', 'AttendanceCode'))
  remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.codes.remove(user.schoolId, id);
  }

  @Put(':id/restricted-roles')
  @CheckPolicies((ability) => ability.can('manage', 'AttendanceCode'))
  setRestrictedRoles(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetAttendanceCodeRolesDto,
  ) {
    return this.codes.setRestrictedRoles(user.schoolId, id, dto.roleIds);
  }

  @Get(':id/restricted-roles')
  @CheckPolicies((ability) => ability.can('manage', 'AttendanceCode'))
  async getRestrictedRoles(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.codes.getOwned(user.schoolId, id);
    return this.codes.listRestrictedRoleIds(id);
  }
}
