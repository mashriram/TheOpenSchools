import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AccessTokenPayload } from '../auth/access-token-payload';
import { PoliciesGuard } from '../rbac/policies.guard';
import { CheckPolicies } from '../rbac/check-policies.decorator';
import { MyScheduleService } from './my-schedule.service';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('me/schedule')
export class MyScheduleController {
  constructor(private readonly mySchedule: MyScheduleService) {}

  @Get()
  @CheckPolicies((ability) => ability.can('view', 'Timetable'))
  getMergedSchedule(
    @CurrentUser() user: AccessTokenPayload,
    @Query('schoolYearId') schoolYearId: string,
    @Query('personId') personId: string,
    @Query('dateStart') dateStart: string,
    @Query('dateEnd') dateEnd: string,
  ) {
    const targetPersonId = personId || user.sub;
    return this.mySchedule.getMergedSchedule(
      user.schoolId,
      schoolYearId,
      targetPersonId,
      user.sub,
      user.activeRoleId,
      dateStart,
      dateEnd,
    );
  }
}
