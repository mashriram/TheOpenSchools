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
import { TimetableDaysService } from './timetable-days.service';
import { CreateTimetableDayDto } from './dto/create-timetable-day.dto';
import { UpdateTimetableDayDto } from './dto/update-timetable-day.dto';
import { MapTimetableDayDateDto } from './dto/map-timetable-day-date.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('timetable-admin')
export class TimetableDaysController {
  constructor(private readonly days: TimetableDaysService) {}

  @Get('timetables/:timetableId/days')
  @CheckPolicies((ability) => ability.can('manage', 'TimetableDay'))
  list(@Param('timetableId', ParseUUIDPipe) timetableId: string) {
    return this.days.list(timetableId);
  }

  @Post('timetables/:timetableId/days')
  @CheckPolicies((ability) => ability.can('manage', 'TimetableDay'))
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Param('timetableId', ParseUUIDPipe) timetableId: string,
    @Body() dto: CreateTimetableDayDto,
  ) {
    return this.days.create(user.schoolId, timetableId, dto);
  }

  @Patch('days/:id')
  @CheckPolicies((ability) => ability.can('manage', 'TimetableDay'))
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTimetableDayDto,
  ) {
    return this.days.update(user.schoolId, id, dto);
  }

  @Delete('days/:id')
  @CheckPolicies((ability) => ability.can('manage', 'TimetableDay'))
  remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.days.remove(user.schoolId, id);
  }

  @Get('days/:dayId/dates')
  @CheckPolicies((ability) => ability.can('manage', 'TimetableDay'))
  listDates(@Param('dayId', ParseUUIDPipe) dayId: string) {
    return this.days.listDates(dayId);
  }

  @Post('days/:dayId/dates')
  @CheckPolicies((ability) => ability.can('manage', 'TimetableDay'))
  mapDate(
    @CurrentUser() user: AccessTokenPayload,
    @Param('dayId', ParseUUIDPipe) dayId: string,
    @Body() dto: MapTimetableDayDateDto,
  ) {
    return this.days.mapDate(user.schoolId, dayId, dto.date);
  }

  @Delete('dates/:dayDateId')
  @CheckPolicies((ability) => ability.can('manage', 'TimetableDay'))
  unmapDate(
    @CurrentUser() user: AccessTokenPayload,
    @Param('dayDateId', ParseUUIDPipe) dayDateId: string,
  ) {
    return this.days.unmapDate(user.schoolId, dayDateId);
  }
}
