import {
  Body,
  Controller,
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
import { BehaviourLettersService } from './behaviour-letters.service';
import { CreateLetterSnapshotDto } from './dto/create-letter-snapshot.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('behaviour/letters')
export class BehaviourLettersController {
  constructor(private readonly letters: BehaviourLettersService) {}

  @Post()
  @CheckPolicies((ability) => ability.can('manage', 'BehaviourLetterSnapshot'))
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateLetterSnapshotDto,
  ) {
    return this.letters.create(user.schoolId, dto);
  }

  // Registered before ':id' - a fixed 'people' path segment must not be
  // captured by the generic :id route.
  @Get('people/:personId')
  @CheckPolicies((ability) => ability.can('view', 'BehaviourLetterSnapshot'))
  listForPerson(
    @CurrentUser() user: AccessTokenPayload,
    @Param('personId', ParseUUIDPipe) personId: string,
  ) {
    return this.letters.listForPerson(user.schoolId, personId);
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.can('view', 'BehaviourLetterSnapshot'))
  getOne(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.letters.getOwned(user.schoolId, id);
  }

  @Get(':id/recipients')
  @CheckPolicies((ability) => ability.can('view', 'BehaviourLetterSnapshot'))
  async listRecipients(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.letters.getOwned(user.schoolId, id);
    return this.letters.listRecipients(id);
  }
}
