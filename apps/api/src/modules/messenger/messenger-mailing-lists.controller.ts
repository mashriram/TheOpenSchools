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
import { MessengerMailingListsService } from './messenger-mailing-lists.service';
import { CreateMailingListDto } from './dto/create-mailing-list.dto';
import { UpdateMailingListDto } from './dto/update-mailing-list.dto';
import { AddMailingListRecipientDto } from './dto/add-mailing-list-recipient.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('messenger/mailing-lists')
export class MessengerMailingListsController {
  constructor(private readonly mailingLists: MessengerMailingListsService) {}

  @Get()
  @CheckPolicies((ability) => ability.can('manage', 'MessengerMailingList'))
  list(@CurrentUser() user: AccessTokenPayload) {
    return this.mailingLists.list(user.schoolId);
  }

  @Post()
  @CheckPolicies((ability) => ability.can('manage', 'MessengerMailingList'))
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateMailingListDto,
  ) {
    return this.mailingLists.create(user.schoolId, dto);
  }

  // Registered before the generic ':id' delete route below, following the
  // route-ordering lesson learned in Behaviour (M20)/Calendar (M22).
  @Delete('recipients/:id')
  @CheckPolicies((ability) => ability.can('manage', 'MessengerMailingList'))
  removeRecipient(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.mailingLists.removeRecipient(user.schoolId, id);
  }

  @Get(':id/recipients')
  @CheckPolicies((ability) => ability.can('manage', 'MessengerMailingList'))
  listRecipients(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.mailingLists.listRecipients(user.schoolId, id);
  }

  @Post(':id/recipients')
  @CheckPolicies((ability) => ability.can('manage', 'MessengerMailingList'))
  addRecipient(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddMailingListRecipientDto,
  ) {
    return this.mailingLists.addRecipient(user.schoolId, id, dto.personId);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can('manage', 'MessengerMailingList'))
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMailingListDto,
  ) {
    return this.mailingLists.update(user.schoolId, id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can('manage', 'MessengerMailingList'))
  remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.mailingLists.remove(user.schoolId, id);
  }
}
