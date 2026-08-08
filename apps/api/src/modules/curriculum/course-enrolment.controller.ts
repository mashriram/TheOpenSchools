import {
  Body,
  Controller,
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
import { CourseEnrolmentService } from './course-enrolment.service';
import { EnrolPersonDto } from './dto/enrol-person.dto';
import { UpdateEnrolmentDto } from './dto/update-enrolment.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('curriculum/classes/:courseClassId/enrolments')
export class CourseEnrolmentController {
  constructor(private readonly enrolment: CourseEnrolmentService) {}

  @Get()
  @CheckPolicies((ability) => ability.can('manage', 'CourseClassPerson'))
  list(
    @CurrentUser() user: AccessTokenPayload,
    @Param('courseClassId', ParseUUIDPipe) courseClassId: string,
  ) {
    return this.enrolment.list(user.schoolId, courseClassId);
  }

  @Post()
  @CheckPolicies((ability) => ability.can('manage', 'CourseClassPerson'))
  enrol(
    @CurrentUser() user: AccessTokenPayload,
    @Param('courseClassId', ParseUUIDPipe) courseClassId: string,
    @Body() dto: EnrolPersonDto,
  ) {
    return this.enrolment.enrol(user.schoolId, courseClassId, dto);
  }

  @Patch(':enrolmentId')
  @CheckPolicies((ability) => ability.can('manage', 'CourseClassPerson'))
  updateRole(
    @CurrentUser() user: AccessTokenPayload,
    @Param('courseClassId', ParseUUIDPipe) courseClassId: string,
    @Param('enrolmentId', ParseUUIDPipe) enrolmentId: string,
    @Body() dto: UpdateEnrolmentDto,
  ) {
    return this.enrolment.updateRole(
      user.schoolId,
      courseClassId,
      enrolmentId,
      dto,
    );
  }

  @Post(':enrolmentId/unenrol')
  @CheckPolicies((ability) => ability.can('manage', 'CourseClassPerson'))
  unenrol(
    @CurrentUser() user: AccessTokenPayload,
    @Param('courseClassId', ParseUUIDPipe) courseClassId: string,
    @Param('enrolmentId', ParseUUIDPipe) enrolmentId: string,
  ) {
    return this.enrolment.unenrol(user.schoolId, courseClassId, enrolmentId);
  }
}
