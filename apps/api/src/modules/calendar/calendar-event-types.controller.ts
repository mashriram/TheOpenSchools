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
import { CalendarEventTypesService } from './calendar-event-types.service';
import { CreateCalendarEventTypeDto } from './dto/create-calendar-event-type.dto';
import { UpdateCalendarEventTypeDto } from './dto/update-calendar-event-type.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('calendar/event-types')
export class CalendarEventTypesController {
  constructor(private readonly eventTypes: CalendarEventTypesService) {}

  @Get()
  @CheckPolicies((ability) => ability.can('view', 'CalendarEvent'))
  list(@CurrentUser() user: AccessTokenPayload) {
    return this.eventTypes.list(user.schoolId);
  }

  @Post()
  @CheckPolicies((ability) => ability.can('manage', 'CalendarEventType'))
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateCalendarEventTypeDto,
  ) {
    return this.eventTypes.create(user.schoolId, dto);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can('manage', 'CalendarEventType'))
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCalendarEventTypeDto,
  ) {
    return this.eventTypes.update(user.schoolId, id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can('manage', 'CalendarEventType'))
  remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.eventTypes.remove(user.schoolId, id);
  }
}
