import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AccessTokenPayload } from '../auth/access-token-payload';
import { PoliciesGuard } from '../rbac/policies.guard';
import { CheckPolicies } from '../rbac/check-policies.decorator';
import { CalendarsService } from './calendars.service';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { UpdateCalendarDto } from './dto/update-calendar.dto';
import { AddCalendarEditorDto } from './dto/add-calendar-editor.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('calendar/calendars')
export class CalendarsController {
  constructor(private readonly calendars: CalendarsService) {}

  @Get()
  @CheckPolicies((ability) => ability.can('view', 'CalendarEvent'))
  list(
    @CurrentUser() user: AccessTokenPayload,
    @Query('schoolYearId') schoolYearId: string,
  ) {
    return this.calendars.list(user.schoolId, schoolYearId);
  }

  @Post()
  @CheckPolicies((ability) => ability.can('manage', 'Calendar'))
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Query('schoolYearId') schoolYearId: string,
    @Body() dto: CreateCalendarDto,
  ) {
    return this.calendars.create(user.schoolId, schoolYearId, dto);
  }

  @Get(':id/editors')
  @CheckPolicies((ability) => ability.can('manage', 'Calendar'))
  listEditors(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.calendars.listEditors(user.schoolId, id);
  }

  @Post(':id/editors')
  @CheckPolicies((ability) => ability.can('manage', 'Calendar'))
  addEditor(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddCalendarEditorDto,
  ) {
    return this.calendars.addEditor(
      user.schoolId,
      id,
      dto.personId,
      dto.editAllEvents ?? false,
    );
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can('manage', 'Calendar'))
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCalendarDto,
  ) {
    return this.calendars.update(user.schoolId, id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can('manage', 'Calendar'))
  remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.calendars.remove(user.schoolId, id);
  }
}
