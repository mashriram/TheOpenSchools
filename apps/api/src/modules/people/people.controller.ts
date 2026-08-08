import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AccessTokenPayload } from '../auth/access-token-payload';
import { PoliciesGuard } from '../rbac/policies.guard';
import { CheckPolicies } from '../rbac/check-policies.decorator';
import { PeopleService } from './people.service';
import { StaffService } from './staff.service';
import { StudentEnrolmentsService } from './student-enrolments.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { UpsertStaffDto } from './dto/upsert-staff.dto';
import { CreateStudentEnrolmentDto } from './dto/create-student-enrolment.dto';
import { UpdateStudentEnrolmentDto } from './dto/update-student-enrolment.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('people')
export class PeopleController {
  constructor(
    private readonly people: PeopleService,
    private readonly staff: StaffService,
    private readonly studentEnrolments: StudentEnrolmentsService,
  ) {}

  @Get()
  @CheckPolicies((ability) => ability.can('view', 'Person'))
  list(
    @CurrentUser() user: AccessTokenPayload,
    @Query('role') role?: string,
    @Query('formGroupId') formGroupId?: string,
  ) {
    return this.people.list(user.schoolId, { role, formGroupId });
  }

  @Post()
  @CheckPolicies((ability) => ability.can('manage', 'Person'))
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreatePersonDto,
  ) {
    return this.people.create(user.schoolId, dto);
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.can('view', 'Person'))
  getProfile(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.people.getProfile(user.schoolId, id);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can('manage', 'Person'))
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePersonDto,
  ) {
    return this.people.update(user.schoolId, id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can('manage', 'Person'))
  remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.people.remove(user.schoolId, id);
  }

  @Put(':id/staff')
  @CheckPolicies((ability) => ability.can('manage', 'Staff'))
  upsertStaff(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertStaffDto,
  ) {
    return this.staff.upsert(user.schoolId, id, dto);
  }

  @Delete(':id/staff')
  @CheckPolicies((ability) => ability.can('manage', 'Staff'))
  removeStaff(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.staff.remove(user.schoolId, id);
  }

  @Get(':id/enrolments')
  @CheckPolicies((ability) => ability.can('view', 'StudentEnrolment'))
  listEnrolments(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.studentEnrolments.list(user.schoolId, id);
  }

  @Post(':id/enrolments')
  @CheckPolicies((ability) => ability.can('manage', 'StudentEnrolment'))
  addEnrolment(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateStudentEnrolmentDto,
  ) {
    return this.studentEnrolments.create(user.schoolId, id, dto);
  }

  @Patch(':id/enrolments/:enrolmentId')
  @CheckPolicies((ability) => ability.can('manage', 'StudentEnrolment'))
  updateEnrolment(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('enrolmentId', ParseUUIDPipe) enrolmentId: string,
    @Body() dto: UpdateStudentEnrolmentDto,
  ) {
    return this.studentEnrolments.update(user.schoolId, id, enrolmentId, dto);
  }

  @Delete(':id/enrolments/:enrolmentId')
  @CheckPolicies((ability) => ability.can('manage', 'StudentEnrolment'))
  removeEnrolment(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('enrolmentId', ParseUUIDPipe) enrolmentId: string,
  ) {
    return this.studentEnrolments.remove(user.schoolId, id, enrolmentId);
  }
}
