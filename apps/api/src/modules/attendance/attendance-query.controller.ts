import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AccessTokenPayload } from '../auth/access-token-payload';
import { PoliciesGuard } from '../rbac/policies.guard';
import { CheckPolicies } from '../rbac/check-policies.decorator';
import { AttendanceRegisterService } from './attendance-register.service';
import { AttendanceAccessService } from './attendance-access.service';
import { PeopleRepository } from '../people/repositories/people.repository';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('attendance/people')
export class AttendanceQueryController {
  constructor(
    private readonly register: AttendanceRegisterService,
    private readonly access: AttendanceAccessService,
    private readonly people: PeopleRepository,
  ) {}

  @Get(':personId')
  @CheckPolicies((ability) => ability.can('view', 'AttendanceLogPerson'))
  async listForPerson(
    @CurrentUser() user: AccessTokenPayload,
    @Param('personId', ParseUUIDPipe) personId: string,
    @Query('dateStart') dateStart: string,
    @Query('dateEnd') dateEnd: string,
  ) {
    const person = await this.people.findOne({
      where: { id: personId, schoolId: user.schoolId },
    });
    if (!person) {
      throw new NotFoundException('Person not found');
    }
    await this.access.assertCanViewAttendance(
      user.sub,
      user.activeRoleId,
      personId,
    );
    return this.register.listForPerson(personId, dateStart, dateEnd);
  }
}
