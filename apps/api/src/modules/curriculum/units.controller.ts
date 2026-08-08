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
import { UnitsService } from './units.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';

// See CourseClassesController's comment: two route families, one controller.
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('curriculum')
export class UnitsController {
  constructor(private readonly units: UnitsService) {}

  @Get('courses/:courseId/units')
  @CheckPolicies((ability) => ability.can('manage', 'Unit'))
  list(
    @CurrentUser() user: AccessTokenPayload,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ) {
    return this.units.list(user.schoolId, courseId);
  }

  @Post('courses/:courseId/units')
  @CheckPolicies((ability) => ability.can('manage', 'Unit'))
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: CreateUnitDto,
  ) {
    return this.units.create(user.schoolId, courseId, dto);
  }

  @Patch('units/:id')
  @CheckPolicies((ability) => ability.can('manage', 'Unit'))
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUnitDto,
  ) {
    return this.units.update(user.schoolId, id, dto);
  }

  @Delete('units/:id')
  @CheckPolicies((ability) => ability.can('manage', 'Unit'))
  remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.units.remove(user.schoolId, id);
  }
}
