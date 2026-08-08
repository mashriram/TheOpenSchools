import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AccessTokenPayload } from '../auth/access-token-payload';
import { PoliciesGuard } from '../rbac/policies.guard';
import { CheckPolicies } from '../rbac/check-policies.decorator';
import { CurrentAbility } from '../rbac/current-ability.decorator';
import type { AppAbility } from '../rbac/casl-ability.factory';
import { IndividualNeedsService } from './individual-needs.service';
import { UpsertIndividualNeedDto } from './dto/upsert-individual-need.dto';
import { SetPersonDescriptorDto } from './dto/set-person-descriptor.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('individual-needs/people/:personId')
export class IndividualNeedsController {
  constructor(private readonly individualNeeds: IndividualNeedsService) {}

  /**
   * Broadly granted by default (`individualNeeds.summary.view` - Admin +
   * Teacher). The guard only confirms the caller has *some* Individual
   * Needs view grant; IndividualNeedsService.getForCaller() decides
   * summary-vs-detail from the caller's real ability, fixing Gibbon's
   * read-side gap (see individual-needs-view.dto.ts).
   */
  @Get()
  @CheckPolicies((ability) => ability.can('view', 'IndividualNeedSummary'))
  getForPerson(
    @CurrentUser() user: AccessTokenPayload,
    @CurrentAbility() ability: AppAbility,
    @Param('personId', ParseUUIDPipe) personId: string,
  ) {
    return this.individualNeeds.getForCaller(user.schoolId, personId, ability);
  }

  @Put()
  @CheckPolicies((ability) => ability.can('manage', 'IndividualNeed'))
  upsert(
    @CurrentUser() user: AccessTokenPayload,
    @Param('personId', ParseUUIDPipe) personId: string,
    @Body() dto: UpsertIndividualNeedDto,
  ) {
    return this.individualNeeds.upsert(user.schoolId, personId, dto);
  }

  @Put('descriptors')
  @CheckPolicies((ability) => ability.can('manage', 'IndividualNeed'))
  setDescriptor(
    @CurrentUser() user: AccessTokenPayload,
    @Param('personId', ParseUUIDPipe) personId: string,
    @Body() dto: SetPersonDescriptorDto,
  ) {
    return this.individualNeeds.setDescriptor(user.schoolId, personId, dto);
  }
}

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('individual-needs/descriptors')
export class IndividualNeedDescriptorsController {
  constructor(private readonly individualNeeds: IndividualNeedsService) {}

  @Delete(':id')
  @CheckPolicies((ability) => ability.can('manage', 'IndividualNeed'))
  remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.individualNeeds.removeDescriptor(user.schoolId, id);
  }
}
