import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AccessTokenPayload } from '../auth/access-token-payload';
import { PoliciesGuard } from '../rbac/policies.guard';
import { CheckPolicies } from '../rbac/check-policies.decorator';
import { BehaviourFollowUpsService } from './behaviour-follow-ups.service';
import { CreateFollowUpDto } from './dto/create-follow-up.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('behaviour/:behaviourId/follow-ups')
export class BehaviourFollowUpsController {
  constructor(private readonly followUps: BehaviourFollowUpsService) {}

  @Get()
  @CheckPolicies((ability) => ability.can('manage', 'BehaviourFollowUp'))
  list(
    @CurrentUser() user: AccessTokenPayload,
    @Param('behaviourId', ParseUUIDPipe) behaviourId: string,
  ) {
    return this.followUps.list(user.schoolId, behaviourId);
  }

  @Post()
  @CheckPolicies((ability) => ability.can('manage', 'BehaviourFollowUp'))
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Param('behaviourId', ParseUUIDPipe) behaviourId: string,
    @Body() dto: CreateFollowUpDto,
  ) {
    return this.followUps.create(user.schoolId, behaviourId, user.sub, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can('manage', 'BehaviourFollowUp'))
  remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.followUps.remove(user.schoolId, id);
  }
}
