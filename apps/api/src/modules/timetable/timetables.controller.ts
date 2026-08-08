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
import { TimetablesService } from './timetables.service';
import { CreateTimetableDto } from './dto/create-timetable.dto';
import { UpdateTimetableDto } from './dto/update-timetable.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('timetable-admin/timetables')
export class TimetablesController {
  constructor(private readonly timetables: TimetablesService) {}

  @Get()
  @CheckPolicies((ability) => ability.can('manage', 'Timetable'))
  list(
    @CurrentUser() user: AccessTokenPayload,
    @Query('schoolYearId') schoolYearId?: string,
  ) {
    return this.timetables.list(user.schoolId, schoolYearId);
  }

  @Post()
  @CheckPolicies((ability) => ability.can('manage', 'Timetable'))
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateTimetableDto,
  ) {
    return this.timetables.create(user.schoolId, dto);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can('manage', 'Timetable'))
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTimetableDto,
  ) {
    return this.timetables.update(user.schoolId, id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can('manage', 'Timetable'))
  remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.timetables.remove(user.schoolId, id);
  }
}
