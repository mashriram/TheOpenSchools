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
import { IndividualNeedInvestigationsService } from './individual-need-investigations.service';
import { CreateInvestigationDto } from './dto/create-investigation.dto';
import { UpdateInvestigationDto } from './dto/update-investigation.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('individual-needs')
export class IndividualNeedInvestigationsController {
  constructor(
    private readonly investigations: IndividualNeedInvestigationsService,
  ) {}

  @Get('people/:personId/investigations')
  @CheckPolicies((ability) =>
    ability.can('manage', 'IndividualNeedInvestigation'),
  )
  listForStudent(
    @CurrentUser() user: AccessTokenPayload,
    @Param('personId', ParseUUIDPipe) personId: string,
  ) {
    return this.investigations.listForStudent(user.schoolId, personId);
  }

  @Post('investigations')
  @CheckPolicies((ability) =>
    ability.can('manage', 'IndividualNeedInvestigation'),
  )
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateInvestigationDto,
  ) {
    return this.investigations.create(user.schoolId, user.sub, dto);
  }

  @Get('investigations/:id')
  @CheckPolicies((ability) =>
    ability.can('manage', 'IndividualNeedInvestigation'),
  )
  getOne(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.investigations.getOwned(user.schoolId, id);
  }

  @Patch('investigations/:id')
  @CheckPolicies((ability) =>
    ability.can('manage', 'IndividualNeedInvestigation'),
  )
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInvestigationDto,
  ) {
    return this.investigations.update(user.schoolId, id, dto);
  }
}
