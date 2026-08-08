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
import { PoliciesGuard } from './policies.guard';
import { CheckPolicies } from './check-policies.decorator';
import { RbacService } from './rbac.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { SetRolePermissionsDto } from './dto/set-role-permissions.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('rbac')
export class RbacController {
  constructor(private readonly rbac: RbacService) {}

  @Get('actions')
  @CheckPolicies((ability) => ability.can('manage', 'Permission'))
  listActions(@CurrentUser() user: AccessTokenPayload) {
    return this.rbac.listGrantableActions(user.schoolId);
  }

  @Get('roles')
  @CheckPolicies((ability) => ability.can('manage', 'Role'))
  listRoles(@CurrentUser() user: AccessTokenPayload) {
    return this.rbac.listRoles(user.schoolId);
  }

  @Post('roles')
  @CheckPolicies((ability) => ability.can('manage', 'Role'))
  createRole(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateRoleDto,
  ) {
    return this.rbac.createRole(user.schoolId, dto);
  }

  @Patch('roles/:id')
  @CheckPolicies((ability) => ability.can('manage', 'Role'))
  updateRole(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.rbac.updateRole(user.schoolId, id, dto);
  }

  @Delete('roles/:id')
  @CheckPolicies((ability) => ability.can('manage', 'Role'))
  deleteRole(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.rbac.deleteRole(user.schoolId, id);
  }

  @Get('roles/:id/permissions')
  @CheckPolicies((ability) => ability.can('manage', 'Permission'))
  getRolePermissions(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.rbac
      .getRolePermissionActionIds(user.schoolId, id)
      .then((actionIds) => ({
        actionIds,
      }));
  }

  @Put('roles/:id/permissions')
  @CheckPolicies((ability) => ability.can('manage', 'Permission'))
  async setRolePermissions(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetRolePermissionsDto,
  ) {
    await this.rbac.setRolePermissions(user.schoolId, id, dto.actionIds);
    return { actionIds: dto.actionIds };
  }
}
