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
import { FamiliesService } from './families.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { AddFamilyAdultDto } from './dto/add-family-adult.dto';
import { AddFamilyChildDto } from './dto/add-family-child.dto';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('families')
export class FamiliesController {
  constructor(private readonly families: FamiliesService) {}

  @Get()
  @CheckPolicies((ability) => ability.can('manage', 'Family'))
  list(@CurrentUser() user: AccessTokenPayload) {
    return this.families.list(user.schoolId);
  }

  @Post()
  @CheckPolicies((ability) => ability.can('manage', 'Family'))
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateFamilyDto,
  ) {
    return this.families.create(user.schoolId, dto);
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.can('manage', 'Family'))
  getProfile(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.families.getProfile(user.schoolId, id);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can('manage', 'Family'))
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFamilyDto,
  ) {
    return this.families.update(user.schoolId, id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can('manage', 'Family'))
  remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.families.remove(user.schoolId, id);
  }

  @Post(':id/adults')
  @CheckPolicies((ability) => ability.can('manage', 'Family'))
  addAdult(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddFamilyAdultDto,
  ) {
    return this.families.addAdult(user.schoolId, id, dto);
  }

  @Delete(':id/adults/:adultId')
  @CheckPolicies((ability) => ability.can('manage', 'Family'))
  removeAdult(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('adultId', ParseUUIDPipe) adultId: string,
  ) {
    return this.families.removeAdult(user.schoolId, id, adultId);
  }

  @Post(':id/children')
  @CheckPolicies((ability) => ability.can('manage', 'Family'))
  addChild(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddFamilyChildDto,
  ) {
    return this.families.addChild(user.schoolId, id, dto);
  }

  @Delete(':id/children/:childId')
  @CheckPolicies((ability) => ability.can('manage', 'Family'))
  removeChild(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('childId', ParseUUIDPipe) childId: string,
  ) {
    return this.families.removeChild(user.schoolId, id, childId);
  }
}
