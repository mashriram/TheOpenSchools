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
import { MarkbookWeightsService } from './markbook-weights.service';
import { CreateMarkbookWeightDto } from './dto/create-markbook-weight.dto';
import { UpdateMarkbookWeightDto } from './dto/update-markbook-weight.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller()
export class MarkbookWeightsController {
  constructor(private readonly weights: MarkbookWeightsService) {}

  @Get('curriculum/classes/:courseClassId/markbook/weights')
  @CheckPolicies((ability) => ability.can('manage', 'MarkbookWeight'))
  list(
    @CurrentUser() user: AccessTokenPayload,
    @Param('courseClassId', ParseUUIDPipe) courseClassId: string,
  ) {
    return this.weights.list(user.schoolId, courseClassId);
  }

  @Post('curriculum/classes/:courseClassId/markbook/weights')
  @CheckPolicies((ability) => ability.can('manage', 'MarkbookWeight'))
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Param('courseClassId', ParseUUIDPipe) courseClassId: string,
    @Body() dto: CreateMarkbookWeightDto,
  ) {
    return this.weights.create(user.schoolId, courseClassId, dto);
  }

  @Patch('markbook/weights/:id')
  @CheckPolicies((ability) => ability.can('manage', 'MarkbookWeight'))
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMarkbookWeightDto,
  ) {
    return this.weights.update(user.schoolId, id, dto);
  }

  @Delete('markbook/weights/:id')
  @CheckPolicies((ability) => ability.can('manage', 'MarkbookWeight'))
  remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.weights.remove(user.schoolId, id);
  }
}
