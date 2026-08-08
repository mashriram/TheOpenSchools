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
import { MarkbookColumnsService } from './markbook-columns.service';
import { CreateMarkbookColumnDto } from './dto/create-markbook-column.dto';
import { UpdateMarkbookColumnDto } from './dto/update-markbook-column.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller()
export class MarkbookColumnsController {
  constructor(private readonly columns: MarkbookColumnsService) {}

  @Get('curriculum/classes/:courseClassId/markbook/columns')
  @CheckPolicies((ability) => ability.can('manage', 'MarkbookColumn'))
  list(
    @CurrentUser() user: AccessTokenPayload,
    @Param('courseClassId', ParseUUIDPipe) courseClassId: string,
  ) {
    return this.columns.list(user.schoolId, courseClassId);
  }

  @Post('curriculum/classes/:courseClassId/markbook/columns')
  @CheckPolicies((ability) => ability.can('manage', 'MarkbookColumn'))
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Param('courseClassId', ParseUUIDPipe) courseClassId: string,
    @Body() dto: CreateMarkbookColumnDto,
  ) {
    return this.columns.create(user.schoolId, courseClassId, dto);
  }

  @Patch('markbook/columns/:id')
  @CheckPolicies((ability) => ability.can('manage', 'MarkbookColumn'))
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMarkbookColumnDto,
  ) {
    return this.columns.update(user.schoolId, id, dto);
  }

  @Delete('markbook/columns/:id')
  @CheckPolicies((ability) => ability.can('manage', 'MarkbookColumn'))
  remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.columns.remove(user.schoolId, id);
  }
}
