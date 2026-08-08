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
import { ScaleGradesService } from './scale-grades.service';
import { CreateScaleGradeDto } from './dto/create-scale-grade.dto';
import { UpdateScaleGradeDto } from './dto/update-scale-grade.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('markbook')
export class ScaleGradesController {
  constructor(private readonly scaleGrades: ScaleGradesService) {}

  @Get('scales/:scaleId/grades')
  @CheckPolicies((ability) => ability.can('manage', 'Scale'))
  list(
    @CurrentUser() user: AccessTokenPayload,
    @Param('scaleId', ParseUUIDPipe) scaleId: string,
  ) {
    return this.scaleGrades.list(user.schoolId, scaleId);
  }

  @Post('scales/:scaleId/grades')
  @CheckPolicies((ability) => ability.can('manage', 'Scale'))
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Param('scaleId', ParseUUIDPipe) scaleId: string,
    @Body() dto: CreateScaleGradeDto,
  ) {
    return this.scaleGrades.create(user.schoolId, scaleId, dto);
  }

  @Patch('grades/:id')
  @CheckPolicies((ability) => ability.can('manage', 'Scale'))
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateScaleGradeDto,
  ) {
    return this.scaleGrades.update(user.schoolId, id, dto);
  }

  @Delete('grades/:id')
  @CheckPolicies((ability) => ability.can('manage', 'Scale'))
  remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.scaleGrades.remove(user.schoolId, id);
  }
}
