import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AccessTokenPayload } from '../auth/access-token-payload';
import { PoliciesGuard } from '../rbac/policies.guard';
import { CheckPolicies } from '../rbac/check-policies.decorator';
import { FormGroupsService } from './form-groups.service';
import { FormGroupStaffService } from './form-group-staff.service';
import { CreateFormGroupDto } from './dto/create-form-group.dto';
import { UpdateFormGroupDto } from './dto/update-form-group.dto';
import { AddFormGroupStaffDto } from './dto/add-form-group-staff.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('school-admin/form-groups')
export class FormGroupsController {
  constructor(
    private readonly formGroups: FormGroupsService,
    private readonly formGroupStaff: FormGroupStaffService,
  ) {}

  @Get()
  @CheckPolicies((ability) => ability.can('manage', 'FormGroup'))
  list(
    @CurrentUser() user: AccessTokenPayload,
    @Query('schoolYearId', ParseUUIDPipe) schoolYearId: string,
  ) {
    return this.formGroups.listBySchoolYear(user.schoolId, schoolYearId);
  }

  @Post()
  @CheckPolicies((ability) => ability.can('manage', 'FormGroup'))
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateFormGroupDto,
  ) {
    return this.formGroups.create(user.schoolId, dto);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can('manage', 'FormGroup'))
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFormGroupDto,
  ) {
    return this.formGroups.update(user.schoolId, id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can('manage', 'FormGroup'))
  remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.formGroups.remove(user.schoolId, id);
  }

  @Get(':id/staff')
  @CheckPolicies((ability) => ability.can('manage', 'FormGroup'))
  listStaff(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.formGroupStaff.list(user.schoolId, id);
  }

  @Post(':id/staff')
  @CheckPolicies((ability) => ability.can('manage', 'FormGroup'))
  addStaff(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddFormGroupStaffDto,
  ) {
    return this.formGroupStaff.add(user.schoolId, id, dto);
  }

  @Delete(':id/staff/:staffId')
  @CheckPolicies((ability) => ability.can('manage', 'FormGroup'))
  removeStaff(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('staffId', ParseUUIDPipe) staffId: string,
  ) {
    return this.formGroupStaff.remove(user.schoolId, id, staffId);
  }
}
