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
import { TimetableColumnsService } from './timetable-columns.service';
import { CreateTimetableColumnDto } from './dto/create-timetable-column.dto';
import { UpdateTimetableColumnDto } from './dto/update-timetable-column.dto';
import { CreateTimetableColumnRowDto } from './dto/create-timetable-column-row.dto';
import { UpdateTimetableColumnRowDto } from './dto/update-timetable-column-row.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('timetable-admin/columns')
export class TimetableColumnsController {
  constructor(private readonly columns: TimetableColumnsService) {}

  @Get()
  @CheckPolicies((ability) => ability.can('manage', 'TimetableColumn'))
  list(@CurrentUser() user: AccessTokenPayload) {
    return this.columns.list(user.schoolId);
  }

  @Post()
  @CheckPolicies((ability) => ability.can('manage', 'TimetableColumn'))
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateTimetableColumnDto,
  ) {
    return this.columns.create(user.schoolId, dto);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can('manage', 'TimetableColumn'))
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTimetableColumnDto,
  ) {
    return this.columns.update(user.schoolId, id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can('manage', 'TimetableColumn'))
  remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.columns.remove(user.schoolId, id);
  }

  @Get(':columnId/rows')
  @CheckPolicies((ability) => ability.can('manage', 'TimetableColumn'))
  listRows(@Param('columnId', ParseUUIDPipe) columnId: string) {
    return this.columns.listRows(columnId);
  }

  @Post(':columnId/rows')
  @CheckPolicies((ability) => ability.can('manage', 'TimetableColumn'))
  addRow(
    @CurrentUser() user: AccessTokenPayload,
    @Param('columnId', ParseUUIDPipe) columnId: string,
    @Body() dto: CreateTimetableColumnRowDto,
  ) {
    return this.columns.addRow(user.schoolId, columnId, dto);
  }

  @Patch('rows/:rowId')
  @CheckPolicies((ability) => ability.can('manage', 'TimetableColumn'))
  updateRow(
    @CurrentUser() user: AccessTokenPayload,
    @Param('rowId', ParseUUIDPipe) rowId: string,
    @Body() dto: UpdateTimetableColumnRowDto,
  ) {
    return this.columns.updateRow(user.schoolId, rowId, dto);
  }

  @Delete('rows/:rowId')
  @CheckPolicies((ability) => ability.can('manage', 'TimetableColumn'))
  removeRow(
    @CurrentUser() user: AccessTokenPayload,
    @Param('rowId', ParseUUIDPipe) rowId: string,
  ) {
    return this.columns.removeRow(user.schoolId, rowId);
  }
}
