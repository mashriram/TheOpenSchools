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
import { MessengerService } from './messenger.service';
import { MessengerReceiptsService } from './messenger-receipts.service';
import { MessengerRetentionService } from './messenger-retention.service';
import { CreateMessengerDto } from './dto/create-messenger.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('messenger')
export class MessengerController {
  constructor(
    private readonly messenger: MessengerService,
    private readonly receipts: MessengerReceiptsService,
    private readonly retention: MessengerRetentionService,
  ) {}

  @Get()
  @CheckPolicies((ability) => ability.can('manage', 'Messenger'))
  list(@CurrentUser() user: AccessTokenPayload) {
    return this.messenger.list(user.schoolId);
  }

  @Post()
  @CheckPolicies((ability) => ability.can('manage', 'Messenger'))
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateMessengerDto,
  ) {
    return this.messenger.create(user.schoolId, user.sub, dto);
  }

  // Registered before the generic ':id' routes below, following the
  // route-ordering lesson learned in Behaviour (M20)/Calendar (M22): a
  // fixed-prefix path segment must be declared first.
  @Post('retention/scrub')
  @CheckPolicies((ability) => ability.can('manage', 'Messenger'))
  scrubExpired(@CurrentUser() user: AccessTokenPayload) {
    return this.retention.scrubExpiredMessages(user.schoolId);
  }

  @Get(':id/receipts')
  @CheckPolicies((ability) => ability.can('manage', 'Messenger'))
  listReceipts(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.receipts.list(user.schoolId, id);
  }

  // No @CheckPolicies: confirming a receipt is inherently self-scoped -
  // the service only ever confirms the caller's own MessengerReceipt row
  // (looked up by their own personId, never a body/query param), so there
  // is no broader "Messenger" grant to check. Any authenticated recipient
  // can confirm their own receipt.
  @Post(':id/receipts/confirm')
  confirmReceipt(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.receipts.confirm(user.schoolId, id, user.sub);
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.can('manage', 'Messenger'))
  getOne(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.messenger.getOwned(user.schoolId, id);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can('manage', 'Messenger'))
  remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.messenger.remove(user.schoolId, id);
  }
}
