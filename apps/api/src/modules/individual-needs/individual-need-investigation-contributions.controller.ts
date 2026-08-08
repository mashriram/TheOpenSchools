import {
  Body,
  Controller,
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
import { IndividualNeedInvestigationContributionsService } from './individual-need-investigation-contributions.service';
import { CreateContributionDto } from './dto/create-contribution.dto';
import { UpdateContributionDto } from './dto/update-contribution.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller()
export class IndividualNeedInvestigationContributionsController {
  constructor(
    private readonly contributions: IndividualNeedInvestigationContributionsService,
  ) {}

  @Get('individual-needs/investigations/:investigationId/contributions')
  @CheckPolicies((ability) =>
    ability.can('manage', 'IndividualNeedInvestigation'),
  )
  list(
    @CurrentUser() user: AccessTokenPayload,
    @Param('investigationId', ParseUUIDPipe) investigationId: string,
  ) {
    return this.contributions.list(user.schoolId, investigationId);
  }

  @Post('individual-needs/investigations/:investigationId/contributions')
  @CheckPolicies((ability) =>
    ability.can('manage', 'IndividualNeedInvestigation'),
  )
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Param('investigationId', ParseUUIDPipe) investigationId: string,
    @Body() dto: CreateContributionDto,
  ) {
    return this.contributions.create(user.schoolId, investigationId, dto);
  }

  @Patch('individual-needs/contributions/:id')
  @CheckPolicies((ability) =>
    ability.can('manage', 'IndividualNeedInvestigation'),
  )
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContributionDto,
  ) {
    return this.contributions.update(user.schoolId, id, dto);
  }
}
