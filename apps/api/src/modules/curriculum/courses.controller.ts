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
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('curriculum/courses')
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  @Get()
  @CheckPolicies((ability) => ability.can('manage', 'Course'))
  list(
    @CurrentUser() user: AccessTokenPayload,
    @Query('schoolYearId') schoolYearId?: string,
  ) {
    return this.courses.list(user.schoolId, schoolYearId);
  }

  @Post()
  @CheckPolicies((ability) => ability.can('manage', 'Course'))
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateCourseDto,
  ) {
    return this.courses.create(user.schoolId, dto);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can('manage', 'Course'))
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.courses.update(user.schoolId, id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can('manage', 'Course'))
  remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.courses.remove(user.schoolId, id);
  }
}
