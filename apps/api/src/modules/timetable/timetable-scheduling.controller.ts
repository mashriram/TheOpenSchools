import {
  Body,
  Controller,
  Delete,
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
import { TimetableSchedulingService } from './timetable-scheduling.service';
import { ScheduleClassDto } from './dto/schedule-class.dto';
import { UpdateScheduledClassSpaceDto } from './dto/update-scheduled-class-space.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('timetable-admin/scheduled-classes')
export class TimetableSchedulingController {
  constructor(private readonly scheduling: TimetableSchedulingService) {}

  @Post()
  @CheckPolicies((ability) => ability.can('manage', 'TimetableDayRowClass'))
  scheduleClass(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: ScheduleClassDto,
  ) {
    return this.scheduling.scheduleClass(user.schoolId, dto);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can('manage', 'TimetableDayRowClass'))
  updateSpace(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateScheduledClassSpaceDto,
  ) {
    return this.scheduling.updateSpace(user.schoolId, id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can('manage', 'TimetableDayRowClass'))
  unscheduleClass(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.scheduling.unscheduleClass(user.schoolId, id);
  }
}
