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
import { MessengerCannedResponsesService } from './messenger-canned-responses.service';
import { CreateCannedResponseDto } from './dto/create-canned-response.dto';
import { UpdateCannedResponseDto } from './dto/update-canned-response.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('messenger/canned-responses')
export class MessengerCannedResponsesController {
  constructor(
    private readonly cannedResponses: MessengerCannedResponsesService,
  ) {}

  @Get()
  @CheckPolicies((ability) => ability.can('manage', 'MessengerCannedResponse'))
  list(@CurrentUser() user: AccessTokenPayload) {
    return this.cannedResponses.list(user.schoolId);
  }

  @Post()
  @CheckPolicies((ability) => ability.can('manage', 'MessengerCannedResponse'))
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateCannedResponseDto,
  ) {
    return this.cannedResponses.create(user.schoolId, dto);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can('manage', 'MessengerCannedResponse'))
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCannedResponseDto,
  ) {
    return this.cannedResponses.update(user.schoolId, id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can('manage', 'MessengerCannedResponse'))
  remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.cannedResponses.remove(user.schoolId, id);
  }
}
