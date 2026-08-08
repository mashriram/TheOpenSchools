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
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('school-admin/departments')
export class DepartmentsController {
  constructor(private readonly departments: DepartmentsService) {}

  @Get()
  @CheckPolicies((ability) => ability.can('view', 'Department'))
  list(@CurrentUser() user: AccessTokenPayload) {
    return this.departments.list(user.schoolId);
  }

  @Post()
  @CheckPolicies((ability) => ability.can('manage', 'Department'))
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateDepartmentDto,
  ) {
    return this.departments.create(user.schoolId, dto);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can('manage', 'Department'))
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.departments.update(user.schoolId, id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can('manage', 'Department'))
  remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.departments.remove(user.schoolId, id);
  }
}
