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
import { CourseClassesService } from './course-classes.service';
import { CreateCourseClassDto } from './dto/create-course-class.dto';
import { UpdateCourseClassDto } from './dto/update-course-class.dto';

// Two route families live on one controller (nested under a course, and
// standalone by class id) since a CourseClass's canonical identity is its
// own id, not a path segment under its parent - matching RbacController's
// precedent of multiple route families under one @Controller() prefix.
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('curriculum')
export class CourseClassesController {
  constructor(private readonly courseClasses: CourseClassesService) {}

  @Get('courses/:courseId/classes')
  @CheckPolicies((ability) => ability.can('manage', 'CourseClass'))
  list(
    @CurrentUser() user: AccessTokenPayload,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ) {
    return this.courseClasses.list(user.schoolId, courseId);
  }

  @Post('courses/:courseId/classes')
  @CheckPolicies((ability) => ability.can('manage', 'CourseClass'))
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: CreateCourseClassDto,
  ) {
    return this.courseClasses.create(user.schoolId, courseId, dto);
  }

  @Patch('classes/:id')
  @CheckPolicies((ability) => ability.can('manage', 'CourseClass'))
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCourseClassDto,
  ) {
    return this.courseClasses.update(user.schoolId, id, dto);
  }

  @Delete('classes/:id')
  @CheckPolicies((ability) => ability.can('manage', 'CourseClass'))
  remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.courseClasses.remove(user.schoolId, id);
  }
}
