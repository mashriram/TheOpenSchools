import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AccessTokenPayload } from '../auth/access-token-payload';
import { PoliciesGuard } from '../rbac/policies.guard';
import { CheckPolicies } from '../rbac/check-policies.decorator';
import { CalendarEventsService } from './calendar-events.service';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';
import { AddEventParticipantDto } from './dto/add-event-participant.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('calendar/events')
export class CalendarEventsController {
  constructor(private readonly events: CalendarEventsService) {}

  @Get()
  @CheckPolicies((ability) => ability.can('view', 'CalendarEvent'))
  list(
    @CurrentUser() user: AccessTokenPayload,
    @Query('calendarId') calendarId: string,
  ) {
    return this.events.list(user.schoolId, calendarId);
  }

  @Post()
  @CheckPolicies((ability) => ability.can('manage', 'CalendarEvent'))
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Query('calendarId') calendarId: string,
    @Body() dto: CreateCalendarEventDto,
  ) {
    return this.events.create(user.schoolId, calendarId, user.sub, dto);
  }

  // Registered before the generic ':id' delete route below, following the
  // route-ordering lesson learned in Behaviour (M20): a fixed-prefix path
  // segment must be declared first so it isn't shadowed by a same-method
  // dynamic param route.
  @Delete('participants/:id')
  @CheckPolicies((ability) => ability.can('manage', 'CalendarEvent'))
  removeParticipant(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.events.removeParticipant(user.schoolId, id);
  }

  @Get(':id/participants')
  @CheckPolicies((ability) => ability.can('view', 'CalendarEvent'))
  listParticipants(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.events.listParticipants(user.schoolId, id);
  }

  @Post(':id/participants')
  @CheckPolicies((ability) => ability.can('manage', 'CalendarEvent'))
  addParticipant(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddEventParticipantDto,
  ) {
    return this.events.addParticipant(user.schoolId, id, dto);
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.can('view', 'CalendarEvent'))
  getOne(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.events.getOwned(user.schoolId, id);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can('manage', 'CalendarEvent'))
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCalendarEventDto,
  ) {
    return this.events.update(user.schoolId, id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can('manage', 'CalendarEvent'))
  remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.events.remove(user.schoolId, id);
  }
}
