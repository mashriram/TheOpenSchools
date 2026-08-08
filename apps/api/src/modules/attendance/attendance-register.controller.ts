import {
  Body,
  Controller,
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
import { AttendanceRegisterService } from './attendance-register.service';
import { RecordRegisterDto } from './dto/record-register.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller()
export class AttendanceRegisterController {
  constructor(private readonly register: AttendanceRegisterService) {}

  @Post('attendance/form-groups/:formGroupId/registers')
  @CheckPolicies((ability) => ability.can('manage', 'AttendanceLogFormGroup'))
  recordForFormGroup(
    @CurrentUser() user: AccessTokenPayload,
    @Param('formGroupId', ParseUUIDPipe) formGroupId: string,
    @Body() dto: RecordRegisterDto,
  ) {
    return this.register.recordForFormGroup(
      user.schoolId,
      formGroupId,
      { personId: user.sub, activeRoleId: user.activeRoleId },
      dto,
    );
  }

  @Post('curriculum/classes/:courseClassId/attendance/registers')
  @CheckPolicies((ability) => ability.can('manage', 'AttendanceLogCourseClass'))
  recordForCourseClass(
    @CurrentUser() user: AccessTokenPayload,
    @Param('courseClassId', ParseUUIDPipe) courseClassId: string,
    @Body() dto: RecordRegisterDto,
  ) {
    return this.register.recordForCourseClass(
      user.schoolId,
      courseClassId,
      { personId: user.sub, activeRoleId: user.activeRoleId },
      dto,
    );
  }
}
