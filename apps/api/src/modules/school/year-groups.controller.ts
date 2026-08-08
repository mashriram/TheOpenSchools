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
import { YearGroupsService } from './year-groups.service';
import { CreateYearGroupDto } from './dto/create-year-group.dto';
import { UpdateYearGroupDto } from './dto/update-year-group.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('school-admin/year-groups')
export class YearGroupsController {
  constructor(private readonly yearGroups: YearGroupsService) {}

  @Get()
  @CheckPolicies((ability) => ability.can('manage', 'YearGroup'))
  list(@CurrentUser() user: AccessTokenPayload) {
    return this.yearGroups.list(user.schoolId);
  }

  @Post()
  @CheckPolicies((ability) => ability.can('manage', 'YearGroup'))
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateYearGroupDto,
  ) {
    return this.yearGroups.create(user.schoolId, dto);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can('manage', 'YearGroup'))
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateYearGroupDto,
  ) {
    return this.yearGroups.update(user.schoolId, id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can('manage', 'YearGroup'))
  remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.yearGroups.remove(user.schoolId, id);
  }
}
