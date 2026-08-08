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
import { MarkbookTargetsService } from './markbook-targets.service';
import { CreateMarkbookTargetDto } from './dto/create-markbook-target.dto';
import { UpdateMarkbookTargetDto } from './dto/update-markbook-target.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller()
export class MarkbookTargetsController {
  constructor(private readonly targets: MarkbookTargetsService) {}

  @Get('curriculum/classes/:courseClassId/markbook/targets')
  @CheckPolicies((ability) => ability.can('manage', 'MarkbookTarget'))
  list(
    @CurrentUser() user: AccessTokenPayload,
    @Param('courseClassId', ParseUUIDPipe) courseClassId: string,
  ) {
    return this.targets.list(user.schoolId, courseClassId);
  }

  @Post('curriculum/classes/:courseClassId/markbook/targets')
  @CheckPolicies((ability) => ability.can('manage', 'MarkbookTarget'))
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Param('courseClassId', ParseUUIDPipe) courseClassId: string,
    @Body() dto: CreateMarkbookTargetDto,
  ) {
    return this.targets.create(user.schoolId, courseClassId, dto);
  }

  @Patch('markbook/targets/:id')
  @CheckPolicies((ability) => ability.can('manage', 'MarkbookTarget'))
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMarkbookTargetDto,
  ) {
    return this.targets.update(user.schoolId, id, dto);
  }

  @Delete('markbook/targets/:id')
  @CheckPolicies((ability) => ability.can('manage', 'MarkbookTarget'))
  remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.targets.remove(user.schoolId, id);
  }
}
