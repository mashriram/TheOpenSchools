import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AccessTokenPayload } from '../auth/access-token-payload';
import { PoliciesGuard } from '../rbac/policies.guard';
import { CheckPolicies } from '../rbac/check-policies.decorator';
import { TimetableReadModelService } from './timetable-read-model.service';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('timetable/schedule')
export class ScheduleController {
  constructor(private readonly readModel: TimetableReadModelService) {}

  @Get()
  @CheckPolicies((ability) => ability.can('view', 'Timetable'))
  async getSchedule(
    @CurrentUser() user: AccessTokenPayload,
    @Query('personId') personId: string,
    @Query('dateStart') dateStart: string,
    @Query('dateEnd') dateEnd: string,
  ) {
    const targetPersonId = personId || user.sub;
    await this.readModel.assertCanViewSchedule(
      user.sub,
      user.activeRoleId,
      targetPersonId,
    );
    return this.readModel.getScheduleForPerson(
      user.schoolId,
      targetPersonId,
      dateStart,
      dateEnd,
    );
  }
}
