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
import { MarkbookEntriesService } from './markbook-entries.service';
import { UpsertMarkbookEntryDto } from './dto/upsert-markbook-entry.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('markbook/columns/:columnId/entries')
export class MarkbookEntriesController {
  constructor(private readonly entries: MarkbookEntriesService) {}

  /** Full-detail roster for the column - teacher/admin only. */
  @Get()
  @CheckPolicies((ability) => ability.can('manage', 'MarkbookEntry'))
  list(
    @CurrentUser() user: AccessTokenPayload,
    @Param('columnId', ParseUUIDPipe) columnId: string,
  ) {
    return this.entries.listForColumn(user.schoolId, columnId);
  }

  @Post()
  @CheckPolicies((ability) => ability.can('manage', 'MarkbookEntry'))
  upsert(
    @CurrentUser() user: AccessTokenPayload,
    @Param('columnId', ParseUUIDPipe) columnId: string,
    @Body() dto: UpsertMarkbookEntryDto,
  ) {
    return this.entries.upsertEntry(user.schoolId, columnId, dto);
  }

  /**
   * Broadly granted by default (Admin/Teacher/Student/Parent, matching
   * Gibbon's real `View Markbook_myMarks` default) - the guard only checks
   * that the caller has *some* markbook-view grant; the column-level
   * visibility gate itself is enforced in the service, per plan §B.
   */
  @Get(':personId')
  @CheckPolicies((ability) => ability.can('view', 'MarkbookEntry'))
  getOne(
    @CurrentUser() user: AccessTokenPayload,
    @Param('columnId', ParseUUIDPipe) columnId: string,
    @Param('personId', ParseUUIDPipe) personId: string,
  ) {
    return this.entries.getVisibleEntryForCaller(
      user.schoolId,
      columnId,
      personId,
      { personId: user.sub, activeRoleId: user.activeRoleId },
    );
  }
}
