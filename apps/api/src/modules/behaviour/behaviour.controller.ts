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
import { BehaviourService } from './behaviour.service';
import { CreateBehaviourDto } from './dto/create-behaviour.dto';
import { UpdateBehaviourDto } from './dto/update-behaviour.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('behaviour')
export class BehaviourController {
  constructor(private readonly behaviour: BehaviourService) {}

  @Post()
  @CheckPolicies((ability) => ability.can('manage', 'Behaviour'))
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateBehaviourDto,
  ) {
    return this.behaviour.create(user.schoolId, user.sub, dto);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can('manage', 'Behaviour'))
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBehaviourDto,
  ) {
    return this.behaviour.update(user.schoolId, id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can('manage', 'Behaviour'))
  remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.behaviour.remove(user.schoolId, id);
  }

  /**
   * Broadly granted by default (`behaviour.records.view` - Admin/Teacher/
   * Student/Parent). BehaviourService.getVisibleBehaviour() decides
   * summary-vs-detail from the caller's actual relationship to the
   * subject, and denies entirely if there is none - see that method's
   * doc comment.
   */
  // Registered before ':id' - a fixed 'people' path segment must not be
  // captured by the generic :id route.
  @Get('people/:personId')
  @CheckPolicies((ability) => ability.can('view', 'Behaviour'))
  listForPerson(
    @CurrentUser() user: AccessTokenPayload,
    @Param('personId', ParseUUIDPipe) personId: string,
  ) {
    return this.behaviour.listForPerson(
      user.schoolId,
      personId,
      user.sub,
      user.activeRoleId,
    );
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.can('view', 'Behaviour'))
  getOne(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.behaviour.getVisibleBehaviour(
      user.schoolId,
      id,
      user.sub,
      user.activeRoleId,
    );
  }
}
